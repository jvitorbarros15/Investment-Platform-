"use client";

import { useEffect, useState } from "react";
import { refreshPrices } from "@/lib/api";
import { useCurrencyStore } from "@/lib/currency-store";
import { useQueryClient } from "@tanstack/react-query";
import { isNYSEOpen, isB3Open } from "@/lib/utils/market-hours";
import type { Currency } from "@/lib/types";

export function Masthead() {
  const [now, setNow] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const fetchRate = useCurrencyStore((s) => s.fetchRate);
  const queryClient = useQueryClient();

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const nyseOpen = isNYSEOpen(now);
  const b3Open = isB3Open(now);
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshPrices(), fetchRate()]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["holdings"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio-history"] }),
      ]);
    } catch {}
    finally { setIsRefreshing(false); }
  };

  return (
    <div style={{
      borderBottom: "2px solid var(--color-ink)",
      padding: "20px 28px 14px",
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      gap: 24,
      alignItems: "end",
      background: "var(--color-paper)",
    }}>
      {/* LEFT: logo + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--color-ink)", color: "var(--color-paper)",
          display: "grid", placeItems: "center",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, letterSpacing: "-0.04em",
          position: "relative", flexShrink: 0,
        }}>
          M
          <span style={{
            position: "absolute", inset: 4, borderRadius: "50%",
            border: "1px dashed var(--color-paper)", opacity: 0.4,
          }} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 48, lineHeight: 0.85, letterSpacing: "-0.04em", color: "var(--color-ink)" }}>
            MERIDIAN
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-ink-3)", marginTop: 4 }}>
            Personal Capital
          </div>
        </div>
      </div>

      {/* CENTER: edition line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em",
          textTransform: "uppercase", color: "var(--color-ink-2)",
          borderTop: "1px solid var(--color-ink)", borderBottom: "1px solid var(--color-ink)",
          padding: "5px 16px", display: "inline-flex", gap: 12, alignItems: "center",
        }}>
          <span>{dateStr}</span>
          <span style={{ width: 3, height: 3, background: "var(--color-ink)", borderRadius: "50%" }} />
          <span>Investment Platform</span>
          <span style={{ width: 3, height: 3, background: "var(--color-ink)", borderRadius: "50%" }} />
          <span>BRL · USD · CRYPTO</span>
        </div>
      </div>

      {/* RIGHT: market status + clock + currency toggle + refresh */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* NYSE */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: nyseOpen ? "var(--color-teal)" : "var(--color-ink-4)",
              animation: nyseOpen ? "pulse 2s ease-out infinite" : "none",
              display: "inline-block",
            }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", color: nyseOpen ? "var(--color-teal)" : "var(--color-ink-4)" }}>NYSE</span>
          </div>
          {/* B3 */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: b3Open ? "var(--color-teal)" : "var(--color-ink-4)",
              animation: b3Open ? "pulse 2s ease-out infinite" : "none",
              display: "inline-block",
            }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", color: b3Open ? "var(--color-teal)" : "var(--color-ink-4)" }}>B3</span>
          </div>
          {/* Clock */}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-2)" }}>{timeStr}</span>
          {/* Refresh */}
          <button onClick={handleRefresh} disabled={isRefreshing} title="Refresh prices" style={{
            width: 28, height: 28, border: "1px solid var(--color-ink)",
            background: "var(--color-paper-2)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: isRefreshing ? 0.5 : 1,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="2"
              style={{ animation: isRefreshing ? "topbarSpin 0.8s linear infinite" : "none" }}>
              <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7-3.3M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7 3.3" />
              <path d="M21 3v6h-6M3 21v-6h6" />
            </svg>
          </button>
        </div>
        {/* Currency toggle */}
        <div style={{ display: "flex", border: "1px solid var(--color-ink)" }}>
          {(["BRL", "USD"] as Currency[]).map(c => (
            <button key={c} onClick={() => setCurrency(c)} style={{
              padding: "4px 10px", fontFamily: "var(--font-mono)", fontSize: 11,
              background: c === currency ? "var(--color-ink)" : "var(--color-paper)",
              color: c === currency ? "var(--color-paper)" : "var(--color-ink-3)",
              border: "none", cursor: "pointer", fontWeight: c === currency ? 600 : 400,
              borderRight: c === "BRL" ? "1px solid var(--color-ink)" : "none",
            }}>{c}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
