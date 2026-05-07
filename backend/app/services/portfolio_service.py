from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.models import Asset, Holding, Portfolio

USD_TO_BRL = settings.USD_TO_BRL


async def get_portfolio_summary(db: AsyncSession, portfolio_id: str) -> dict:
    result = await db.execute(
        select(Holding)
        .options(selectinload(Holding.asset))
        .where(Holding.portfolio_id == portfolio_id)
    )
    holdings = result.scalars().all()

    total_value_brl = 0.0
    total_invested_brl = 0.0
    total_gain_brl = 0.0
    allocation: dict[str, dict] = {}

    for h in holdings:
        rate = USD_TO_BRL if h.currency == "USD" else 1.0
        val = (h.current_value or 0) * rate
        inv = (h.total_invested or 0) * rate
        gain = (h.total_gain_including_dividends or 0) * rate

        total_value_brl += val
        total_invested_brl += inv
        total_gain_brl += gain

        cls = h.asset.asset_class if h.asset else "UNKNOWN"
        if cls not in allocation:
            allocation[cls] = {"name": cls, "value": 0.0, "color": _class_color(cls)}
        allocation[cls]["value"] += val

    total_return_pct = (
        (total_gain_brl / total_invested_brl * 100) if total_invested_brl > 0 else 0.0
    )

    allocation_list = []
    for cls, data in allocation.items():
        data["pct"] = (data["value"] / total_value_brl * 100) if total_value_brl > 0 else 0
        allocation_list.append(data)

    # Sort holdings for top gainers / losers
    sorted_holdings = sorted(holdings, key=lambda h: h.return_pct or 0, reverse=True)
    top_gainers = [_holding_summary(h) for h in sorted_holdings[:3] if (h.return_pct or 0) > 0]
    top_losers = [_holding_summary(h) for h in sorted_holdings[-3:] if (h.return_pct or 0) < 0]

    return {
        "total_value_brl": round(total_value_brl, 2),
        "total_invested_brl": round(total_invested_brl, 2),
        "total_gain_brl": round(total_gain_brl, 2),
        "total_return_pct": round(total_return_pct, 2),
        "usd_to_brl": USD_TO_BRL,
        "allocation": allocation_list,
        "top_gainers": top_gainers,
        "top_losers": top_losers,
    }


def _holding_summary(h: Holding) -> dict:
    return {
        "ticker": h.asset.ticker if h.asset else "?",
        "name": h.asset.name if h.asset else "",
        "asset_class": h.asset.asset_class if h.asset else "",
        "currency": h.currency,
        "current_value": h.current_value,
        "total_gain": h.total_gain_including_dividends,
        "return_pct": h.return_pct,
    }


def _class_color(cls: str) -> str:
    colors = {
        "BR_STOCK": "#C9963C",
        "FII": "#3B82F6",
        "US_STOCK": "#8B5CF6",
        "CRYPTO": "#10B981",
        "ETF": "#F59E0B",
        "CASH": "#6B7280",
    }
    return colors.get(cls, "#4A5568")
