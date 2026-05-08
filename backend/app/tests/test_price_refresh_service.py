import pytest
from unittest.mock import AsyncMock, patch
from app.services.price_refresh_service import refresh_all_portfolios, get_usd_to_brl

@pytest.mark.asyncio
async def test_refresh_all_portfolios_returns_dict():
    """Verify that refresh_all_portfolios returns correct dict structure."""
    with patch('app.services.price_refresh_service.AsyncSessionLocal') as mock_session:
        mock_db = AsyncMock()
        mock_db.execute = AsyncMock()
        mock_db.execute.return_value.scalars.return_value.all.return_value = []
        mock_session.return_value.__aenter__.return_value = mock_db

        result = await refresh_all_portfolios()
        assert isinstance(result, dict)
        assert "updated" in result
        assert "message" in result
        assert result["updated"] == 0  # No holdings = 0 updated

@pytest.mark.asyncio
async def test_get_usd_to_brl_returns_float():
    """Verify that get_usd_to_brl returns the cached rate."""
    rate = get_usd_to_brl()
    assert isinstance(rate, float)
    assert rate > 0
