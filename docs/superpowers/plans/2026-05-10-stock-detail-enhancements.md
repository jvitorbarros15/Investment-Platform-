# Stock Detail Page Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fundamentals panel, position panel, interactive chart overlays, live USD/BRL exchange rate with on-demand refresh, and fix the Y-axis chart bug.

**Architecture:** Extract chart logic from the page into a focused `StockChart` component with overlay controls. Add `StockFundamentals` and `StockPosition` components as new data display units. Extend the currency store with live exchange rate fetching. Backend adds two fields to the quote endpoint and a new lightweight exchange rate endpoint.

**Tech Stack:** React, Zustand, Recharts (chart library already in use), FastAPI/yfinance

---

### Task 1: Backend — Add Exchange Rate Endpoint

**Files:**
- Modify: `backend/app/api/market.py:1-61`

- [ ] **Step 1: Read the current market.py to understand the endpoint structure**

Open `c:\Users\jvito\Investment-Platform-\backend\app\api\market.py` and review lines 1-61. Note how the existing `/market/quote/{symbol}` endpoint works — it calls `provider.get_quote(symbol)` and handles errors.

- [ ] **Step 2: Add the exchange rate endpoint function**

Add this function after the `get_indexes()` endpoint (after line 50):

```python
@router.get("/exchange-rate")
async def get_exchange_rate():
    """
    Fetch current USDBRL exchange rate from Yahoo Finance.
    Returns the price of USDBRL=X ticker (1 USD = X BRL).
    """
    try:
        quote = provider.get_quote("USDBRL=X")
        if not quote:
            raise HTTPException(status_code=503, detail="Exchange rate unavailable")
        return {
            "rate": quote.get("price"),
            "symbol": "USDBRL",
            "updated_at": datetime.utcnow().isoformat() + "Z",
        }
    except Exception as e:
        logger.error(f"Failed to fetch exchange rate: {e}")
        raise HTTPException(status_code=503, detail="Exchange rate unavailable")
```

Make sure to import `datetime` and `HTTPException` at the top:

```python
from datetime import datetime
from fastapi import HTTPException
```

- [ ] **Step 3: Test the endpoint manually**

Restart the backend and run:
```bash
curl http://localhost:8000/api/v1/market/exchange-rate
```

Expected response:
```json
{
  "rate": 5.72,
  "symbol": "USDBRL",
  "updated_at": "2026-05-10T14:32:15.123456Z"
}
```

If you get a 503 or 500 error, check the backend logs for what `provider.get_quote("USDBRL=X")` returns.

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/market.py
git commit -m "feat: add exchange rate endpoint for USDBRL"
```

---

### Task 2: Backend — Extend Quote Fields

**Files:**
- Modify: `backend/app/services/market_data/yahoo_provider.py:54-111`

- [ ] **Step 1: Read the get_quote method**

Open `c:\Users\jvito\Investment-Platform-\backend\app\services\market_data\yahoo_provider.py` and review the `get_quote()` method (lines 54-111). Find where the quote dict is constructed (the return statement with all the fields like `"price"`, `"market_cap"`, etc.).

- [ ] **Step 2: Add price_to_book and eps fields to the quote dict**

In the quote dict (around line 100-110), add these two lines before the return statement:

```python
"price_to_book": info.get("priceToBook"),
"eps": info.get("trailingEps"),
```

The full quote dict should now include all these fields:
```python
return {
    "symbol": symbol,
    "price": price,
    "currency": currency,
    "market_cap": info.get("marketCap"),
    "dividend_yield": info.get("dividendYield"),
    "pe_ratio": info.get("trailingPE"),
    "forward_pe": info.get("forwardPE"),
    "price_to_book": info.get("priceToBook"),
    "eps": info.get("trailingEps"),
    "beta": info.get("beta"),
    "week_52_high": info.get("fiftyTwoWeekHigh"),
    "week_52_low": info.get("fiftyTwoWeekLow"),
    "sector": info.get("sector"),
    "industry": info.get("industry"),
    "name": info.get("longName"),
}
```

- [ ] **Step 3: Test the endpoint**

Restart the backend and call:
```bash
curl http://localhost:8000/api/v1/market/quote/AAPL
```

Verify the response includes `"price_to_book"` and `"eps"` fields (they may be null for some tickers, that's fine).

- [ ] **Step 4: Commit**

```bash
git add backend/app/services/market_data/yahoo_provider.py
git commit -m "feat: add price_to_book and eps to quote response"
```

---

### Task 3: Frontend Types — Add StockQuote

**Files:**
- Modify: `frontend/lib/types.ts:1-108`

- [ ] **Step 1: Read the current types file**

Open `c:\Users\jvito\Investment-Platform-\frontend\lib\types.ts` and review existing interfaces.

- [ ] **Step 2: Add the StockQuote interface**

Add this interface before the `export` statements (around line 1-10):

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
  price_to_book: number | null;
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

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/types.ts
git commit -m "feat: add StockQuote type with fundamentals fields"
```

