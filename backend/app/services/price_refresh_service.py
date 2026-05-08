import logging
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal
from app.db.models import Holding, Portfolio, PriceSnapshot
from app.services.market_data.yahoo_provider import YahooFinanceProvider

logger = logging.getLogger(__name__)
provider = YahooFinanceProvider()
_usd_to_brl: float = 5.70  # Module-level cache for exchange rate

async def refresh_all_portfolios() -> dict:
    """Refresh prices for all holdings across all portfolios."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Holding)
            .join(Portfolio)
            .options(selectinload(Holding.asset))
        )
        holdings = result.scalars().all()

        updated = 0
        skipped = 0
        for holding in holdings:
            if not holding.asset:
                logger.debug(f"Skipping holding {holding.id}: no asset")
                skipped += 1
                continue

            symbol = holding.asset.yahoo_symbol or holding.asset.ticker
            if not symbol:
                logger.warning(f"Holding {holding.id} has no ticker/symbol")
                skipped += 1
                continue

            try:
                quote = await provider.get_quote(symbol)
                if not quote or not quote.get("price"):
                    logger.debug(f"No price data for {symbol}")
                    skipped += 1
                    continue

                price = float(quote["price"])
                if price <= 0:
                    logger.warning(f"Invalid price {price} for {symbol}")
                    skipped += 1
                    continue

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
            except Exception as e:
                logger.error(f"Error refreshing {symbol}: {e}")
                skipped += 1
                continue

        await db.commit()
        logger.info(f"Refresh complete: {updated} updated, {skipped} skipped")
        return {"updated": updated, "message": f"Refreshed {updated} holdings"}

async def refresh_exchange_rate() -> dict:
    """Refresh USD/BRL exchange rate from Yahoo Finance."""
    global _usd_to_brl
    try:
        quote = await provider.get_quote("USDBRL=X")
        if quote and quote.get("price"):
            rate = float(quote["price"])
            if rate > 0:
                _usd_to_brl = rate
                logger.info(f"Exchange rate updated: {rate}")
                return {"rate": rate}
            else:
                logger.warning(f"Invalid rate {rate}")
    except Exception as e:
        logger.error(f"Error fetching exchange rate: {e}")
    return {"rate": _usd_to_brl}

def get_usd_to_brl() -> float:
    """Get current cached USD/BRL rate."""
    return _usd_to_brl
