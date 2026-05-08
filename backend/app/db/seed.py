from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.db.models import (
    AlertEvent,
    Asset,
    Holding,
    PhilosophyProfile,
    Portfolio,
    Transaction,
    User,
    WatchlistItem,
)
from app.db.session import AsyncSessionLocal

SEED_ASSETS = [
    # Brazilian Stocks
    {"ticker": "BBAS3", "yahoo_symbol": "BBAS3.SA", "name": "Banco do Brasil S/A", "asset_class": "BR_STOCK", "currency": "BRL", "sector": "Financials", "country": "Brazil", "current_value": 2768.60, "total_gain": 711.42, "return_pct": 25.69, "total_invested": 2769.60},
    {"ticker": "BBSE3", "yahoo_symbol": "BBSE3.SA", "name": "BB Seguridade Participacoes S/A", "asset_class": "BR_STOCK", "currency": "BRL", "sector": "Insurance", "country": "Brazil", "current_value": 620.10, "total_gain": 333.75, "return_pct": 32.45, "total_invested": 1028.00},
    {"ticker": "ISAE4", "yahoo_symbol": "ISAE4.SA", "name": "ISA Energia", "asset_class": "BR_STOCK", "currency": "BRL", "sector": "Utilities", "country": "Brazil", "current_value": 4220.13, "total_gain": 1288.89, "return_pct": 41.44, "total_invested": 3110.27},
    {"ticker": "TAEE11", "yahoo_symbol": "TAEE11.SA", "name": "Transmissora Alianca de Energia", "asset_class": "BR_STOCK", "currency": "BRL", "sector": "Utilities", "country": "Brazil", "current_value": 286.79, "total_gain": 343.87, "return_pct": 51.02, "total_invested": 673.79},
    # FIIs
    {"ticker": "KNCR11", "yahoo_symbol": "KNCR11.SA", "name": "FII Kinea RI", "asset_class": "FII", "currency": "BRL", "sector": "Real Estate", "country": "Brazil", "current_value": 746.34, "total_gain": 531.38, "return_pct": 61.69, "total_invested": 861.29},
    {"ticker": "MFII11", "yahoo_symbol": "MFII11.SA", "name": "FII Merito I", "asset_class": "FII", "currency": "BRL", "sector": "Real Estate", "country": "Brazil", "current_value": 1393.68, "total_gain": 688.44, "return_pct": 14.62, "total_invested": 4709.58},
    # US Stocks
    {"ticker": "IONQ", "yahoo_symbol": "IONQ", "name": "IonQ Inc", "asset_class": "US_STOCK", "currency": "USD", "sector": "Technology", "country": "USA", "current_value": 93.63, "total_gain": -6.65, "return_pct": -6.63, "total_invested": 100.28},
    {"ticker": "QBTS", "yahoo_symbol": "QBTS", "name": "D-Wave Quantum Inc", "asset_class": "US_STOCK", "currency": "USD", "sector": "Technology", "country": "USA", "current_value": 66.04, "total_gain": -9.13, "return_pct": -12.14, "total_invested": 75.17},
    {"ticker": "NVDA", "yahoo_symbol": "NVDA", "name": "Nvidia Corp", "asset_class": "US_STOCK", "currency": "USD", "sector": "Technology", "country": "USA", "current_value": 44.61, "total_gain": 4.61, "return_pct": 11.53, "total_invested": 40.00},
    {"ticker": "RGTI", "yahoo_symbol": "RGTI", "name": "Rigetti Computing Inc", "asset_class": "US_STOCK", "currency": "USD", "sector": "Technology", "country": "USA", "current_value": 30.55, "total_gain": -29.44, "return_pct": -49.07, "total_invested": 59.99},
    # Crypto
    {"ticker": "BTC", "yahoo_symbol": "BTC-USD", "name": "Bitcoin", "asset_class": "CRYPTO", "currency": "USD", "sector": "Crypto", "country": "Global", "current_value": 689.57, "total_gain": 0, "return_pct": 0, "total_invested": 689.57, "quantity": 0.00849051},
    {"ticker": "XRP", "yahoo_symbol": "XRP-USD", "name": "XRP", "asset_class": "CRYPTO", "currency": "USD", "sector": "Crypto", "country": "Global", "current_value": 12.96, "total_gain": 0, "return_pct": 0, "total_invested": 12.96, "quantity": 9.162},
    {"ticker": "CRO", "yahoo_symbol": "CRO-USD", "name": "Cronos", "asset_class": "CRYPTO", "currency": "USD", "sector": "Crypto", "country": "Global", "current_value": 0.22, "total_gain": 0, "return_pct": 0, "total_invested": 0.22, "quantity": 3.1427},
    {"ticker": "PENGU", "yahoo_symbol": "PENGU-USD", "name": "Pudgy Penguins", "asset_class": "CRYPTO", "currency": "USD", "sector": "Crypto", "country": "Global", "current_value": 0.04, "total_gain": 0, "return_pct": 0, "total_invested": 0.04, "quantity": 4.4027},
    {"ticker": "SHIB", "yahoo_symbol": "SHIB-USD", "name": "Shiba Inu", "asset_class": "CRYPTO", "currency": "USD", "sector": "Crypto", "country": "Global", "current_value": 0.01, "total_gain": 0, "return_pct": 0, "total_invested": 0.01, "quantity": 2185.07},
]