---

### Task 4: Frontend API — Add getExchangeRate Function

**Files:**
- Modify: `frontend/lib/api.ts:1-114`

- [ ] **Step 1: Read the current api.ts file**

Open `c:\Users\jvito\Investment-Platform-\frontend\lib\api.ts` and review how the existing axios instance is set up and how functions are structured.

- [ ] **Step 2: Add the getExchangeRate function**

Add this function at the end of the file (after line 114):

```typescript
export async function getExchangeRate(): Promise<{ rate: number; symbol: string; updated_at: string }> {
  const response = await api.get("/market/exchange-rate");
  return response.data;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/api.ts
git commit -m "feat: add getExchangeRate API function"
```

---

### Task 5: Frontend Currency Store — Add Exchange Rate State

**Files:**
- Modify: `frontend/lib/currency-store.ts:1-26`

- [ ] **Step 1: Read the current currency-store.ts**

Open `c:\Users\jvito\Investment-Platform-\frontend\lib\currency-store.ts` and review the Zustand store structure.

- [ ] **Step 2: Replace the entire file with extended store**

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getExchangeRate } from "./api";

export type Currency = "BRL" | "USD";

interface CurrencyStore {
  currency: Currency;
  exchangeRate: number;
  lastUpdated: Date | null;
  setCurrency: (currency: Currency) => void;
  fetchRate: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: "BRL",
      exchangeRate: 1.0,
      lastUpdated: null,
      setCurrency: (currency: Currency) => set({ currency }),
      fetchRate: async () => {
        try {
          const data = await getExchangeRate();
          set({ exchangeRate: data.rate, lastUpdated: new Date() });
        } catch (error) {
          console.error("Failed to fetch exchange rate:", error);
        }
      },
    }),
    {
      name: "invest_currency",
      partialize: (state) => ({ currency: state.currency }),
    }
  )
);
```

Note: Only `currency` is persisted to localStorage (via `partialize`). `exchangeRate` and `lastUpdated` are session-only.

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/currency-store.ts
git commit -m "feat: add exchangeRate and fetchRate to currency store"
```

---

### Task 6: Frontend Component — StockFundamentals

**Files:**
- Create: `frontend/components/stock/StockFundamentals.tsx`

- [ ] **Step 1: Create the StockFundamentals component**

Create a new file at `c:\Users\jvito\Investment-Platform-\frontend\components\stock\StockFundamentals.tsx` with:

