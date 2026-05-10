import asyncio

import httpx
import yfinance as yf

from .base import MarketDataProvider

YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
YAHOO_SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search"


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
        chart_quote = await _get_chart_quote(symbol)
        if chart_quote:
            return chart_quote

        try:
            ticker = await asyncio.to_thread(yf.Ticker, symbol)
            info = {}
            fast_info = {}

            try:
                fast_info = await asyncio.to_thread(lambda: dict(ticker.fast_info))
            except Exception:
                fast_info = {}

            price = _first_number(
                fast_info,
                "last_price",
                "lastPrice",
                "regularMarketPrice",
                "previousClose",
            )

            if not price:
                try:
                    info = await asyncio.to_thread(lambda: ticker.info)
                    price = _first_number(
                        info,
                        "currentPrice",
                        "regularMarketPrice",
                        "previousClose",
                    )
                except Exception:
                    info = {}

            if not price:
                hist = await asyncio.to_thread(lambda: ticker.history(period="5d"))
                if not hist.empty:
                    price = float(hist["Close"].dropna().iloc[-1])

            if not price:
                return {}

            return {
                "symbol": symbol,
                "price": float(price),
                "currency": info.get("currency") or fast_info.get("currency", "USD"),
                "market_cap": info.get("marketCap"),
                "dividend_yield": info.get("dividendYield"),
                "pe_ratio": info.get("trailingPE"),
                "forward_pe": info.get("forwardPE"),
                "beta": info.get("beta"),
                "52w_high": info.get("fiftyTwoWeekHigh"),
                "52w_low": info.get("fiftyTwoWeekLow"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "name": info.get("longName") or info.get("shortName"),
            }
        except Exception:
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
        "currency": meta.get("currency", "USD"),
        "market_cap": None,
        "dividend_yield": None,
        "pe_ratio": None,
        "forward_pe": None,
        "beta": None,
        "52w_high": None,
        "52w_low": None,
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
