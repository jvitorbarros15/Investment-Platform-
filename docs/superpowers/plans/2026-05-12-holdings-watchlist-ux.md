# Holdings & Watchlist UX Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up stock row/card navigation in holdings and watchlist, reduce the stock detail refresh rate button to an icon, and add inline two-step remove-holding to the holdings table.

**Architecture:** All three changes are purely frontend. No new files or API endpoints are needed — `deleteHolding(ticker)` already exists in `frontend/lib/api.ts`. Navigation uses `useRouter` from Next.js. The remove-holding state machine lives in the existing `HoldingsPage` component via a single `confirmingTicker` state string.

**Tech Stack:** Next.js 14 (App Router), React, TanStack Query, TypeScript, inline styles

---

## Files Changed

| File | Role |
|---|---|
| `frontend/app/watchlist/page.tsx` | Add router navigation on card click |
| `frontend/app/portfolio/page.tsx` | Add router navigation on row click + trash column + deleteHolding mutation |
| `frontend/app/assets/[ticker]/page.tsx` | Swap text refresh-rate button for icon-only button |

---

### Task 1: Clickable watchlist cards

**Files:**
- Modify: `frontend/app/watchlist/page.tsx`

- [ ] **Step 1: Add `useRouter` import**

Open `frontend/app/watchlist/page.tsx`. The current import line is:
```tsx
import { useState, useMemo } from "react";
```
Change it to:
```tsx
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
```

- [ ] **Step 2: Instantiate the router**

Inside `WatchlistPage()`, after the existing `const [filter, setFilter] = ...` line, add:
```tsx
const router = useRouter();
```

- [ ] **Step 3: Wire `onClick` on the card div**

Find the card `<div>` that starts with `style={{ ...PANEL, padding: 20, cursor: "pointer", ...}}`.

Add an `onClick` handler to that element:
```tsx
onClick={() => router.push(`/assets/${encodeURIComponent(w.ticker)}`)}
```

The full opening tag should now look like:
```tsx
<div
  onClick={() => router.push(`/assets/${encodeURIComponent(w.ticker)}`)}
  style={{
    ...PANEL,
    padding: 20,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    flexDirection: "column",
  }}
  onMouseEnter={(e) => {
    (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
    (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 24px rgba(0,0,0,0.3)";
  }}
  onMouseLeave={(e) => {
    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
    (e.currentTarget as HTMLElement).style.boxShadow = "none";
  }}
>
```

- [ ] **Step 4: Verify in browser**

