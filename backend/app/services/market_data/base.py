from abc import ABC, abstractmethod


class MarketDataProvider(ABC):
    @abstractmethod
    async def get_quote(self, symbol: str) -> dict:
        """Return dict with price, currency, market_cap, dividend_yield, pe_ratio, beta, 52w_high, 52w_low, sector"""
        ...

    @abstractmethod
    async def get_history(self, symbol: str, period: str = "1mo") -> list[dict]:
        """Return list of {date, close, volume}"""
        ...
