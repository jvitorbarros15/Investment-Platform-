import asyncio
from datetime import datetime

import yfinance as yf

from .base import MarketDataProvider


class YahooFinanceProvider(MarketDataProvider):
    async def get_quote(self, symbol: str) -> dict:
        try:
            ticker = await asyncio.to_thread(yf.Ticker, symbol)
            info = await asyncio.to_thread(lambda: ticker.info)

            price = (
                info.get("currentPrice")
                or info.get("regularMarketPrice")
                or info.get("previousClose")
                or 0.0
            )

            return {
                "symbol": symbol,
                "price": float(price),
                "currency": info.get("currency", "USD"),
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