Start dev server (`cd frontend && npm run dev`). Open `/watchlist`. Click any card — should navigate to `/assets/TICKER`. Press back — should return to watchlist. No visual change to the cards.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/watchlist/page.tsx
git commit -m "Make watchlist cards navigate to stock detail page"
```

---

### Task 2: Clickable holdings rows

**Files:**
- Modify: `frontend/app/portfolio/page.tsx`

- [ ] **Step 1: Add `useRouter` import**

Open `frontend/app/portfolio/page.tsx`. Add to the existing React import line:
```tsx
import { useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
```

- [ ] **Step 2: Instantiate the router**

Inside `HoldingsPage()`, after `const queryClient = useQueryClient();`, add:
```tsx
const router = useRouter();
```

- [ ] **Step 3: Wire `onClick` on the `<tr>`**

Find the `<tr key={h.ticker} style={{ ... cursor: "pointer" ...}}>` inside the `filtered.map(...)` block.

Add `onClick` to it:
```tsx
<tr
  key={h.ticker}
  onClick={() => router.push(`/assets/${encodeURIComponent(h.ticker)}`)}
  style={{
    borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
    transition: "background 0.15s",
    cursor: "pointer",
  }}
  onMouseEnter={(e) => {
    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
  }}
  onMouseLeave={(e) => {
    (e.currentTarget as HTMLElement).style.background = "transparent";
  }}
>
```

- [ ] **Step 4: Verify in browser**

Open `/portfolio` (Holdings page). Click any row — should navigate to `/assets/TICKER`. Press back — returns to holdings. The row hover highlight still works.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/portfolio/page.tsx
git commit -m "Make holdings rows navigate to stock detail page"
```

---

### Task 3: Icon-only refresh rate button on stock detail

**Files:**
- Modify: `frontend/app/assets/[ticker]/page.tsx`

- [ ] **Step 1: Locate the button**

Open `frontend/app/assets/[ticker]/page.tsx`. Find the section around line 151–164:
```tsx
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
```

- [ ] **Step 2: Replace the button**

Replace only the `<button>` element (leave the outer `<div>` and the `<span>` unchanged):
```tsx
{/* Refresh Rate Button */}
<div className="mb-8 flex gap-2 items-center">
  <button
    onClick={handleRefreshRate}
    disabled={rateLoading}
    title="Refresh exchange rate"
    style={{
      width: 32,
      height: 32,
      borderRadius: 6,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "#14130f",
      cursor: rateLoading ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: rateLoading ? 0.6 : 1,
    }}
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(245,241,232,0.6)"
      strokeWidth="2"
      style={{ animation: rateLoading ? "topbarSpin 0.8s linear infinite" : "none" }}
    >
      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7-3.3M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7 3.3" />
      <path d="M21 3v6h-6M3 21v-6h6" />
    </svg>
  </button>
  {useCurrencyStore.getState().lastUpdated && (
    <span className="text-xs text-neutral-500">
      Rate: {useCurrencyStore.getState().lastUpdated?.toLocaleTimeString()}
    </span>
  )}
</div>
```

Note: `topbarSpin` is defined in `frontend/app/globals.css` at line 268 and is available globally.

- [ ] **Step 3: Verify in browser**

Open any stock detail page (e.g. `/assets/AAPL`). The area below the price header should show a small 32×32 icon button instead of the text button. Clicking it should spin the icon while loading, then stop. Tooltip "Refresh exchange rate" should appear on hover.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/assets/[ticker]/page.tsx
git commit -m "Replace refresh rate text button with icon-only button"
```

---

### Task 4: Remove holding — state and mutation

**Files:**
- Modify: `frontend/app/portfolio/page.tsx`

This task adds the state and mutation only. The UI column is added in Task 5.

- [ ] **Step 1: Add `deleteHolding` to the API import**

In `frontend/app/portfolio/page.tsx`, find the import:
```tsx
import { createTransaction, getHoldings, getPortfolioSummary } from "@/lib/api";
```
Change to:
```tsx
import { createTransaction, deleteHolding, getHoldings, getPortfolioSummary } from "@/lib/api";
```

- [ ] **Step 2: Add `confirmingTicker` state**

After the existing `const [formError, setFormError] = useState("");` line, add:
```tsx
const [confirmingTicker, setConfirmingTicker] = useState<string | null>(null);
```

- [ ] **Step 3: Add `removeHolding` mutation**

After the existing `addPosition` mutation block (after its closing `}`), add:
```tsx
const removeHolding = useMutation({
  mutationFn: (ticker: string) => deleteHolding(ticker),
  onSuccess: async () => {
    setConfirmingTicker(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["holdings"] }),
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] }),
    ]);
  },
});
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors. If TypeScript complains about `deleteHolding` not found, double-check the import in step 1.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/portfolio/page.tsx
git commit -m "Add deleteHolding mutation and confirmingTicker state to holdings page"
```

---

### Task 5: Remove holding — trash column UI

**Files:**
- Modify: `frontend/app/portfolio/page.tsx`

- [ ] **Step 1: Add header entry**

Find the `headers` array (around line 101). It ends with:
```ts
{ key: "return", label: "Return", sortable: true, align: "right" },
```
Add one more entry after it:
```ts
{ key: "remove", label: "", sortable: false, align: "center" },
```

- [ ] **Step 2: Add the trailing `<td>` to each row**

Inside `filtered.map(...)`, find the last `<td>` (the Return cell). After its closing `</td>`, add the remove cell:

```tsx
{/* REMOVE */}
<td
  style={{ padding: "8px 12px", textAlign: "center" }}
  onClick={(e) => e.stopPropagation()}
>
  {confirmingTicker === h.ticker ? (
    <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "center" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeHolding.mutate(h.ticker);
        }}
        disabled={removeHolding.isPending}
        title="Confirm remove"
        style={{
          width: 24,
          height: 24,
          borderRadius: 4,
          border: "1px solid rgba(125,211,168,0.4)",
          background: "rgba(125,211,168,0.1)",
          color: "#7dd3a8",
          cursor: removeHolding.isPending ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          opacity: removeHolding.isPending ? 0.5 : 1,
        }}
      >
        ✓
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setConfirmingTicker(null);
        }}
        title="Cancel"
        style={{
          width: 24,
          height: 24,
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "transparent",
          color: "rgba(245,241,232,0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
        }}
      >
        ✕
      </button>
    </div>
  ) : (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setConfirmingTicker(h.ticker);
      }}
      title={`Remove ${h.ticker}`}
      style={{
        width: 28,
        height: 28,
        borderRadius: 4,
        border: "none",
        background: "transparent",
        color: "rgba(245,241,232,0.25)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(224,123,108,0.8)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,241,232,0.25)";
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    </button>
  )}
</td>
```

- [ ] **Step 3: Verify in browser**

Open `/portfolio`. Each row should have a faint trash icon at the right. Clicking it should show ✓ and ✕ buttons inline. Clicking ✓ should remove the row and refresh the table. Clicking ✕ should restore the trash icon. Clicking a row (not the trash area) should still navigate to the stock detail page.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/portfolio/page.tsx
git commit -m "Add remove holding button with inline confirm to holdings table"
```

---

## Spec Coverage Check

| Spec requirement | Covered by |
|---|---|
| Watchlist cards navigate to `/assets/[ticker]` | Task 1 |
| Holdings rows navigate to `/assets/[ticker]` | Task 2 |
| Refresh rate button is icon-only (32×32, same SVG as topbar) | Task 3 |
| Spin animation while loading | Task 3 |
| Trash icon on each holding row | Task 5 |
| Inline two-step confirm (✓ / ✕) | Task 5 |
| `e.stopPropagation()` prevents navigation on remove | Task 5 |
| `deleteHolding` called on confirm | Tasks 4 + 5 |
| Invalidate `["holdings"]` + `["portfolio-summary"]` on success | Task 4 |
| Confirm button disabled while mutation is pending | Task 5 |
