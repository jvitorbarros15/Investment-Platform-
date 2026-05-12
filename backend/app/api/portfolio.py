from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_user
from app.db.models import Holding, Portfolio, User
from app.db.session import get_db
from app.services.portfolio_service import _holding_summary, get_portfolio_summary
from datetime import datetime, timedelta, timezone
from sqlalchemy import and_
from app.db.models import PriceSnapshot
from app.services.price_refresh_service import get_usd_to_brl

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

    # Per-class current_value totals for weight_in_class
    class_totals: dict[str, float] = {}
    for h in holdings:
        cls = h.asset.asset_class if h.asset else "UNKNOWN"
        class_totals[cls] = class_totals.get(cls, 0.0) + (h.current_value or 0.0)

    # Get yesterday's prices from PriceSnapshot for change_1d
    asset_ids = [h.asset_id for h in holdings if h.asset_id]
    prev_price: dict[str, float] = {}
    if asset_ids:
        cutoff = datetime.now(timezone.utc) - timedelta(days=2)
        snaps_result = await db.execute(
            select(PriceSnapshot)
            .where(and_(
                PriceSnapshot.asset_id.in_(asset_ids),
                PriceSnapshot.timestamp >= cutoff,
            ))
            .order_by(PriceSnapshot.asset_id, PriceSnapshot.timestamp.desc())
        )
        snaps = snaps_result.scalars().all()
        seen_count: dict[str, int] = {}
        for snap in snaps:
            aid = str(snap.asset_id)
            seen_count[aid] = seen_count.get(aid, 0) + 1
            if seen_count[aid] == 2:
                prev_price[aid] = snap.close_price

    rows = []
    for h in holdings:
        summary = _holding_summary(h)
        cls = summary["asset_class"]
        total = class_totals.get(cls, 0.0)
        summary["weight_in_class"] = round((h.current_value or 0.0) / total * 100, 2) if total > 0 else 0.0
        prev = prev_price.get(str(h.asset_id))
        if prev and h.current_price and h.quantity:
            summary["change_1d"] = round((h.current_price - prev) * h.quantity, 2)
        else:
            summary["change_1d"] = None
        rows.append(summary)

    return rows


@router.get("/allocation")
async def allocation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = await _get_portfolio(current_user, db)
    summary = await get_portfolio_summary(db, portfolio.id)
    return summary["allocation"]


@router.get("/history")
async def portfolio_history(
    period: str = "30d",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get historical portfolio values by aggregating PriceSnapshots."""
    try:
        portfolio = await _get_portfolio(current_user, db)

        # Parse period (e.g., "30d" → 30 days)
        try:
            days = int(period.rstrip("d"))
        except (ValueError, AttributeError):
            days = 30

        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        # Fetch all holdings for this portfolio (once, not in loop)
        holdings_result = await db.execute(
            select(Holding).where(Holding.portfolio_id == portfolio.id)
        )
        holdings_map = {h.asset_id: h for h in holdings_result.scalars().all()}

        if not holdings_map:
            return []

        # Get all snapshots for this portfolio's assets after cutoff
        result = await db.execute(
            select(PriceSnapshot)
            .where(and_(
                PriceSnapshot.asset_id.in_(list(holdings_map.keys())),
                PriceSnapshot.timestamp >= cutoff
            ))
            .order_by(PriceSnapshot.timestamp)
        )
        snapshots = result.scalars().all()

        if not snapshots:
            return []

        # Aggregate by date
        from collections import defaultdict
        daily = defaultdict(float)
        rate = get_usd_to_brl()

        # Validate exchange rate
        if not isinstance(rate, (int, float)) or rate <= 0:
            rate = 5.70  # Fallback to default if invalid

        for snap in snapshots:
            holding = holdings_map.get(snap.asset_id)
            if not holding:
                continue

            date_key = snap.timestamp.strftime("%Y-%m-%d")
            multiplier = rate if snap.currency == "USD" else 1.0
            daily[date_key] += snap.close_price * holding.quantity * multiplier

        # Return sorted by date
        result_list = [
            {"date": date, "value": round(value, 2)}
            for date, value in sorted(daily.items())
        ]

        return result_list if result_list else []

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error retrieving portfolio history: {e}")
        return []
