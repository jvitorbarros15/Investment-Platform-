import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.db.models import User
from app.services.market_data.yahoo_provider import YahooFinanceProvider
from app.services.price_refresh_service import refresh_all_portfolios, refresh_exchange_rate

router = APIRouter(prefix="/market", tags=["market"])
provider = YahooFinanceProvider()
logger = logging.getLogger(__name__)

MAIN_INDEXES = [
    {"symbol": "^GSPC", "name": "S&P 500", "region": "United States"},
    {"symbol": "^IXIC", "name": "Nasdaq Composite", "region": "United States"},
    {"symbol": "^DJI", "name": "Dow Jones Industrial Average", "region": "United States"},
    {"symbol": "^RUT", "name": "Russell 2000", "region": "United States"},
    {"symbol": "^BVSP", "name": "Ibovespa", "region": "Brazil"},
    {"symbol": "^FTSE", "name": "FTSE 100", "region": "United Kingdom"},
    {"symbol": "^N225", "name": "Nikkei 225", "region": "Japan"},
    {"symbol": "^GDAXI", "name": "DAX", "region": "Germany"},
]


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


@router.get("/indexes")
async def get_indexes(
    current_user: User = Depends(get_current_user),
):
    results = []
    for item in MAIN_INDEXES:
        quote = await provider.get_quote(item["symbol"])
        results.append({
            **item,
            "ticker": item["symbol"],
            "price": quote.get("price") if quote else None,
            "currency": quote.get("currency") if quote else None,
        })
    return results


@router.get("/exchange-rate")
async def get_exchange_rate():
    """
    Fetch current USDBRL exchange rate from Yahoo Finance.
    Returns the price of USDBRL=X ticker (1 USD = X BRL).

    Note: This endpoint is intentionally public (no authentication required)
    to support public-facing market data displays.
    """
    try:
        quote = await provider.get_quote("USDBRL=X")
    except HTTPException:
        raise  # Let HTTP exceptions pass through
    except Exception as e:
        logger.error(f"Failed to fetch exchange rate from provider: {type(e).__name__}: {e}")
        raise HTTPException(status_code=503, detail="Exchange rate unavailable")

    if not quote:
        raise HTTPException(status_code=503, detail="Exchange rate unavailable")

    return {
        "rate": quote.get("price"),
        "symbol": "USDBRL",
        "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@router.post("/refresh")
async def refresh_prices(
    force: bool = False,
    current_user: User = Depends(get_current_user),
):
    exchange = await refresh_exchange_rate()
    result = await refresh_all_portfolios(force=force)
    result["usd_to_brl"] = exchange["rate"]
    return result
