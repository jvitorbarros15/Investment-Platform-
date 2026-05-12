# Meridian Paper UI — Design Spec
_Date: 2026-05-12_

## Overview

Full visual redesign of the MERIDIAN Next.js investment platform from its current dark theme to the "Paper Edition" aesthetic — a broadsheet-newspaper look on warm cream with terracotta, teal, and ochre accents. All backend API calls, data fetching, auth, and mutations are preserved unchanged. Only the visual layer changes.

Work is done on a dedicated branch: `meridian-paper-ui`.

---

## 1. Architecture & Layout

### What changes

**Deleted:**
- `frontend/components/layout/Sidebar.tsx`
- `frontend/components/layout/Topbar.tsx`

**Created:**
- `frontend/components/layout/Masthead.tsx` — full-width top bar with:
  - Left: logo-mark circle (ink bg, paper text "M") + "MERIDIAN" wordmark + mono subtitle
  - Center: edition line (date · "Personal Capital" · market segment tags)
  - Right: market-status pill (teal pulse dot + "Market Open/Closed") + live clock + currency toggle (BRL/USD)
- `frontend/components/layout/NavBar.tsx` — tab row below masthead:
  - Tabs: Dashboard · Holdings · Watchlist · Philosophy · Alerts
  - Active tab: terracotta underline bar (3px, bottom: -1px)
  - Right side: search input (Paper style) + icon button to open QuickAddModal

**Modified:**
- `frontend/components/layout/LayoutWrapper.tsx` — keeps auth-guard logic; renders `<Masthead /> <NavBar /> <main>{children}</main>` instead of sidebar layout
- `frontend/app/layout.tsx` — adds Bricolage Grotesque + Manrope fonts; removes Inter + Instrument Serif
- `frontend/app/globals.css` — full token swap (see Section 2) + paper grain texture

**Unchanged (zero modifications):**
- All files under `frontend/lib/` (api.ts, auth-store.ts, currency-store.ts, formatters.ts, types.ts)
- All TanStack Query hooks, query keys, and mutations
- Backend routes, models, and services
- `frontend/components/layout/QuickAddModal.tsx` (restyled but logic intact)
- All route paths: `/`, `/portfolio`, `/watchlist`, `/assets/[ticker]`, `/philosophy`, `/alerts`, `/login`

---

## 2. Design Tokens

### Color palette (globals.css @theme inline)

```
--color-paper:     #f1e9d8   (replaces bg)
--color-paper-2:   #ebe1cc   (replaces surface)
--color-paper-3:   #e3d7bd   (replaces surface-2)
--color-ink:       #16202d   (replaces text)
--color-ink-2:     #2a3645   (replaces text-2)
--color-ink-3:     #5b6573   (replaces text-3)
--color-ink-4:     #8e96a3   (replaces text-4)
--color-rule:      rgba(22,32,45,0.18)   (replaces border)
--color-rule-2:    rgba(22,32,45,0.10)   (replaces border-2)
--color-terracotta: #cc5230  (replaces accent/lime)
--color-teal:       #0d6b65  (replaces up/mint)
--color-crimson:    #99291b  (replaces down/salmon)
--color-ochre:      #c69a2c  (replaces warn/yellow)
```

Shadcn compatibility tokens updated to map onto the new palette:
- `--color-background` → `--color-paper`
- `--color-foreground` → `--color-ink`
- `--color-card` → `--color-paper`
- `--color-primary` → `--color-terracotta`
- `--color-destructive` → `--color-crimson`
- `--color-muted` → `--color-paper-2`
- `--color-muted-foreground` → `--color-ink-3`

### Paper grain texture

`body::before` pseudo-element with SVG fractalNoise at `mix-blend-mode: multiply`, `opacity: 0.55`, `pointer-events: none`, `z-index: 1`. Copied from the Paper HTML.

### Font stack

| Role | Font | Weights |
|---|---|---|
| display | Bricolage Grotesque | 300, 400, 500, 600, 700, 800 |
| body/sans | Manrope | 300, 400, 500, 600, 700 |
| mono | JetBrains Mono | 300, 400, 500 (unchanged) |