SEED_USER_ID = "00000000-0000-0000-0000-000000000001"

WATCHLIST_SEEDS = [
    {"ticker": "VALE3", "status": "STUDYING", "reason": "Iron ore play, dividend yield", "notes": "Waiting for better entry. Track quarterly earnings.", "target_price": 85.0},
    {"ticker": "MXRF11", "status": "WAITING_PRICE", "reason": "FII with strong yield", "notes": "Good DY but waiting for R$ 10.50 target.", "target_price": 10.50},
    {"ticker": "AAPL", "status": "STRONG_CANDIDATE", "reason": "Services growth + buybacks", "notes": "Quality play. Strong margins.", "target_price": 185.0},
    {"ticker": "PETR4", "status": "STUDYING", "reason": "Oil + dividend play", "notes": "Political risk factor. Monitor Petrobras policy.", "target_price": 40.0},
    {"ticker": "USAR", "status": "STUDYING", "reason": "US uranium + rare earth exposure", "notes": "Beneficiary of energy transition and supply chain diversification.", "target_price": 28.0},
    {"ticker": "TSM", "status": "STRONG_CANDIDATE", "reason": "Leading semiconductor foundry + AI exposure", "notes": "Critical player in chip supply chain, strong financials.", "target_price": 140.0},
    {"ticker": "NNE", "status": "STUDYING", "reason": "Nuclear energy infrastructure", "notes": "Positioned for nuclear renaissance in clean energy.", "target_price": 32.0},
    {"ticker": "SMR", "status": "WAITING_PRICE", "reason": "Small modular reactor technology", "notes": "Emerging technology, waiting for better risk/reward entry.", "target_price": 24.5},
    {"ticker": "PLTR", "status": "STRONG_CANDIDATE", "reason": "AI + data analytics leader with defense contracts", "notes": "Strong growth trajectory, expanding commercial customer base.", "target_price": 35.0},
]


async def seed_database():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(User).where(User.email == "admin@invest.local"))
        if result.scalar_one_or_none():
            return

        # Create user
        user = User(
            id=SEED_USER_ID,
            email="admin@invest.local",
            hashed_password=get_password_hash("invest123"),
            base_currency="BRL",
        )
        db.add(user)
        await db.flush()

        # Create portfolio
        portfolio = Portfolio(user_id=user.id, name="My Portfolio", base_currency="BRL")
        db.add(portfolio)
        await db.flush()

        # Create philosophy profile
        profile = PhilosophyProfile(
            user_id=user.id,
            name="Dividends + Quality",
            quality_weight=25.0,
            value_weight=20.0,
            growth_weight=10.0,
            dividend_weight=20.0,
            financial_health_weight=15.0,
            momentum_weight=3.0,
            risk_weight=4.0,
            portfolio_fit_weight=3.0,
        )
        db.add(profile)
        await db.flush()

        # Create assets and holdings
        for a in SEED_ASSETS:
            asset = Asset(
                ticker=a["ticker"],
                yahoo_symbol=a.get("yahoo_symbol"),
                name=a["name"],
                asset_class=a["asset_class"],
                currency=a["currency"],
                sector=a.get("sector"),
                country=a.get("country"),
            )
            db.add(asset)
            await db.flush()

            qty = a.get("quantity", 1.0)
            holding = Holding(
                portfolio_id=portfolio.id,
                asset_id=asset.id,
                quantity=qty,
                average_cost=a["total_invested"] / qty,
                currency=a["currency"],
                current_price=a["current_value"] / qty,
                current_value=a["current_value"],
                total_invested=a["total_invested"],
                unrealized_gain=a["total_gain"],
                return_pct=a["return_pct"],
                total_gain_including_dividends=a["total_gain"],
            )
            db.add(holding)

            # Add a buy transaction
            tx = Transaction(
                portfolio_id=portfolio.id,
                asset_id=asset.id,
                transaction_type="BUY",
                date=datetime(2023, 1, 15, tzinfo=timezone.utc),
                quantity=qty,
                price=a["total_invested"] / qty,
                gross_amount=a["total_invested"],
                fees=0.0,
                currency=a["currency"],
            )
            db.add(tx)

        # Seed watchlist
        for w in WATCHLIST_SEEDS:
            item = WatchlistItem(
                user_id=user.id,
                ticker=w["ticker"],
                target_price=w.get("target_price"),
                status=w["status"],
                reason=w.get("reason"),
                notes=w.get("notes"),
            )
            db.add(item)

        # Seed some alert events
        alerts = [
            AlertEvent(user_id=user.id, ticker="ISAE4", message="ISAE4 reached return of +41.44% — consider reviewing your position.", is_read=False),
            AlertEvent(user_id=user.id, ticker="RGTI", message="RGTI down -49.07% — review your investment thesis.", is_read=False),
            AlertEvent(user_id=user.id, ticker="KNCR11", message="KNCR11 with exceptional return of +61.69%. Strong position.", is_read=True),
        ]
        for alert in alerts:
            db.add(alert)

        await db.commit()
