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
  // DST starts: 2nd Sunday in March at 07:00 UTC (2:00 AM EST = UTC-5)
  const dstStart = nthWeekdayOfMonth(year, 3, 0, 2);
  dstStart.setUTCHours(7, 0, 0, 0);
  // DST ends: 1st Sunday in November at 06:00 UTC (2:00 AM EDT = UTC-4)
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
