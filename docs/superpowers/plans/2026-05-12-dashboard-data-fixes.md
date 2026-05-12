# Dashboard Data Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three data accuracy bugs on the dashboard: compact money rounding small values to "k", portfolio history graph multiplying values by the number of daily price refreshes, and exchange rate inconsistency causing summary values to be wrong when the live rate diverges from the backend cached rate.

**Architecture:** Two frontend fixes (compact formatter, rate consistency) and one backend fix (history deduplication). No new files. The backend fix is in `portfolio.py`'s `/history` endpoint — deduplicate PriceSnapshots to keep only the latest per (asset_id, date) before aggregating daily values.

**Tech Stack:** Next.js 14, Python/FastAPI, SQLAlchemy, Recharts

---

## Root Causes

| Bug | Where | Why |
|---|---|---|
| `$0.8k` for $772 | `frontend/app/page.tsx` | `compactMoney` always divides by 1000 regardless of magnitude |
| Graph shows 21,222 instead of ~772 | `backend/app/api/portfolio.py` | `daily[date_key] +=` accumulates ALL snapshots per day; backend refreshes every 15 min → same asset gets added N times |
| Summary values wrong when rates diverge | `frontend/app/page.tsx` | Backend computes `total_value_brl` using stale cached rate (5.70), but after my exchange rate fix the frontend converts back using the live rate (4.89) → mismatch |

---

## Files Changed

| File | What changes |
|---|---|
| `frontend/app/page.tsx` | Fix `compactMoney`; separate `summaryRate` from `liveRate` |
| `backend/app/api/portfolio.py` | Deduplicate snapshots: keep only latest per (asset_id, date) |

---

### Task 1: Fix `compactMoney` rounding

**Files:**
- Modify: `frontend/app/page.tsx`

The `compactMoney` function currently does `(converted / 1000).toFixed(1)k` for every value. $772 becomes `$0.8k`.

- [ ] **Step 1: Replace `compactMoney`**

Find the current function (around line 88):
```tsx
const compactMoney = (value: number) => {
  const converted = convertCurrency(value, "BRL", displayCurrency, usdBrl);
  const prefix = displayCurrency === "BRL" ? "R$" : "$";
  return `${prefix}${(converted / 1000).toFixed(1)}k`;
};
```

Replace with a threshold-aware version:
```tsx
const compactMoney = (value: number) => {
  const converted = convertCurrency(value, "BRL", displayCurrency, usdBrl);
  return formatCurrency(converted, displayCurrency);
};
```

This uses the existing `formatCurrency` already imported from `@/lib/formatters`, which formats exact values with proper locale separators. No new dependency needed.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "app/page"
```
Expected: no output (no errors in that file).

- [ ] **Step 3: Check the stats grid in browser**

Open the dashboard. The "Invested capital" and "Unrealized gain" stats should now show exact values like `$760.00` instead of `$0.8k`.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "Show exact currency values in dashboard stats instead of compact k format"
```

---

### Task 2: Fix exchange rate consistency in dashboard

**Files:**
- Modify: `frontend/app/page.tsx`

**The problem:** The backend computes `total_value_brl`, `total_invested_brl`, and allocation values by multiplying USD holdings by `get_usd_to_brl()` (the in-memory cached rate, returned as `summary.usd_to_brl`). If the frontend converts these BRL values back using a DIFFERENT rate (the live `storeRate`), the resulting USD numbers are wrong.

Example with NVIDIA at $772:
- Backend: `total_value_brl = 772 × 5.70 = 4,400 BRL` (used stale 5.70)
- Frontend with live rate: `4,400 ÷ 4.89 = $899` ← wrong
- Frontend with same rate: `4,400 ÷ 5.70 = $772` ← correct

**The rule:**
- Use `summaryRate = summary?.usd_to_brl` for converting summary-derived BRL values (total, invested, gain, allocation, history)
- Use `liveRate = storeRate` only for the "USD/BRL rate" stat widget

- [ ] **Step 1: Replace the `usdBrl` line with two separate rate variables**

Find the current lines (around line 47–48, after `summary` is destructured):
```tsx
const usdBrl = storeRate > 1 ? storeRate : (summary?.usd_to_brl ?? 5.70);
```

Replace with:
```tsx
const summaryRate = summary?.usd_to_brl ?? 5.70;
const liveRate = storeRate > 1 ? storeRate : summaryRate;
```

- [ ] **Step 2: Use `summaryRate` for all summary-derived conversions**

There are several places that reference `usdBrl`. Replace each:

**Line ~48** (totalDisplay):
```tsx
// Before
const totalDisplay = convertCurrency(totalBrl, "BRL", displayCurrency, usdBrl);
const gainDisplay = convertCurrency(gainBrl, "BRL", displayCurrency, usdBrl);
// After
const totalDisplay = convertCurrency(totalBrl, "BRL", displayCurrency, summaryRate);
const gainDisplay = convertCurrency(gainBrl, "BRL", displayCurrency, summaryRate);
```

**donutData** (allocation conversion):
```tsx
// Before
value: convertCurrency(a.value ?? a.value_brl ?? 0, "BRL", displayCurrency, usdBrl),
// After
value: convertCurrency(a.value ?? a.value_brl ?? 0, "BRL", displayCurrency, summaryRate),
```