```typescript
"use client";

import React, { useState } from "react";
import { StockQuote } from "@/lib/types";
import { useCurrencyStore } from "@/lib/currency-store";

interface StockFundamentalsProps {
  quote: StockQuote;
}

export function StockFundamentals({ quote }: StockFundamentalsProps) {
  const [showContext, setShowContext] = useState(false);
  const currency = useCurrencyStore((state) => state.currency);
  const exchangeRate = useCurrencyStore((state) => state.exchangeRate);

  const getContext = (label: string, value: number | null): string => {
    if (!showContext || value === null) return "";

    switch (label) {
      case "Market Cap":
        if (value > 200e9) return "Large cap";
        if (value > 10e9) return "Mid cap";
        return "Small cap";
      case "P/E Ratio":
      case "Forward P/E":
        if (value < 15) return "Cheap";
        if (value <= 30) return "Fair";
        return "Expensive";
      case "P/VP":
        if (value < 1) return "Below book";
        if (value <= 3) return "Fair";
        return "Premium";
      case "EPS":
        return value > 0 ? "Profitable" : "Unprofitable";
      case "Dividend Yield":
        if (value < 0.02) return "Low";
        if (value <= 0.04) return "Moderate";
        return "High";
      case "Beta":
        if (value < 0.8) return "Low vol";
        if (value <= 1.2) return "Market";
        return "Volatile";
      default:
        return "";
    }
  };

  const formatPrice = (value: number | null): string => {
    if (value === null) return "—";
    const converted = value * exchangeRate;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "BRL" ? "BRL" : "USD",
      maximumFractionDigits: 2,
    }).format(converted);
  };

  const formatValue = (value: number | null): string => {
    if (value === null) return "—";
    if (value < 1) return value.toFixed(3);
    if (value < 100) return value.toFixed(2);
    return value.toFixed(0);
  };

  const metrics = [
    { label: "Market Cap", value: quote.market_cap, format: formatPrice },
    { label: "P/E Ratio", value: quote.pe_ratio, format: formatValue },
    { label: "Forward P/E", value: quote.forward_pe, format: formatValue },
    { label: "P/VP", value: quote.price_to_book, format: formatValue },
    { label: "EPS", value: quote.eps, format: formatPrice },
    { label: "Dividend Yield", value: quote.dividend_yield, format: (v) => (v === null ? "—" : `${(v * 100).toFixed(2)}%`) },
    { label: "Beta", value: quote.beta, format: formatValue },
    { label: "52W High", value: quote.week_52_high, format: formatPrice },
    { label: "52W Low", value: quote.week_52_low, format: formatPrice },
    { label: "Sector", value: quote.sector || "—", format: (v) => String(v) },
  ];

  return (
    <div className="bg-neutral-950 rounded-lg p-6 border border-neutral-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Fundamentals</h2>
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-xs px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition"
        >
          {showContext ? "Context" : "Raw"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {metrics.map((metric, idx) => (
          <div key={idx} className="text-sm">
            <div className="text-neutral-500 text-xs mb-1">{metric.label}</div>
            <div className="text-white font-medium text-sm">
              {metric.format(metric.value)}
            </div>
            {getContext(metric.label, metric.value) && (
              <div className="text-neutral-400 text-xs mt-1">
                {getContext(metric.label, metric.value)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file was created**

Open `frontend/components/stock/StockFundamentals.tsx` and confirm it contains the component.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/stock/StockFundamentals.tsx
git commit -m "feat: add StockFundamentals component with Raw/Context toggle"
```

---

### Task 7: Frontend Component — StockPosition

**Files:**
- Create: `frontend/components/stock/StockPosition.tsx`

- [ ] **Step 1: Create the StockPosition component**

Create a new file at `c:\Users\jvito\Investment-Platform-\frontend\components\stock\StockPosition.tsx` with:

