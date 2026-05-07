from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.models import Asset, User
from app.db.session import get_db

router = APIRouter(prefix="/assets", tags=["assets"])


class AssetCreate(BaseModel):
    ticker: str
    yahoo_symbol: str | None = None
    name: str
    asset_class: str
    currency: str = "BRL"
    sector: str | None = None
    country: str | None = None


@router.get("/search")
async def search_assets(
    q: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Asset).where(
            or_(
                Asset.ticker.ilike(f"%{q}%"),
                Asset.name.ilike(f"%{q}%"),
            )
        ).limit(20)
    )
    assets = result.scalars().all()
    return [{"id": a.id, "ticker": a.ticker, "name": a.name, "asset_class": a.asset_class, "currency": a.currency} for a in assets]


@router.get("/{asset_id}")
async def get_asset(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(404, "Asset not found")
    return asset


@router.post("/", status_code=201)
async def create_asset(
    body: AssetCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    existing = await db.execute(select(Asset).where(Asset.ticker == body.ticker.upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Ticker already exists")
    asset = Asset(**body.model_dump(), ticker=body.ticker.upper())
    db.add(asset)
    await db.commit()
    return {"id": asset.id}