**displayHistory** (chart data):
```tsx
// Before
value: convertCurrency(point.value, "BRL", displayCurrency, usdBrl),
// After
value: convertCurrency(point.value, "BRL", displayCurrency, summaryRate),
```

**compactMoney** (still called for currency exposure section — update its internal `usdBrl` reference):
```tsx
// The compactMoney function currently references `usdBrl` which no longer exists.
// After Task 1 we changed it to use formatCurrency — but it still needs a rate.
// Update it:
const compactMoney = (value: number) => {
  const converted = convertCurrency(value, "BRL", displayCurrency, summaryRate);
  return formatCurrency(converted, displayCurrency);
};
```

**Currency exposure section** (`usdVal` calculation, line ~79):
```tsx
// Before
const usdVal = usdHoldings.reduce((s: number, h: Holding) => s + h.current_value * usdBrl, 0);
// After
const usdVal = usdHoldings.reduce((s: number, h: Holding) => s + h.current_value * summaryRate, 0);
```

**The "USD/BRL rate" stat** — use `liveRate` here so it shows the real Yahoo rate:
```tsx
{ label: "USD/BRL rate", value: `${liveRate.toFixed(2)}` },
```

**The FX rate footer** in currency exposure panel:
```tsx
// Before
<span style={{ fontFamily: "var(--font-mono)", color: "#f5f1e8" }}>{usdBrl.toFixed(2)}</span>
// After
<span style={{ fontFamily: "var(--font-mono)", color: "#f5f1e8" }}>{liveRate.toFixed(2)}</span>
```

**movers section** per-holding price (line ~213) — these use `h.currency` directly so use `summaryRate`:
```tsx
// Before
{formatCurrency(convertCurrency(h.quantity ? (h.current_value / h.quantity) : 0, h.currency, displayCurrency, usdBrl), displayCurrency)}
// After
{formatCurrency(convertCurrency(h.quantity ? (h.current_value / h.quantity) : 0, h.currency, displayCurrency, summaryRate), displayCurrency)}
```

- [ ] **Step 3: Verify no remaining `usdBrl` references in the file**

```bash
grep -n "usdBrl" frontend/app/page.tsx
```
Expected: no output.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "app/page"
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "Separate live rate from summary rate to fix dashboard currency conversions"
```

---

### Task 3: Fix portfolio history — deduplicate snapshots per day

**Files:**
- Modify: `backend/app/api/portfolio.py`

**The problem:** The scheduler runs `refresh_exchange_rate` and `refresh_all_portfolios` every 15 minutes, creating multiple `PriceSnapshot` rows per asset per day. The history endpoint does `daily[date_key] += price × qty × rate` for EVERY snapshot, so a day with 5 refreshes accumulates 5× the real value.

Fix: before the aggregation loop, reduce `snapshots` to one entry per (asset_id, date) — the latest one.

- [ ] **Step 1: Add deduplication before the aggregation loop**

Find the section (around line 177–192):
```python
        # Aggregate by date
        from collections import defaultdict
        daily = defaultdict(float)
        rate = get_usd_to_brl()

        # Validate exchange rate
        if not isinstance(rate, (int, float)) or rate <= 0:
            rate = 5.70  # Fallback to default if invalid

        for snap in snapshots:
            holding = holdings_map.get(snap.asset_id)
            if not holding:
                continue

            date_key = snap.timestamp.strftime("%Y-%m-%d")
            multiplier = rate if snap.currency == "USD" else 1.0
            daily[date_key] += snap.close_price * holding.quantity * multiplier
```

Replace the entire block with:
```python
        # Aggregate by date — keep only the latest snapshot per (asset_id, date)
        from collections import defaultdict
        daily: dict[str, float] = defaultdict(float)
        rate = get_usd_to_brl()

        if not isinstance(rate, (int, float)) or rate <= 0:
            rate = 5.70

        # Deduplicate: for each (asset_id, date) pair keep only the latest snapshot.
        # Snapshots are already ordered by timestamp ASC so iterating and overwriting
        # naturally leaves the last (latest) value in place.
        latest: dict[tuple, object] = {}
        for snap in snapshots:
            date_key = snap.timestamp.strftime("%Y-%m-%d")
            latest[(snap.asset_id, date_key)] = snap

        for (asset_id, date_key), snap in latest.items():
            holding = holdings_map.get(asset_id)
            if not holding:
                continue
            multiplier = rate if snap.currency == "USD" else 1.0
            daily[date_key] += snap.close_price * holding.quantity * multiplier
```

- [ ] **Step 2: Restart the backend to pick up the Python change**

```bash
docker compose restart backend
```
Wait ~10 seconds for it to come up.

- [ ] **Step 3: Verify in browser**

Open the dashboard. The portfolio history chart should now show values consistent with the current portfolio value (~$772). If there is only one holding and one recent snapshot, the chart should flatline near $772.

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/portfolio.py
git commit -m "Deduplicate price snapshots per day in portfolio history to fix chart inflation"
```

---

## Expected End State

| What | Before | After |
|---|---|---|
| "Invested capital" stat | `$0.8k` | `$760.34` (exact) |
| "Unrealized gain" stat | `+$0.0k` | `+$11.83` (exact) |
| Dashboard hero total | `$772` (accidentally correct) | `$772` (intentionally correct) |
| Portfolio history chart | `21,222` | `~772` |
| "USD/BRL rate" stat | `5.70` (stale) | `4.89` (live Yahoo) |