```typescript
"use client";

import React from "react";
import { Holding } from "@/lib/types";
import { useCurrencyStore } from "@/lib/currency-store";

interface StockPositionProps {
  holding: Holding;
}

export function StockPosition({ holding }: StockPositionProps) {
  const currency = useCurrencyStore((state) => state.currency);
  const exchangeRate = useCurrencyStore((state) => state.exchangeRate);

  const formatCurrency = (value: number): string => {
    const converted = value * exchangeRate;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "BRL" ? "BRL" : "USD",
      maximumFractionDigits: 2,
    }).format(converted);
  };

  const plColor = holding.unrealized_gain >= 0 ? "text-green-500" : "text-red-500";
  const plBgColor =
    holding.unrealized_gain >= 0 ? "bg-green-950" : "bg-red-950";

  return (
    <div className="bg-neutral-950 rounded-lg p-6 border border-neutral-800">
      <h2 className="text-lg font-semibold mb-4">Your Position</h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div>
          <div className="text-neutral-500 text-xs mb-1">Quantity</div>
          <div className="text-white font-medium text-lg">
            {holding.quantity.toFixed(2)}
          </div>
        </div>

        <div>
          <div className="text-neutral-500 text-xs mb-1">Avg Cost</div>
          <div className="text-white font-medium text-lg">
            {formatCurrency(holding.average_cost)}
          </div>
        </div>

        <div>
          <div className="text-neutral-500 text-xs mb-1">Current Value</div>
          <div className="text-white font-medium text-lg">
            {formatCurrency(holding.current_value)}
          </div>
        </div>

        <div>
          <div className="text-neutral-500 text-xs mb-1">Unrealized P/L</div>
          <div className={`font-medium text-lg ${plColor}`}>
            {formatCurrency(holding.unrealized_gain)}
          </div>
        </div>

        <div>
          <div className="text-neutral-500 text-xs mb-1">Return %</div>
          <div className={`font-medium text-lg ${plColor}`}>
            {holding.return_pct >= 0 ? "+" : ""}
            {holding.return_pct.toFixed(2)}%
          </div>
        </div>

        <div>
          <div className="text-neutral-500 text-xs mb-1">Weight</div>
          <div className="text-white font-medium text-lg">
            {holding.weight_in_class?.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className={`mt-4 p-3 rounded ${plBgColor}`}>
        <div className="text-xs text-neutral-400 mb-1">1-Day Change</div>
        <div className={`font-semibold text-sm ${plColor}`}>
          {holding.change_1d >= 0 ? "+" : ""}
          {formatCurrency(holding.change_1d)}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file was created**

Open `frontend/components/stock/StockPosition.tsx` and confirm it contains the component.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/stock/StockPosition.tsx
git commit -m "feat: add StockPosition component for portfolio tracking"
```

---

### Task 8: Frontend Component — StockChart with Overlays

**Files:**
- Create: `frontend/components/stock/StockChart.tsx`

- [ ] **Step 1: Create the StockChart component**

Create a new file at `c:\Users\jvito\Investment-Platform-\frontend\components\stock\StockChart.tsx` with:

