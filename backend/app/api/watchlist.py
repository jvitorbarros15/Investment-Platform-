from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.models import User, WatchlistItem
from app.db.session import get_db

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


class WatchlistCreate(BaseModel):
    ticker: str
    target_price: Optional[float] = None
    status: str = "STUDYING"
    reason: Optional[str] = None
    notes: Optional[str] = None


class WatchlistUpdate(BaseModel):
    target_price: Optional[float] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None


@router.get("/")
async def list_watchlist(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(WatchlistItem)
        .where(WatchlistItem.user_id == current_user.id)
        .order_by(WatchlistItem.created_at.desc())
    )
    items = result.scalars().all()
    return [
        {
            "id": i.id,
            "ticker": i.ticker,
            "target_price": i.target_price,
            "status": i.status,
            "reason": i.reason,
            "notes": i.notes,
            "created_at": i.created_at,
        }
        for i in items
    ]


@router.post("/", status_code=201)
async def add_to_watchlist(
    body: WatchlistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = WatchlistItem(
        user_id=current_user.id,
        ticker=body.ticker.upper(),
        target_price=body.target_price,
        status=body.status,
        reason=body.reason,
        notes=body.notes,
    )
    db.add(item)
    await db.commit()
    return {"id": item.id}


@router.put("/{item_id}")
async def update_watchlist_item(
    item_id: str,
    body: WatchlistUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(WatchlistItem).where(WatchlistItem.id == item_id, WatchlistItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await db.commit()
    return {"message": "Updated"}


@router.delete("/{item_id}", status_code=204)
async def delete_watchlist_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(WatchlistItem).where(WatchlistItem.id == item_id, WatchlistItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    await db.delete(item)
    await db.commit()
