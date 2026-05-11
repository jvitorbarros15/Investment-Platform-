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
    // 13:30 UTC = 8:30 EST after DST ends → closed
    expect(isNYSEOpen(utc(2026, 11, 2, 13, 30))).toBe(false);
  });
});

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
    expect(isB3Open(utc(2026, 1, 5, 13, 0))).toBe(true);
    expect(isB3Open(utc(2026, 1, 5, 12, 59))).toBe(false);
    expect(isB3Open(utc(2026, 7, 6, 13, 0))).toBe(true);
    expect(isB3Open(utc(2026, 7, 6, 12, 59))).toBe(false);
  });
});
