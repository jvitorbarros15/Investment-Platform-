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

- Frontend → http://localhost:3000
- Backend API → http://localhost:8000
- API Docs → http://localhost:8000/docs

### Run locally (dev)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
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

## Portfolio (pre-seeded)

The database seeds with a sample portfolio across Brazilian stocks (Ações BR), FIIs, US stocks, and crypto. Add your own holdings via the UI or update `backend/app/db/seed.py`.

## Project Structure

```
Investment/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── core/      # Config, security
│   │   ├── db/        # Models, session, seed
│   │   └── services/  # Market data, portfolio calc
│   └── requirements.txt
├── frontend/          # Next.js frontend
│   ├── app/           # Pages (App Router)
│   ├── components/    # UI components
│   └── lib/           # Types, formatters, API client
└── docker-compose.yml
```
