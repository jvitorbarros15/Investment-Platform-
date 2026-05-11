# Market Hours Status — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded "MARKETS OPEN" indicator in the Topbar with two real-time status pills — one for NYSE/NASDAQ and one for B3 — that reflect actual market open/closed state based on weekday, exchange holidays, and DST-aware session hours.

**Architecture:** A pure TypeScript utility module (`frontend/lib/utils/market-hours.ts`) encapsulates all scheduling logic (DST-aware Eastern offset, BRT offset, holiday sets, weekday check). The Topbar consumes its two exports via the `now` state that already ticks every second. No backend changes, no new runtime dependencies.

**Tech Stack:** TypeScript, Next.js, React, Vitest (dev dependency for utility tests)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `frontend/lib/utils/market-hours.ts` | All scheduling logic: DST offset, BRT offset, holiday sets, `isNYSEOpen`, `isB3Open` |
| Create | `frontend/lib/utils/market-hours.test.ts` | Vitest unit tests for the utility |
| Modify | `frontend/components/layout/Topbar.tsx` | Import helpers, derive open/closed booleans, render two status pills |
| Modify | `frontend/package.json` | Add vitest dev dependency + test script |

---

### Task 1: Install Vitest

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install vitest as a dev dependency**

Run from the `frontend/` directory:

```bash
npm install --save-dev vitest
```

- [ ] **Step 2: Add test script to package.json**

In the `"scripts"` block add:

```json
"test": "vitest run"
```

- [ ] **Step 3: Verify vitest resolves**

```bash
cd frontend && npx vitest --version
```

Expected: prints a version string like `3.x.x`.

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: add vitest for utility unit tests"
```

---

### Task 2: Write failing tests for `isNYSEOpen`

**Files:**
- Create: `frontend/lib/utils/market-hours.test.ts`

- [ ] **Step 1: Create the test file**

Create `frontend/lib/utils/market-hours.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { isNYSEOpen, isB3Open } from "./market-hours";

