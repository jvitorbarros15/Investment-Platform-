from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.models import PhilosophyProfile, User
from app.db.session import get_db

router = APIRouter(prefix="/philosophy", tags=["philosophy"])


class PhilosophyUpdate(BaseModel):
    name: Optional[str] = None
    quality_weight: Optional[float] = None
    value_weight: Optional[float] = None
    growth_weight: Optional[float] = None
    dividend_weight: Optional[float] = None
    financial_health_weight: Optional[float] = None
    momentum_weight: Optional[float] = None
    risk_weight: Optional[float] = None
    portfolio_fit_weight: Optional[float] = None


@router.get("/")
async def get_philosophy(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PhilosophyProfile).where(PhilosophyProfile.user_id == current_user.id)
    )
    profiles = result.scalars().all()
    if not profiles:
        profile = PhilosophyProfile(user_id=current_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        profiles = [profile]
    return [
        {
            "id": p.id,
            "name": p.name,
            "quality_weight": p.quality_weight,
            "value_weight": p.value_weight,
            "growth_weight": p.growth_weight,
            "dividend_weight": p.dividend_weight,
            "financial_health_weight": p.financial_health_weight,
            "momentum_weight": p.momentum_weight,
            "risk_weight": p.risk_weight,
            "portfolio_fit_weight": p.portfolio_fit_weight,
        }
        for p in profiles
    ]


@router.put("/{profile_id}")
async def update_philosophy(
    profile_id: str,
    body: PhilosophyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PhilosophyProfile).where(
            PhilosophyProfile.id == profile_id,
            PhilosophyProfile.user_id == current_user.id,
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Profile not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.commit()
    return {"message": "Updated"}
