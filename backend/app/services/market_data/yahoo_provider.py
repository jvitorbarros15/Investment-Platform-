import asyncio

import httpx
import yfinance as yf

from .base import MarketDataProvider

YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
YAHOO_SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search"
YAHOO_QUOTE_SUMMARY_URL = "https://query1.finance.yahoo.com/v11/finance/quoteSummary/{symbol}"


class YahooFinanceProvider(MarketDataProvider):
    async def search(self, query: str, limit: int = 8) -> list[dict]:
        if not query.strip():
            return []

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(
                    YAHOO_SEARCH_URL,
                    params={
                        "q": query.strip(),
                        "quotesCount": limit,
                        "newsCount": 0,
                        "enableFuzzyQuery": "true",
                    },
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                response.raise_for_status()
                payload = response.json()
        except Exception:
            return []

        results = []
        for item in payload.get("quotes", []):
            symbol = item.get("symbol")
            if not symbol:
                continue

            quote_type = item.get("quoteType") or item.get("typeDisp") or ""
            results.append({
                "ticker": symbol,
                "yahoo_symbol": symbol,
                "name": item.get("longname") or item.get("shortname") or item.get("name") or symbol,
                "asset_class": _asset_class_from_quote(symbol, quote_type),
                "currency": item.get("currency") or _currency_from_symbol(symbol),
                "exchange": item.get("exchDisp") or item.get("exchange"),
                "quote_type": quote_type,
                "source": "yahoo",
            })

        return results

    async def get_quote(self, symbol: str) -> dict:
        # Primary: call Yahoo quoteSummary directly via httpx (same as chart API,
        # bypasses yfinance's internal requests which fail in Docker).
        summary = await _get_quote_summary(symbol)
        if summary:
            return {"symbol": symbol, **summary}

        # Fallback: chart API — price only, no fundamentals
        chart_quote = await _get_chart_quote(symbol)
        if chart_quote:
            return chart_quote

        return {}

    async def get_price_only(self, symbol: str) -> dict:
        """Fast price fetch using chart API only. No fundamentals."""
        chart_quote = await _get_chart_quote(symbol)
        if chart_quote:
            return {"price": chart_quote.get("price"), "currency": chart_quote.get("currency", "USD")}
        return {}

    async def get_history(self, symbol: str, period: str = "1mo") -> list[dict]:
        chart_history = await _get_chart_history(symbol, period)
        if chart_history:
            return chart_history

        try:
            ticker = await asyncio.to_thread(yf.Ticker, symbol)
            hist = await asyncio.to_thread(lambda: ticker.history(period=period))

            result = []
            for date, row in hist.iterrows():
                result.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "close": float(row["Close"]),
                    "volume": int(row.get("Volume", 0)),
                })
            return result
        except Exception:
            return []