`app/layout.tsx` loads Bricolage Grotesque + Manrope via `next/font/google`; drops Inter + Instrument Serif.

---

## 3. Shared UI Components

All components in `frontend/components/ui/` and `frontend/components/charts/` are restyled; no logic changes.

### Panel / Card style

The `.panel` pattern from the Paper HTML becomes the standard surface:
```
background: var(--color-paper)
border: 1px solid var(--color-ink)
padding: 22px 24px
border-radius: 0   (flat, no rounded corners)
```

Panel headers use a bottom border (`1px solid var(--color-rule)`), a Bricolage Grotesque bold title, and a mono "kicker" label above.

### Buttons

- Default: flat, `border: 1px solid var(--color-ink)`, paper background, ink text
- Active/primary: ink background, paper text
- Hover: subtle paper-2 background shift

### Tabs

Flat horizontal tabs with `border-right: 1px solid var(--color-rule-2)` between items. Active = ink color + font-weight 700 + terracotta underline.

### Charts

| Chart | Color update |
|---|---|
| PortfolioLineChart | Portfolio line → teal; benchmark line → ochre |
| DonutChart | Segment colors remapped to Paper palette variants |
| BarList | Bar fill → terracotta; background → paper-3 |
| Sparkline | Up → teal; Down → crimson |

---

## 4. Pages

All data fetching, mutations, routing, and error states are preserved on every page. Only markup and styles change.

### Dashboard (`/`)

**Hero (lede grid):** `grid-template-columns: 1.4fr 1fr`
- Left: kicker label → large 96px Bricolage Grotesque portfolio value → return pill row
- Right: 2×2 stat grid (Invested capital, Unrealized gain, USD/BRL, Holdings) separated by left ink border

**Performance band:** full-width ink-bordered panel with range toggle (1W/1M/3M/1Y/ALL)

**Allocation row:** 3-col grid (By asset class donut · By sector bar list · Currency exposure)

**Movers + Top holdings:** 2-col grid with ticker tiles (2×N grid per section, ink rule between tiles)

### Holdings (`/portfolio`)

- Ink-bordered flat table (no rounded corners)
- Filter tabs in Paper mono/kicker style
- Add-position form as ink-bordered panel with flat inputs
- Summary strip: 4 stat panels in a row
- Delete confirm: inline ✓/✕ buttons with Paper colors

### Watchlist (`/watchlist`)

- Opportunity list rows with target-price bullet track (thin 1px line, ink markers at min/max, dot at current price position)
- Status badges: terracotta (Strong candidate), teal (Studying), ink (Avoid)

### Asset Detail (`/assets/[ticker]`)

- Ink masthead band with ticker, name, price, 1d change (teal/crimson)
- Paper panels for chart, fundamentals, position, watchlist toggle

### Philosophy (`/philosophy`)

- Weighted criteria bars in Paper style (hatched bar track, terracotta fill)

### Alerts (`/alerts`)

- Alert rows with left severity stripe: teal (positive), crimson (negative), ochre (warning), ink-3 (info)
- Mono timestamp, kicker kind label

### Login (`/login`)

- Cream background, ink form fields with `1px solid var(--color-ink)` border
- Terracotta submit button

---

## 5. What Is Explicitly Preserved

- All API endpoints and contracts
- All TanStack Query `queryKey` definitions
- All mutations (`createTransaction`, `deleteHolding`, watchlist toggle, etc.)
- Auth flow (`useAuthStore`, redirect guard in LayoutWrapper)
- Currency toggle logic (`useCurrencyStore`, BRL/USD conversion)
- All TypeScript types in `lib/types.ts`
- All formatter functions in `lib/formatters.ts`
- All URL routes

---

## 6. Branch Strategy

Branch name: `meridian-paper-ui`

Implementation order:
1. Create branch
2. Swap fonts in `app/layout.tsx`
3. Swap design tokens + add grain in `globals.css`
4. Build `Masthead.tsx` + `NavBar.tsx`
5. Replace `LayoutWrapper.tsx` layout
6. Port pages: Dashboard → Holdings → Watchlist → Asset Detail → Philosophy → Alerts → Login
7. Restyle shared UI + chart components
8. Verify dev server — check each route, all mutations, currency toggle, auth guard
