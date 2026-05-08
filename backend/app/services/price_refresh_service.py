from datetime import datetime, timezone
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models import Holding, Portfolio, PriceSnapshot
from app.services.market_data.yahoo_provider import YahooFinanceProvider

provider = YahooFinanceProvider()
_usd_to_brl: float = 5.70  # Module-level cache for exchange rate

async def refresh_all_portfolios() -> dict:
    """Refresh prices for all holdings across all portfolios."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Holding).join(Portfolio))
        holdings = result.scalars().all()

        updated = 0
        for holding in holdings:
            if not holding.asset:
                continue
            symbol = holding.asset.yahoo_symbol or holding.asset.ticker
            quote = await provider.get_quote(symbol)
            if quote and quote.get("price"):
                price = float(quote["price"])
                holding.current_price = price
                holding.current_value = price * holding.quantity
                if holding.total_invested and holding.total_invested > 0:
                    holding.unrealized_gain = holding.current_value - holding.total_invested
                    holding.return_pct = (holding.unrealized_gain / holding.total_invested) * 100
                    holding.total_gain_including_dividends = holding.unrealized_gain

                snap = PriceSnapshot(
                    asset_id=holding.asset_id,
                    close_price=price,
                    currency=holding.currency,
                )
                db.add(snap)
                updated += 1

        await db.commit()
        return {"updated": updated, "message": f"Refreshed {updated} holdings"}

async def refresh_exchange_rate() -> dict:
    """Refresh USD/BRL exchange rate from Yahoo Finance."""
    global _usd_to_brl
    quote = await provider.get_quote("USDBRL=X")
    if quote and quote.get("price"):
        rate = float(quote["price"])
        _usd_to_brl = rate
        return {"rate": rate}
    return {"rate": _usd_to_brl}

def get_usd_to_brl() -> float:
    """Get current cached USD/BRL rate."""
    return _usd_to_brl
