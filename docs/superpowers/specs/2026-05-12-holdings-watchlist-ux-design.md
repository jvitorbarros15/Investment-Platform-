# Holdings & Watchlist UX Improvements

**Date:** 2026-05-12
**Status:** Approved

## Scope

Three focused UX improvements across the holdings and watchlist pages:

1. Clickable stocks in holdings and watchlist navigate to the stock detail page
2. Replace the text "Refresh Rate" button on the stock detail page with an icon-only button
3. Allow removing a holding directly from the holdings table (inline two-step confirm)

---

## Files Changed

| File | What changes |
|---|---|
| `frontend/app/portfolio/page.tsx` | Add router navigation on row click; add trash column with inline confirm; add `deleteHolding` mutation |
| `frontend/app/watchlist/page.tsx` | Add router navigation on card click |
| `frontend/app/assets/[ticker]/page.tsx` | Replace text refresh rate button with 32×32 icon-only button |

No new files. No API changes — `deleteHolding(ticker)` already exists in `frontend/lib/api.ts`.

---

## Feature 1 — Clickable Stocks

### Holdings (`portfolio/page.tsx`)
- Import `useRouter` from `next/navigation`.
- Add `onClick={() => router.push(`/assets/${h.ticker}`)}` to each `<tr>`.
- The row already has `cursor: "pointer"` and hover styles — no visual change needed.
- The remove button (feature 3) calls `e.stopPropagation()` to prevent triggering row navigation.

### Watchlist (`watchlist/page.tsx`)
- Import `useRouter` from `next/navigation`.
- Add `onClick={() => router.push(`/assets/${w.ticker}`)}` to each card `<div>`.
- Cards already have `cursor: "pointer"` and lift-on-hover — no visual change needed.

---

## Feature 2 — Icon-Only Refresh Rate Button

**Location:** `frontend/app/assets/[ticker]/page.tsx`, around line 151–163.

Replace the current `<button className="text-xs px-4 py-2 bg-neutral-800 ...">🔄 Refresh Rate</button>` with:

```tsx
<button
  onClick={handleRefreshRate}
  disabled={rateLoading}
  title="Refresh exchange rate"
  style={{
    width: 32, height: 32, borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#14130f", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: rateLoading ? 0.6 : 1,
  }}
>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="rgba(245,241,232,0.6)" strokeWidth="2"
    style={{ animation: rateLoading ? "topbarSpin 0.8s linear infinite" : "none" }}>
    <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7-3.3M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7 3.3"/>
    <path d="M21 3v6h-6M3 21v-6h6"/>
  </svg>
</button>
```

- Keep the adjacent `<span className="text-xs text-neutral-500">Rate: ...</span>` as-is.
- The `topbarSpin` keyframe animation already exists globally (used by the topbar refresh button).

---

## Feature 3 — Remove Holding (Inline Two-Step)

### State
Add `const [confirmingTicker, setConfirmingTicker] = useState<string | null>(null)` alongside existing state.

### Mutation
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

Import `deleteHolding` from `@/lib/api`.

### Table Header
Add a 9th header entry at the end of the `headers` array:
```ts
{ key: "remove", label: "", sortable: false, align: "center" }
```

### Row Cell
Last `<td>` in each row:

**Default state** (`confirmingTicker !== h.ticker`):
- 28×28 button with a trash SVG icon, muted color `rgba(245,241,232,0.3)`.
- On hover: color brightens to `rgba(224,123,108,0.8)` (muted red).
- `onClick`: `e.stopPropagation(); setConfirmingTicker(h.ticker)`.

**Confirming state** (`confirmingTicker === h.ticker`):
- Two buttons side by side:
  - Green checkmark `✓` — calls `e.stopPropagation(); removeHolding.mutate(h.ticker)`.
  - Grey ✕ — calls `e.stopPropagation(); setConfirmingTicker(null)`.
- Both buttons are small (24×24), no border, transparent background.

Both buttons always call `e.stopPropagation()` so clicking them never triggers row navigation.

---

## Data Flow

```
User clicks row (not trash btn)
  → router.push(/assets/TICKER)

User clicks trash icon
  → e.stopPropagation()
  → setConfirmingTicker(ticker)
  → row shows confirm/cancel inline

User clicks confirm (✓)
  → e.stopPropagation()
  → deleteHolding(ticker) [DELETE /portfolio/holdings/:ticker]
  → invalidate ["holdings"], ["portfolio-summary"]
  → row disappears

User clicks cancel (✕)
  → setConfirmingTicker(null)
  → row returns to normal
```

---

## Edge Cases

- If `removeHolding` is pending, the confirm button should be disabled to prevent double-submit.
- Clicking a different row's trash while one is confirming clears the previous confirm state (only one `confirmingTicker` at a time).
- The watchlist cards have no remove action — that already exists on the stock detail page via `WatchlistToggle`.
