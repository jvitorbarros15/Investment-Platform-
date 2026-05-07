from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.models import AlertEvent, AlertRule, User
from app.db.session import get_db

router = APIRouter(prefix="/alerts", tags=["alerts"])


class AlertRuleCreate(BaseModel):
    ticker: Optional[str] = None
    alert_type: str
    threshold_value: Optional[float] = None


@router.get("/")
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AlertEvent)
        .where(AlertEvent.user_id == current_user.id)
        .order_by(AlertEvent.triggered_at.desc())
        .limit(50)
    )
    events = result.scalars().all()
    return [
        {
            "id": e.id,
            "ticker": e.ticker,
            "message": e.message,
            "triggered_at": e.triggered_at,
            "is_read": e.is_read,
        }
        for e in events
    ]


@router.post("/rules", status_code=201)
async def create_rule(
    body: AlertRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = AlertRule(
        user_id=current_user.id,
        ticker=body.ticker,
        alert_type=body.alert_type,
        threshold_value=body.threshold_value,
    )
    db.add(rule)
    await db.commit()
    return {"id": rule.id}


@router.post("/mark-read/{event_id}")
async def mark_read(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AlertEvent).where(AlertEvent.id == event_id, AlertEvent.user_id == current_user.id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(404, "Event not found")
    event.is_read = True
    await db.commit()
    return {"message": "Marked as read"}


@router.delete("/rules/{rule_id}", status_code=204)
async def delete_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AlertRule).where(AlertRule.id == rule_id, AlertRule.user_id == current_user.id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(404, "Rule not found")
    await db.delete(rule)
    await db.commit()
