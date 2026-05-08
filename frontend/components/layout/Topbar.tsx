"use client";

import { useState, useEffect } from "react";
import { refreshPrices } from "@/lib/api";

export function Topbar() {
  const [now, setNow] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try { await refreshPrices(); } catch {}
    finally { setIsRefreshing(false); }
  };

  return (
    <header style={{
      height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)",
      background: "#0c0b08", display: "flex", alignItems: "center",
      padding: "0 32px", gap: 24, position: "sticky", top: 0, zIndex: 30,
    }}>
      {/* Left: market status + date */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7dd3a8", animation: "marketPulse 2s infinite", display: "inline-block" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", color: "#7dd3a8" }}>MARKETS OPEN</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(245,241,232,0.5)" }}>{timeStr} <span style={{ opacity: 0.5 }}>EST</span></span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(245,241,232,0.35)" }}>{dateStr}</span>
      </div>

      {/* Center: search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#14130f", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8, padding: "6px 12px", width: 320,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,232,0.35)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input placeholder="Search ticker, asset…" style={{
          flex: 1, background: "none", border: "none", outline: "none",
          fontSize: 13, color: "#f5f1e8", fontFamily: "var(--font-sans)",
        }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(245,241,232,0.25)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px" }}>⌘K</span>
      </div>

      {/* Right: CCY toggle + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" }}>
        <div style={{ display: "flex", background: "#14130f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, overflow: "hidden" }}>
          {["USD", "BRL"].map(c => (
            <button key={c} style={{
              padding: "4px 10px", fontSize: 11, fontFamily: "var(--font-mono)",
              background: c === "BRL" ? "#c9f76f" : "none",
              color: c === "BRL" ? "#0c0b08" : "rgba(245,241,232,0.5)",
              border: "none", cursor: "pointer", fontWeight: c === "BRL" ? 600 : 400,
            }}>{c}</button>
          ))}
        </div>
        <button onClick={handleRefresh} disabled={isRefreshing} style={{
          width: 32, height: 32, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
          background: "#14130f", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          opacity: isRefreshing ? 0.5 : 1,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,232,0.6)" strokeWidth="2">
            <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7-3.3M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7 3.3" />
            <path d="M21 3v6h-6M3 21v-6h6" />
          </svg>
        </button>
        <button style={{
          width: 32, height: 32, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
          background: "#14130f", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,232,0.6)" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </header>
  );
}
