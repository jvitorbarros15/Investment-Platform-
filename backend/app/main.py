from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.seed import seed_database
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_database()
    yield


app = FastAPI(
    title="Investment Platform API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import alerts, assets, auth, market, philosophy, portfolio, scores, transactions, watchlist

app.include_router(auth.router, prefix="/api/v1")
app.include_router(portfolio.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(watchlist.router, prefix="/api/v1")
app.include_router(market.router, prefix="/api/v1")
app.include_router(assets.router, prefix="/api/v1")
app.include_router(scores.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(philosophy.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
