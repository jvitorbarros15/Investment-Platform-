import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.seed import seed_database
from app.db.session import init_db
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
from app.services.price_refresh_service import refresh_all_portfolios, refresh_exchange_rate

logger = logging.getLogger(__name__)


def handle_job_error(event):
    if event.exception:
        logger.error(f"Job {event.job_id} failed: {event.exception}")
    else:
        logger.info(f"Job {event.job_id} completed")


scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_database()

    try:
        scheduler.add_job(refresh_all_portfolios, "interval", minutes=15, id="refresh_prices")
        scheduler.add_job(refresh_exchange_rate, "interval", minutes=15, id="refresh_rate")
        scheduler.add_listener(handle_job_error, mask=EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
        scheduler.start()
        logger.info("Scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        raise

    yield

    try:
        scheduler.shutdown()
        logger.info("Scheduler shut down successfully")
    except Exception as e:
        logger.error(f"Error shutting down scheduler: {e}")


app = FastAPI(
    title="Investment Platform API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://frontend:3000",
    ],
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