async def _get_quote_summary(symbol: str) -> dict:
    """Fetch price + fundamentals from Yahoo quoteSummary API via httpx."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                YAHOO_QUOTE_SUMMARY_URL.format(symbol=symbol),
                params={"modules": "summaryDetail,defaultKeyStatistics,price,assetProfile"},
                headers={"User-Agent": "Mozilla/5.0"},
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return {}

    result = (payload.get("quoteSummary") or {}).get("result") or []
    if not result:
        return {}

    data = result[0]
    summary = data.get("summaryDetail") or {}
    key_stats = data.get("defaultKeyStatistics") or {}
    price_info = data.get("price") or {}
    asset_profile = data.get("assetProfile") or {}

    def _raw(d: dict, key: str):
        v = d.get(key)
        if isinstance(v, dict):
            return v.get("raw")
        return v

    price = _raw(price_info, "regularMarketPrice")
    if not price:
        return {}

    change_pct_raw = _raw(price_info, "regularMarketChangePercent") or 0

    return {
        "price": float(price),
        "change_1d": _raw(price_info, "regularMarketChange") or 0,
        "change_1d_pct": float(change_pct_raw) * 100,
        "currency": price_info.get("currency", "USD"),
        "market_cap": _raw(summary, "marketCap"),
        "dividend_yield": _raw(summary, "dividendYield"),
        "pe_ratio": _raw(summary, "trailingPE"),
        "forward_pe": _raw(key_stats, "forwardPE"),
        "price_to_book": _raw(key_stats, "priceToBook"),
        "eps": _raw(key_stats, "trailingEps"),
        "beta": _raw(summary, "beta"),
        "week_52_high": _raw(summary, "fiftyTwoWeekHigh"),
        "week_52_low": _raw(summary, "fiftyTwoWeekLow"),
        "sector": asset_profile.get("sector"),
        "industry": asset_profile.get("industry"),
        "name": price_info.get("longName") or price_info.get("shortName"),
    }


async def _get_chart_quote(symbol: str) -> dict:
    chart = await _fetch_chart(symbol, range_="5d", interval="1d")
    if not chart:
        return {}

    meta = chart.get("meta", {})
    price = _first_number(
        meta,
        "regularMarketPrice",
        "previousClose",
        "chartPreviousClose",
    )

    if not price:
        quote = chart.get("indicators", {}).get("quote", [{}])[0]
        closes = [value for value in quote.get("close", []) if value is not None]
        if closes:
            price = float(closes[-1])

    if not price:
        return {}

    return {
        "symbol": symbol,
        "price": float(price),
        "change_1d": None,
        "change_1d_pct": None,
        "currency": meta.get("currency", "USD"),
        "market_cap": None,
        "dividend_yield": None,
        "pe_ratio": None,
        "forward_pe": None,
        "price_to_book": None,
        "eps": None,
        "beta": None,
        "week_52_high": None,
        "week_52_low": None,
        "sector": None,
        "industry": None,
        "name": meta.get("shortName") or meta.get("longName") or symbol,
    }


async def _get_chart_history(symbol: str, period: str) -> list[dict]:
    chart = await _fetch_chart(symbol, range_=period, interval="1d")
    if not chart:
        return []

    timestamps = chart.get("timestamp") or []
    quote = chart.get("indicators", {}).get("quote", [{}])[0]
    closes = quote.get("close") or []
    volumes = quote.get("volume") or []

    result = []
    for index, timestamp in enumerate(timestamps):
        close = closes[index] if index < len(closes) else None
        if close is None:
            continue
        volume = volumes[index] if index < len(volumes) and volumes[index] is not None else 0
        result.append({
            "date": _format_unix_date(timestamp),
            "close": float(close),
            "volume": int(volume),
        })
    return result


async def _fetch_chart(symbol: str, range_: str, interval: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                YAHOO_CHART_URL.format(symbol=symbol),
                params={"range": range_, "interval": interval},
                headers={"User-Agent": "Mozilla/5.0"},
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return {}

    result = payload.get("chart", {}).get("result") or []
    if not result:
        return {}
    return result[0]


def _format_unix_date(timestamp: int) -> str:
    from datetime import datetime, timezone

    return datetime.fromtimestamp(timestamp, tz=timezone.utc).strftime("%Y-%m-%d")


def _first_number(data: dict, *keys: str) -> float:
    for key in keys:
        value = data.get(key)
        if value is None:
            continue
        try:
            number = float(value)
        except (TypeError, ValueError):
            continue
        if number > 0:
            return number
    return 0.0


def _asset_class_from_quote(symbol: str, quote_type: str) -> str:
    normalized = quote_type.upper()
    if normalized in {"INDEX", "INDEXES"} or symbol.startswith("^"):
        return "INDEX"
    if "ETF" in normalized:
        return "ETF"
    if "CRYPTO" in normalized or "-USD" in symbol:
        return "CRYPTO"
    if symbol.endswith(".SA") or any(char.isdigit() for char in symbol):
        return "BR_STOCK"
    return "US_STOCK"


def _currency_from_symbol(symbol: str) -> str:
    if symbol.endswith(".SA"):
        return "BRL"
    return "USD"
