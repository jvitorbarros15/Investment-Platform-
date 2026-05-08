from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.db.models import User
from app.services.market_data.yahoo_provider import YahooFinanceProvider
from app.services.price_refresh_service import refresh_all_portfolios, refresh_exchange_rate

router = APIRouter(prefix="/market", tags=["market"])
provider = YahooFinanceProvider()


@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    data = await provider.get_quote(symbol)
    if not data:
        raise HTTPException(404, f"No data for symbol {symbol}")
    return data


@router.get("/history/{symbol}")
async def get_history(symbol: str, period: str = "1mo"):
    data = await provider.get_history(symbol, period)
    return data


@router.post("/refresh")
async def refresh_prices(
    force: bool = False,
    current_user: User = Depends(get_current_user),
):
    exchange = await refresh_exchange_rate()
    result = await refresh_all_portfolios(force=force)
    result["usd_to_brl"] = exchange["rate"]
    return result
