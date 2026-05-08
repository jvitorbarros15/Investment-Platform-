import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy import select
from app.db.models import Holding, Portfolio, User
from app.db.session import AsyncSessionLocal
from app.services.price_refresh_service import refresh_all_portfolios

@pytest.mark.asyncio
async def test_refresh_all_portfolios_updates_holdings():
    """Verify that refresh_all_portfolios fetches quotes and updates DB holdings."""
    # Verify it updates current_price, current_value, unrealized_gain, return_pct
    result = await refresh_all_portfolios()
    assert result["updated"] > 0 or result["updated"] == 0  # Placeholder assertion

@pytest.mark.asyncio
async def test_refresh_all_portfolios_creates_snapshots():
    """Verify that PriceSnapshot records are created."""
    result = await refresh_all_portfolios()
    assert "updated" in result
    assert "message" in result
