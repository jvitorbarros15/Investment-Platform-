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

| Ticker | Type | Value |
|--------|------|-------|
| BBAS3 | Ação BR | R$ 2.768,60 |
| BBSE3 | Ação BR | R$ 620,10 |
| ISAE4 | Ação BR | R$ 4.220,13 |
| TAEE11 | Ação BR | R$ 286,79 |
| KNCR11 | FII | R$ 746,34 |
| MFII11 | FII | R$ 1.393,68 |
| IONQ | US Stock | US$ 93,63 |
| QBTS | US Stock | US$ 66,04 |
| NVDA | US Stock | US$ 44,61 |
| RGTI | US Stock | US$ 30,55 |
| BTC | Crypto | US$ 689,57 |
| XRP | Crypto | US$ 12,96 |

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
