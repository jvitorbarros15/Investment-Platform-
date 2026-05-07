from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_user
from app.db.models import Asset, AssetScore, Holding, PhilosophyProfile, Portfolio, User
from app.db.session import get_db

router = APIRouter(prefix="/scores", tags=["scores"])


def _simple_score(return_pct: float, asset_class: str) -> dict:
    """Naive score based on historical return and asset class."""
    base = min(max(return_pct, -100), 100)
    normalized = (base + 100) / 2  # -100..100 → 0..100

    risk_penalty = {"CRYPTO": 15, "US_STOCK": 5, "BR_STOCK": 0, "FII": 0}.get(asset_class, 0)
    score = max(0, min(100, normalized - risk_penalty))

    label = (
        "Excellent fit" if score >= 90 else
        "Strong fit" if score >= 75 else
        "Worth studying" if score >= 60 else
        "Weak fit" if score >= 40 else
        "Avoid / review"
    )
    return {"overall_score": round(score, 1), "label": label, "momentum_score": round(normalized, 1)}


@router.get("/{asset_id}")
async def get_score(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(404, "Asset not found")

    # Try to find holding for return_pct
    port_result = await db.execute(select(Portfolio).where(Portfolio.user_id == current_user.id))
    portfolio = port_result.scalars().first()

    return_pct = 0.0
    if portfolio:
        h_result = await db.execute(
            select(Holding).where(Holding.portfolio_id == portfolio.id, Holding.asset_id == asset_id)
        )
        holding = h_result.scalar_one_or_none()
        if holding:
            return_pct = holding.return_pct or 0.0

    score = _simple_score(return_pct, asset.asset_class)
    return {
        "asset_id": asset_id,
        "ticker": asset.ticker,
        "name": asset.name,
        **score,
        "explanation": f"Score based on {return_pct:+.1f}% return. Asset class risk adjustment applied.",
    }
