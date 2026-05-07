# Investment Platform

Personal investment dashboard to track Brazilian stocks, FIIs, US equities, and crypto in one place.

## Stack

- **Backend**: FastAPI + SQLAlchemy (async) + PostgreSQL + Redis + yfinance
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui + Recharts
- **Infra**: Docker Compose

## Getting Started

### Requirements

- Docker + Docker Compose
- Node 20+ (for frontend dev)
- Python 3.12+ (for backend dev)

### Run with Docker

```bash
docker compose up --build
```

- Frontend → http://localhost:3002
- Backend API → http://localhost:8000
- API Docs → http://localhost:8000/docs

### Run locally (dev)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# start postgres + redis via docker, then:
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Default credentials

```
email: admin@invest.local
password: invest123
```

## Market Data

Prices are fetched via **yfinance** — free, no API key required. Covers:
- Brazilian stocks (B3) — appends `.SA` suffix automatically
- US equities
- Crypto pairs (USD)

To refresh live prices, call:
```
POST /api/v1/market/refresh
```
This updates all holdings in the database with current prices and recalculates returns.

## Portfolio

Pre-seeded with holdings across Brazilian stocks, FIIs, US equities, and crypto. To update holdings, edit `backend/app/db/seed.py` and recreate the database volume:
```bash
docker compose down -v && docker compose up --build
```

## Project Structure

```
Investment/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # Route handlers (auth, portfolio, market, watchlist, alerts, philosophy)
│   │   ├── core/      # Config, security (JWT)
│   │   ├── db/        # Models, session, seed data
│   │   └── services/  # yfinance market data, portfolio calculations
│   └── requirements.txt
├── frontend/          # Next.js frontend
│   ├── app/           # Pages (App Router) — Dashboard, Portfolio, Watchlist, Alerts, Philosophy
│   ├── components/    # UI components (charts, layout, cards)
│   └── lib/           # Types, formatters, API client (TanStack Query)
└── docker-compose.yml
```