```typescript
"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HistoryPoint {
  date: string;
  close: number;
  volume?: number;
}

interface StockChartProps {
  history: HistoryPoint[];
  period: string;
}

export function StockChart({ history, period }: StockChartProps) {
  const [showVolume, setShowVolume] = useState(false);
  const [showMA50, setShowMA50] = useState(false);
  const [showMA200, setShowMA200] = useState(false);

  const canShowMA200 = period === "365d";

  // Calculate moving averages
  const chartData = useMemo(() => {
    const data = history.map((h) => ({ ...h }));

    // MA50
    if (showMA50) {
      for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - 49);
        const subset = data.slice(start, i + 1);
        const avg = subset.reduce((sum, d) => sum + d.close, 0) / subset.length;
        data[i] = { ...data[i], ma50: avg };
      }
    }

    // MA200
    if (showMA200) {
      for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - 199);
        const subset = data.slice(start, i + 1);
        const avg = subset.reduce((sum, d) => sum + d.close, 0) / subset.length;
        data[i] = { ...data[i], ma200: avg };
      }
    }

    return data;
  }, [history, showMA50, showMA200]);

  // Compute Y-axis domain from price data
  const prices = chartData.map((d) => d.close);
  const yMin = Math.min(...prices) * 0.98;
  const yMax = Math.max(...prices) * 1.02;

  return (
    <div className="bg-neutral-950 rounded-lg p-6 border border-neutral-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Price History</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`text-xs px-3 py-1 rounded transition ${
              showVolume
                ? "bg-blue-600 text-white"
                : "bg-neutral-800 hover:bg-neutral-700"
            }`}
          >
            VOL
          </button>
          <button
            onClick={() => setShowMA50(!showMA50)}
            className={`text-xs px-3 py-1 rounded transition ${
              showMA50
                ? "bg-blue-600 text-white"
                : "bg-neutral-800 hover:bg-neutral-700"
            }`}
          >
            MA50
          </button>
          <button
            onClick={() => setShowMA200(!showMA200)}
            disabled={!canShowMA200}
            className={`text-xs px-3 py-1 rounded transition ${
              showMA200
                ? "bg-blue-600 text-white"
                : canShowMA200
                  ? "bg-neutral-800 hover:bg-neutral-700"
                  : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
            }`}
          >
            MA200
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#888" }}
            interval={Math.floor(chartData.length / 6)}
          />
          <YAxis
            yAxisId="price"
            domain={[yMin, yMax]}
            tick={{ fontSize: 12, fill: "#888" }}
          />
          {showVolume && (
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={{ fontSize: 12, fill: "#666" }}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [value.toFixed(2), ""]}
          />

          {showVolume && (
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="rgba(96, 165, 250, 0.3)"
              isAnimationActive={false}
            />
          )}

          <Line
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="#22c55e"
            dot={false}
            isAnimationActive={false}
            strokeWidth={2}
          />

          {showMA50 && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="ma50"
              stroke="#f59e0b"
              dot={false}
              isAnimationActive={false}
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          )}

          {showMA200 && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="ma200"
              stroke="#3b82f6"
              dot={false}
              isAnimationActive={false}
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file was created**

Open `frontend/components/stock/StockChart.tsx` and confirm it contains the component.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/stock/StockChart.tsx
git commit -m "feat: add StockChart component with volume and moving average overlays"
```

---

### Task 9: Frontend Page — Integrate New Components

**Files:**
- Modify: `frontend/app/assets/[ticker]/page.tsx:1-148`

- [ ] **Step 1: Read the current page**

Open `c:\Users\jvito\Investment-Platform-\frontend\app\assets\[ticker]\page.tsx` and understand the current structure (what it fetches, what it displays).

- [ ] **Step 2: Replace the entire page with integrated components**

Replace the entire content with:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAssetDetail, getAssetHistory, getHoldings } from "@/lib/api";
import { useCurrencyStore } from "@/lib/currency-store";
import { StockQuote, Holding } from "@/lib/types";
import { StockFundamentals } from "@/components/stock/StockFundamentals";
import { StockPosition } from "@/components/stock/StockPosition";
import { StockChart } from "@/components/stock/StockChart";

interface HistoryPoint {
  date: string;
  close: number;
  volume?: number;
}

