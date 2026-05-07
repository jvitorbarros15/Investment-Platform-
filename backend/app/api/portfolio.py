from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_user
from app.db.models import Holding, Portfolio, User
from app.db.session import get_db
from app.services.portfolio_service import _holding_summary, get_portfolio_summary

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


async def _get_portfolio(user: User, db: AsyncSession) -> Portfolio:
    result = await db.execute(select(Portfolio).where(Portfolio.user_id == user.id))
    portfolio = result.scalars().first()
    if not portfolio:
        portfolio = Portfolio(user_id=user.id, name="My Portfolio")
        db.add(portfolio)
        await db.commit()
        await db.refresh(portfolio)
    return portfolio


@router.get("/summary")
async def summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = await _get_portfolio(current_user, db)
    return await get_portfolio_summary(db, portfolio.id)


@router.get("/holdings")
async def holdings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = await _get_portfolio(current_user, db)
    result = await db.execute(
        select(Holding)
        .options(selectinload(Holding.asset))
        .where(Holding.portfolio_id == portfolio.id)
        .order_by(Holding.current_value.desc())
    )
    holdings = result.scalars().all()
    return [_holding_summary(h) for h in holdings]


@router.get("/allocation")
async def allocation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = await _get_portfolio(current_user, db)
    summary = await get_portfolio_summary(db, portfolio.id)
    return summary["allocation"]