function utc(year: number, month: number, day: number, hour: number, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

describe("isNYSEOpen", () => {
  it("is open at 9:30 AM ET on a regular summer weekday (EDT)", () => {
    // 2026-06-15 Monday, EDT (UTC-4): 9:30 ET = 13:30 UTC
    expect(isNYSEOpen(utc(2026, 6, 15, 13, 30))).toBe(true);
  });

  it("is open at 3:59 PM ET on a regular summer weekday", () => {
    expect(isNYSEOpen(utc(2026, 6, 15, 19, 59))).toBe(true);
  });

  it("is closed at exactly 4:00 PM ET (exclusive upper bound)", () => {
    expect(isNYSEOpen(utc(2026, 6, 15, 20, 0))).toBe(false);
  });

  it("is closed before 9:30 AM ET", () => {
    expect(isNYSEOpen(utc(2026, 6, 15, 13, 29))).toBe(false);
  });

  it("is closed on Saturday", () => {
    expect(isNYSEOpen(utc(2026, 6, 20, 15, 0))).toBe(false);
  });

  it("is closed on Sunday", () => {
    expect(isNYSEOpen(utc(2026, 6, 21, 15, 0))).toBe(false);
  });

  it("applies EST (UTC-5) correctly in winter", () => {
    // 2026-01-05 Monday, EST: 9:30 AM ET = 14:30 UTC
    expect(isNYSEOpen(utc(2026, 1, 5, 14, 30))).toBe(true);
    expect(isNYSEOpen(utc(2026, 1, 5, 14, 29))).toBe(false);
  });

  it("is closed on NYSE holiday (2026-01-01 New Year's Day)", () => {
    expect(isNYSEOpen(utc(2026, 1, 1, 14, 30))).toBe(false);
  });

  it("is closed on NYSE holiday (2026-07-03 Independence Day observed)", () => {
    expect(isNYSEOpen(utc(2026, 7, 3, 13, 30))).toBe(false);
  });

  it("is closed on NYSE holiday (2027-12-24 Christmas Eve observed)", () => {
    expect(isNYSEOpen(utc(2027, 12, 24, 14, 30))).toBe(false);
  });

  it("uses EDT the day after DST starts (2026-03-09, Monday)", () => {
    // 9:30 AM EDT = 13:30 UTC → open
    expect(isNYSEOpen(utc(2026, 3, 9, 13, 30))).toBe(true);
    // 13:29 UTC = 9:29 EDT → closed
    expect(isNYSEOpen(utc(2026, 3, 9, 13, 29))).toBe(false);
  });

  it("uses EST after DST ends (2026-11-02, Monday)", () => {
    // 9:30 AM EST = 14:30 UTC → open
    expect(isNYSEOpen(utc(2026, 11, 2, 14, 30))).toBe(true);
    // 13:30 UTC = 9:30 EDT, but DST is over so 13:30 UTC = 8:30 EST → closed
    expect(isNYSEOpen(utc(2026, 11, 2, 13, 30))).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail (module missing)**

```bash
cd frontend && npm test
```

Expected: `Error: Cannot find module './market-hours'`

- [ ] **Step 3: Commit the failing tests**

```bash
git add frontend/lib/utils/market-hours.test.ts
git commit -m "test: add failing tests for isNYSEOpen (market-hours utility)"
```

---

### Task 3: Write failing tests for `isB3Open`

**Files:**
- Modify: `frontend/lib/utils/market-hours.test.ts`

- [ ] **Step 1: Append B3 tests after the closing `});` of the `isNYSEOpen` describe block**

```typescript
describe("isB3Open", () => {
  // BRT = UTC-3, no DST. 10:00 AM BRT = 13:00 UTC. 5:30 PM BRT = 20:30 UTC.

  it("is open at 10:00 AM BRT on a regular weekday", () => {
    expect(isB3Open(utc(2026, 6, 15, 13, 0))).toBe(true);
  });

  it("is open at 5:29 PM BRT on a regular weekday", () => {
    expect(isB3Open(utc(2026, 6, 15, 20, 29))).toBe(true);
  });

  it("is closed at exactly 5:30 PM BRT (exclusive upper bound)", () => {
    expect(isB3Open(utc(2026, 6, 15, 20, 30))).toBe(false);
  });

  it("is closed before 10:00 AM BRT", () => {
    expect(isB3Open(utc(2026, 6, 15, 12, 59))).toBe(false);
  });

  it("is closed on Saturday", () => {
    expect(isB3Open(utc(2026, 6, 20, 14, 0))).toBe(false);
  });

  it("is closed on Sunday", () => {
    expect(isB3Open(utc(2026, 6, 21, 14, 0))).toBe(false);
  });

  it("is closed on B3 holiday (2026-01-01 New Year's Day)", () => {
    expect(isB3Open(utc(2026, 1, 1, 13, 0))).toBe(false);
  });

  it("is closed on B3 holiday (2026-02-16 Carnival Monday)", () => {
    expect(isB3Open(utc(2026, 2, 16, 13, 0))).toBe(false);
  });

  it("is closed on B3 holiday (2026-02-17 Carnival Tuesday)", () => {
    expect(isB3Open(utc(2026, 2, 17, 13, 0))).toBe(false);
  });

  it("is closed on B3 holiday (2027-02-08 Carnival Monday)", () => {
    expect(isB3Open(utc(2027, 2, 8, 13, 0))).toBe(false);
  });

  it("BRT never applies DST — consistent year-round", () => {
    // January: 10:00 BRT = 13:00 UTC
    expect(isB3Open(utc(2026, 1, 5, 13, 0))).toBe(true);
    expect(isB3Open(utc(2026, 1, 5, 12, 59))).toBe(false);
    // July: same offsets
    expect(isB3Open(utc(2026, 7, 6, 13, 0))).toBe(true);
    expect(isB3Open(utc(2026, 7, 6, 12, 59))).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — still fail (module missing)**

```bash
cd frontend && npm test
```

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/utils/market-hours.test.ts
git commit -m "test: add failing tests for isB3Open (market-hours utility)"
```

---

### Task 4: Implement `frontend/lib/utils/market-hours.ts`

**Files:**
- Create: `frontend/lib/utils/market-hours.ts`

- [ ] **Step 1: Create the file**

```typescript
// Pure functions — no side effects, no imports, no dependencies.

// ─── Holiday sets ──────────────────────────────────────────────────────────────

const NYSE_HOLIDAYS = new Set<string>([
  // 2025
  "2025-01-01", "2025-01-20", "2025-02-17", "2025-04-18",
  "2025-05-26", "2025-06-19", "2025-07-04", "2025-09-01",
  "2025-11-27", "2025-12-25",
  // 2026
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03",
  "2026-05-25", "2026-06-19", "2026-07-03", "2026-09-07",
  "2026-11-26", "2026-12-25",
  // 2027
  "2027-01-01", "2027-01-18", "2027-02-15", "2027-03-26",
  "2027-05-31", "2027-06-18", "2027-07-05", "2027-09-06",
  "2027-11-25", "2027-12-24",
]);

const B3_HOLIDAYS = new Set<string>([
  // 2025
  "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18",
  "2025-04-21", "2025-05-01", "2025-06-19", "2025-11-20",
  "2025-12-24", "2025-12-25",
  // 2026
  "2026-01-01", "2026-02-16", "2026-02-17", "2026-04-03",
  "2026-04-21", "2026-05-01", "2026-06-04", "2026-09-07",
  "2026-10-12", "2026-11-02", "2026-11-20", "2026-12-24",
  "2026-12-25",
  // 2027
  "2027-01-01", "2027-02-08", "2027-02-09", "2027-03-26",
  "2027-04-21", "2027-05-27", "2027-09-07", "2027-10-12",
  "2027-11-02", "2027-11-15", "2027-12-24",
]);

// ─── DST helpers ───────────────────────────────────────────────────────────────

function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const d = new Date(Date.UTC(year, month - 1, 1));
  const firstDow = d.getUTCDay();
  const daysToFirst = (weekday - firstDow + 7) % 7;
  d.setUTCDate(1 + daysToFirst + (n - 1) * 7);
  return d;
}

function isUSDST(now: Date): boolean {
  const year = now.getUTCFullYear();
  // DST starts: 2nd Sunday in March at 07:00 UTC (2:00 AM EST)
  const dstStart = nthWeekdayOfMonth(year, 3, 0, 2);
  dstStart.setUTCHours(7, 0, 0, 0);
  // DST ends: 1st Sunday in November at 06:00 UTC (2:00 AM EDT)
  const dstEnd = nthWeekdayOfMonth(year, 11, 0, 1);
  dstEnd.setUTCHours(6, 0, 0, 0);
  return now >= dstStart && now < dstEnd;
}

function easternOffsetHours(now: Date): -4 | -5 {
  return isUSDST(now) ? -4 : -5;
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function toLocalFields(
  now: Date,
  offsetHours: number,
): { day: number; hour: number; minute: number; dateKey: string } {
  const totalMinutesUTC = now.getUTCHours() * 60 + now.getUTCMinutes();
  const totalMinutesLocal = totalMinutesUTC + offsetHours * 60;

  const localDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (totalMinutesLocal < 0) {
    localDate.setUTCDate(now.getUTCDate() - 1);
  } else if (totalMinutesLocal >= 1440) {
    localDate.setUTCDate(now.getUTCDate() + 1);
  }

  const day = localDate.getUTCDay();
  const normalizedMinutes = ((totalMinutesLocal % 1440) + 1440) % 1440;
  const hour = Math.floor(normalizedMinutes / 60);
  const minute = normalizedMinutes % 60;

  const y = localDate.getUTCFullYear();
  const m = String(localDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(localDate.getUTCDate()).padStart(2, "0");
  const dateKey = `${y}-${m}-${d}`;

  return { day, hour, minute, dateKey };
}

function inTimeRange(
  hour: number, minute: number,
  openH: number, openM: number,
  closeH: number, closeM: number,
): boolean {
  const t = hour * 60 + minute;
  return t >= openH * 60 + openM && t < closeH * 60 + closeM;
}

// ─── Public API ────────────────────────────────────────────────────────────────

/** Returns true if NYSE/NASDAQ is currently open (Mon–Fri 9:30–16:00 ET, DST-aware). */
export function isNYSEOpen(now: Date): boolean {
  const offset = easternOffsetHours(now);
  const { day, hour, minute, dateKey } = toLocalFields(now, offset);
  if (day === 0 || day === 6) return false;
  if (NYSE_HOLIDAYS.has(dateKey)) return false;
  return inTimeRange(hour, minute, 9, 30, 16, 0);
}

/** Returns true if B3 is currently open (Mon–Fri 10:00–17:30 BRT = UTC-3). */
export function isB3Open(now: Date): boolean {
  const { day, hour, minute, dateKey } = toLocalFields(now, -3);
  if (day === 0 || day === 6) return false;
  if (B3_HOLIDAYS.has(dateKey)) return false;
  return inTimeRange(hour, minute, 10, 0, 17, 30);
}
```

- [ ] **Step 2: Run tests — all must pass**

```bash
cd frontend && npm test
```

Expected:
```
Test Files  1 passed (1)
Tests       N passed (N)
```

Fix any failures before proceeding.

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/utils/market-hours.ts
git commit -m "feat: add isNYSEOpen and isB3Open market-hours utility (TDD)"
```

---

### Task 5: Update Topbar to show real market status

**Files:**
- Modify: `frontend/components/layout/Topbar.tsx`

- [ ] **Step 1: Add the import at the top of the file (after existing imports)**

```typescript
import { isNYSEOpen, isB3Open } from "@/lib/utils/market-hours";
```

- [ ] **Step 2: Derive booleans in the component body, immediately before `return`**

```typescript
const nyseOpen = isNYSEOpen(now);
const b3Open = isB3Open(now);
```

- [ ] **Step 3: Replace the hardcoded `<div className="app-topbar-status" …>` block (lines 86–93) with**

```tsx
<div className="app-topbar-status" style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    {/* NYSE pill */}
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", display: "inline-block",
        background: nyseOpen ? "#7dd3a8" : "rgba(245,241,232,0.15)",
        animation: nyseOpen ? "marketPulse 2s infinite" : "none",
      }} />
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em",
        color: nyseOpen ? "#7dd3a8" : "rgba(245,241,232,0.35)",
      }}>NYSE</span>
    </div>
    {/* B3 pill */}
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", display: "inline-block",
        background: b3Open ? "#7dd3a8" : "rgba(245,241,232,0.15)",
        animation: b3Open ? "marketPulse 2s infinite" : "none",
      }} />
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em",
        color: b3Open ? "#7dd3a8" : "rgba(245,241,232,0.35)",
      }}>B3</span>
    </div>
    {/* Time — unchanged */}
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(245,241,232,0.5)" }}>
      {timeStr} <span style={{ opacity: 0.5 }}>EST</span>
    </span>
  </div>
  <span className="app-topbar-date" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(245,241,232,0.35)" }}>
    {dateStr}
  </span>
</div>
```

- [ ] **Step 4: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

No new errors introduced by this file. (Pre-existing errors in other files are OK.)

- [ ] **Step 5: Commit**

```bash
git add frontend/components/layout/Topbar.tsx
git commit -m "feat: replace hardcoded MARKETS OPEN with real NYSE and B3 status pills"
```

---

### Task 6: Push to main

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```

- [ ] **Step 2: Verify in browser at `http://localhost:3000`**

- Two pills visible: "NYSE" and "B3"
- During US market hours (Mon–Fri 9:30–16:00 ET): NYSE dot green + pulse
- During B3 hours (Mon–Fri 10:00–17:30 BRT): B3 dot green + pulse
- Outside hours: dot dim, no pulse, label muted
- Time and date unchanged
- No console errors
