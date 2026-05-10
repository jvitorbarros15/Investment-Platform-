from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.models import Asset, User
from app.db.session import get_db
from app.services.market_data.yahoo_provider import YahooFinanceProvider

router = APIRouter(prefix="/assets", tags=["assets"])
provider = YahooFinanceProvider()


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
    local_results: list[dict] = []
    result = await db.execute(
        select(Asset).where(
            or_(
                Asset.ticker.ilike(f"%{q}%"),
                Asset.name.ilike(f"%{q}%"),
            )
        ).limit(20)
    )
    assets = result.scalars().all()
    for a in assets:
        local_results.append({
            "id": a.id,
            "ticker": a.ticker,
            "yahoo_symbol": a.yahoo_symbol or a.ticker,
            "name": a.name,
            "asset_class": a.asset_class,
            "currency": a.currency,
            "exchange": a.exchange,
            "quote_type": "LOCAL",
            "source": "local",
        })

    yahoo_results = await provider.search(q, limit=12)
    seen = {item["ticker"] for item in local_results}
    merged = local_results[:]
    for item in yahoo_results:
        if item["ticker"] in seen:
            continue
        seen.add(item["ticker"])
        merged.append(item)

    return merged[:20]


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
