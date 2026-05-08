import asyncio
from datetime import datetime

import yfinance as yf

from .base import MarketDataProvider


class YahooFinanceProvider(MarketDataProvider):
    async def get_quote(self, symbol: str) -> dict:
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
