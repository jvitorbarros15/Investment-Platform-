from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_user
from app.db.models import Asset, Holding, Portfolio, Transaction, User
from app.db.session import get_db

router = APIRouter(prefix="/transactions", tags=["transactions"])


class TransactionCreate(BaseModel):
    ticker: str
    transaction_type: str
    date: Optional[datetime] = None
    quantity: float
    price: float
    fees: float = 0.0
    currency: str = "BRL"
    notes: Optional[str] = None


class TransactionOut(BaseModel):
    id: str
    ticker: str
    transaction_type: str
    date: datetime
    quantity: float
    price: float
    gross_amount: float
    fees: float
    currency: str
    notes: Optional[str]

    class Config:
        from_attributes = True


async def _get_portfolio(user: User, db: AsyncSession) -> Portfolio:
    result = await db.execute(select(Portfolio).where(Portfolio.user_id == user.id))
    portfolio = result.scalars().first()
    if not portfolio:
        portfolio = Portfolio(user_id=user.id)
        db.add(portfolio)
        await db.commit()
        await db.refresh(portfolio)
    return portfolio


@router.get("/")
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = await _get_portfolio(current_user, db)
    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.asset))
        .where(Transaction.portfolio_id == portfolio.id)
        .order_by(Transaction.date.desc())
    )
    txs = result.scalars().all()
    return [
        {
            "id": t.id,
            "ticker": t.asset.ticker if t.asset else "?",
            "transaction_type": t.transaction_type,
            "date": t.date,
            "quantity": t.quantity,
            "price": t.price,
            "gross_amount": t.gross_amount,
            "fees": t.fees,
            "currency": t.currency,
            "notes": t.notes,
        }
        for t in txs
    ]


@router.post("/", status_code=201)
async def create_transaction(
    body: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = await _get_portfolio(current_user, db)

    # Find or create asset
    result = await db.execute(select(Asset).where(Asset.ticker == body.ticker.upper()))
    asset = result.scalar_one_or_none()
    if not asset:
        asset = Asset(ticker=body.ticker.upper(), name=body.ticker.upper(), asset_class="BR_STOCK", currency=body.currency)
        db.add(asset)
        await db.flush()

    tx = Transaction(
        portfolio_id=portfolio.id,
        asset_id=asset.id,
        transaction_type=body.transaction_type.upper(),
        date=body.date or datetime.now(timezone.utc),
        quantity=body.quantity,
        price=body.price,
        gross_amount=body.quantity * body.price,
        fees=body.fees,
        currency=body.currency,
        notes=body.notes,
    )
    db.add(tx)
    await db.commit()
    return {"id": tx.id, "message": "Transaction created"}


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(404, "Transaction not found")
    await db.delete(tx)
    await db.commit()
