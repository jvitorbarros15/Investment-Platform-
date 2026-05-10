# Stock Detail Page Enhancement — Design Spec

**Date:** 2026-05-10
**Branch:** feature/stock-detail-enhancements

---

## Goal

Enrich the stock detail page (`/assets/[ticker]`) with a fundamentals panel, a portfolio position panel, interactive chart overlays, a working USD/BRL live exchange rate, and a fix for the broken Y-axis labels on the price chart.

---

## Architecture

**Pattern:** Component decomposition. The page stays thin (data fetching + layout only). All display logic lives in focused components under `frontend/components/stock/`.

**New frontend files:**
- `frontend/components/stock/StockFundamentals.tsx` — market fundamentals panel with Raw/Context toggle
- `frontend/components/stock/StockPosition.tsx` — user's position in this stock (only rendered if held)
- `frontend/components/stock/StockChart.tsx` — price chart extracted from the page, with overlay controls

**Modified frontend files:**
- `frontend/app/assets/[ticker]/page.tsx` — pass fetched data as props to new components, remove inline chart logic
- `frontend/lib/currency-store.ts` — add `exchangeRate`, `fetchRate()`, `lastUpdated`
- `frontend/lib/api.ts` — add `getExchangeRate()` function
- `frontend/lib/types.ts` — add `StockQuote` type with full fundamentals fields

**Modified backend files:**
- `backend/app/services/market_data/yahoo_provider.py` — add `price_to_book` and `eps` to quote response
- `backend/app/api/market.py` — add `GET /api/v1/market/exchange-rate` endpoint

---

## Backend Changes

### 1. Extend Quote Response

Add two fields to the quote dict returned by `YahooFinanceProvider.get_quote()`:

```python
"price_to_book": info.get("priceToBook"),   # P/VP
"eps": info.get("trailingEps"),              # Earnings Per Share
```

Both are available in `yfinance` `Ticker.info`. No new dependencies.

### 2. Exchange Rate Endpoint

```
GET /api/v1/market/exchange-rate
```

- No authentication required (public data)
- Fetches `USDBRL=X` ticker from Yahoo Finance via the existing `YahooFinanceProvider`
- Returns: `{ "rate": 5.72, "symbol": "USDBRL", "updated_at": "2026-05-10T09:41:00Z" }`
- Uses the existing `get_quote()` method — returns the `price` field for `USDBRL=X`
- If fetch fails, returns HTTP 503 with `{ "detail": "Exchange rate unavailable" }`

---

## Frontend Changes

### 1. `StockQuote` Type (`frontend/lib/types.ts`)

```typescript
export interface StockQuote {
  symbol: string;
  price: number;
  currency: string;
  change_1d: number;
  change_1d_pct: number;
  market_cap: number | null;
  pe_ratio: number | null;
  forward_pe: number | null;
  price_to_book: number | null;   // P/VP
  eps: number | null;
  dividend_yield: number | null;
  beta: number | null;
  week_52_high: number | null;
  week_52_low: number | null;
  sector: string | null;
  industry: string | null;
  name: string;
}
```

### 2. Currency Store (`frontend/lib/currency-store.ts`)

Extended state:

```typescript
interface CurrencyStore {
  currency: "BRL" | "USD";
  exchangeRate: number;          // 1.0 when USD, fetched rate when BRL
  lastUpdated: Date | null;
  setCurrency: (c: "BRL" | "USD") => void;
  fetchRate: () => Promise<void>; // calls GET /api/v1/market/exchange-rate
}
```

- `exchangeRate` defaults to `1.0`
- `fetchRate()` updates `exchangeRate` and `lastUpdated`
- All price displays multiply by `exchangeRate` — no backend conversion needed
- `lastUpdated` displayed as "Rate from HH:MM" next to the refresh button in the Topbar

### 3. `StockFundamentals.tsx`

Displays a grid of metrics. Has a `Raw | Context` toggle (local `useState`).

**Metrics displayed:**

| Label | Field | Context thresholds |
|---|---|---|
| Market Cap | `market_cap` | > 200B: Large cap, > 10B: Mid cap, else: Small cap |
| P/E Ratio | `pe_ratio` | < 15: Cheap, 15–30: Fair, > 30: Expensive |
| Forward P/E | `forward_pe` | same thresholds as P/E |
| P/VP | `price_to_book` | < 1: Below book, 1–3: Fair, > 3: Premium |
| EPS | `eps` | > 0: Profitable, ≤ 0: Unprofitable |
| Dividend Yield | `dividend_yield` | < 2%: Low, 2–4%: Moderate, > 4%: High |
| Beta | `beta` | < 0.8: Low vol, 0.8–1.2: Market, > 1.2: Volatile |
| 52W High | `week_52_high` | no context label |
| 52W Low | `week_52_low` | no context label |
| Sector | `sector` | text only |

- Null fields render as `—` (em dash), never crash
- All price fields (market cap, 52W high/low) respect the currency store — multiplied by `exchangeRate` when BRL

### 4. `StockPosition.tsx`

Only renders when the ticker appears in the user's holdings array.

**Displays:**
- Quantity held
- Average cost (currency-converted)
- Current value (currency-converted)
- Unrealized P/L in $ and %
- Weight in portfolio (%)
- 1-day change on position in $

All values come from the `Holding` type already fetched by the page — no new API calls.

### 5. `StockChart.tsx`

Extracted from the page. Receives `history: HistoryPoint[]` and `period: string` as props.

**Overlay toggle buttons:** `VOL`, `MA50`, `MA200` — all default off, local `useState`.

- **VOL:** volume bars rendered on a secondary Y-axis (`yAxisId="volume"`). Semi-transparent green fill.
- **MA50:** sliding window average over 50 data points, rendered as a separate `<Line>` in the same chart.
- **MA200:** same as MA50 over 200 points. Button is **disabled** (grayed, `cursor-not-allowed`) when period is not `"365d"` — not enough data.
- Moving averages computed client-side in a `useMemo` from the history array.

**Y-axis bug fix:** derive domain from data:
```typescript
const prices = history.map(h => h.close);
const yMin = Math.min(...prices) * 0.98;
const yMax = Math.max(...prices) * 1.02;
// Pass as: <YAxis domain={[yMin, yMax]} />
```

---

## Currency Refresh UX

- Refresh button (🔄 icon) sits next to the USD/BRL toggle in the Topbar
- On click: calls `fetchRate()`, button shows a spinner while loading
- On success: `lastUpdated` updates to current time, shown as small text "Rate: 09:41"
- On failure: shows a brief "Unavailable" text for 3 seconds, then clears
- The rate persists in Zustand memory for the session (not localStorage — rates go stale)

---

## What Is NOT in Scope

- Analyst recommendations
- News/events feed
- RSI / MACD technical indicators
- Earnings calendar
- Comparison against sector averages (requires additional data source)
- Persistent rate caching across sessions

---

## Self-Review

**Placeholder scan:** No TBDs or incomplete sections.

**Internal consistency:**
- `StockQuote` type includes all fields referenced in `StockFundamentals`
- `price_to_book` and `eps` added to both backend provider and frontend type
- `exchangeRate` in currency store is used consistently across all three components
- MA200 disabled state matches the "not enough data for short periods" constraint

**Scope:** Single page enhancement — appropriately scoped for one implementation plan.

**Ambiguity resolved:**
- Currency conversion happens frontend-only (multiply by `exchangeRate`)
- Exchange rate endpoint requires no authentication
- Context labels use static client-side thresholds, no external benchmarks