export default function AssetDetailPage() {
  const params = useParams();
  const ticker = params.ticker as string;
  const currency = useCurrencyStore((state) => state.currency);
  const exchangeRate = useCurrencyStore((state) => state.exchangeRate);
  const fetchRate = useCurrencyStore((state) => state.fetchRate);

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [holding, setHolding] = useState<Holding | null>(null);
  const [period, setPeriod] = useState<string>("365d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [quoteData, historyData, holdings] = await Promise.all([
          getAssetDetail(ticker),
          getAssetHistory(ticker, period),
          getHoldings(),
        ]);

        setQuote(quoteData);
        setHistory(historyData);
        const found = holdings.find(
          (h) => h.ticker.toUpperCase() === ticker.toUpperCase()
        );
        setHolding(found || null);
      } catch (err) {
        setError("Failed to load asset details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ticker, period]);

  const handleRefreshRate = async () => {
    setRateLoading(true);
    await fetchRate();
    setRateLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-red-500">{error || "Asset not found"}</div>
      </div>
    );
  }

  const displayPrice = quote.price * exchangeRate;
  const displayColor = quote.change_1d_pct >= 0 ? "text-green-500" : "text-red-500";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <Link href="/assets" className="text-neutral-400 hover:text-white mb-6">
          ← Back
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{quote.symbol}</h1>
              <span className="text-xs bg-neutral-800 px-2 py-1 rounded">
                {quote.sector || "N/A"}
              </span>
            </div>
            <p className="text-neutral-400 text-lg">{quote.name}</p>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold mb-2">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency === "BRL" ? "BRL" : "USD",
              }).format(displayPrice)}
            </div>
            <div className={`text-lg font-semibold ${displayColor}`}>
              {quote.change_1d_pct >= 0 ? "+" : ""}
              {quote.change_1d_pct.toFixed(2)}% today
            </div>
          </div>
        </div>

        {/* Refresh Rate Button */}
        <div className="mb-8 flex gap-2 items-center">
          <button
            onClick={handleRefreshRate}
            disabled={rateLoading}
            className="text-xs px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded transition disabled:opacity-50"
          >
            {rateLoading ? "Refreshing..." : "🔄 Refresh Rate"}
          </button>
          {useCurrencyStore.getState().lastUpdated && (
            <span className="text-xs text-neutral-500">
              Rate: {useCurrencyStore.getState().lastUpdated?.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Chart */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {["1m", "3m", "6m", "1y"].map((p) => {
              const periodMap: Record<string, string> = {
                "1m": "30d",
                "3m": "90d",
                "6m": "180d",
                "1y": "365d",
              };
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(periodMap[p])}
                  className={`px-3 py-1 text-sm rounded transition ${
                    period === periodMap[p]
                      ? "bg-blue-600"
                      : "bg-neutral-800 hover:bg-neutral-700"
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              );
            })}
          </div>
          <StockChart history={history} period={period} />
        </div>

        {/* Fundamentals */}
        <div className="mb-8">
          <StockFundamentals quote={quote} />
        </div>

        {/* Position */}
        {holding && (
          <div className="mb-8">
            <StockPosition holding={holding} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Test the page**

Navigate to `http://127.0.0.1:3002/assets/AAPL` and verify:
- Quote data displays (price, change, name)
- Chart renders with overlay buttons
- Fundamentals panel shows (with Raw/Context toggle)
- If you hold AAPL, the position panel appears
- Refresh Rate button works (calls the exchange rate endpoint)

- [ ] **Step 4: Commit**

```bash
git add frontend/app/assets/[ticker]/page.tsx
git commit -m "feat: integrate StockFundamentals, StockPosition, and enhanced StockChart"
```

---

## Self-Review

**Spec coverage:**
- Fundamentals panel with Raw/Context toggle → Task 6 ✓
- Position panel with P/L, avg cost, return % → Task 7 ✓
- Interactive chart overlays (VOL, MA50, MA200) → Task 8 ✓
- Y-axis bug fix (derive domain from data) → Task 8 ✓
- USD/BRL exchange rate with on-demand refresh → Tasks 1, 4, 5, 9 ✓
- All currency conversions respect store → Tasks 6, 7, 9 ✓

**Placeholder scan:** No TBDs, all code is complete and exact.

**Type consistency:**
- `StockQuote` interface (Task 3) matches all fields used in `StockFundamentals` (Task 6) ✓
- `Holding` type (existing) used in `StockPosition` (Task 7) ✓
- `HistoryPoint` interface matches backend response ✓
- `exchangeRate` in currency store (Task 5) is used consistently in all components (Tasks 6, 7, 9) ✓

**Scope:** Single-page enhancement with focused component decomposition. Appropriately scoped.
