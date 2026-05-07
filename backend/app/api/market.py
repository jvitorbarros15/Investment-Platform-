from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_user
from app.db.models import Asset, Holding, Portfolio, PriceSnapshot, User
from app.db.session import get_db
from app.services.market_data.yahoo_provider import YahooFinanceProvider

router = APIRouter(prefix="/market", tags=["market"])
provider = YahooFinanceProvider()


@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    data = await provider.get_quote(symbol)
    if not data:
        raise HTTPException(404, f"No data for symbol {symbol}")
    return data


@router.get("/history/{symbol}")
async def get_history(symbol: str, period: str = "1mo"):
    data = await provider.get_history(symbol, period)
    return data


@router.post("/refresh")
async def refresh_prices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Portfolio).where(Portfolio.user_id == current_user.id))
    portfolio = result.scalars().first()
    if not portfolio:
        return {"updated": 0}

    result = await db.execute(
        select(Holding)
        .options(selectinload(Holding.asset))
        .where(Holding.portfolio_id == portfolio.id)
    )
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
