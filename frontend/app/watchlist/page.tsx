"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getWatchlist } from "@/lib/api";
import { Reveal } from "@/components/ui/reveal";
import { Sparkline } from "@/components/ui/sparkline";
import type { WatchlistStatus, WatchlistItem } from "@/lib/types";

const STATUS_FILTERS: { value: WatchlistStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "STRONG_CANDIDATE", label: "Strong candidate" },
  { value: "WAITING_PRICE", label: "Waiting price" },
  { value: "STUDYING", label: "Studying" },
  { value: "AVOID", label: "Avoid" },
];

const STATUS_COLORS: Record<WatchlistStatus, string> = {
  STRONG_CANDIDATE: "var(--color-terracotta)",
  WAITING_PRICE: "var(--color-ochre)",
  STUDYING: "var(--color-teal)",
  AVOID: "var(--color-ink-3)",
  BOUGHT: "var(--color-teal)",
};

const STATUS_LABELS: Record<WatchlistStatus, string> = {
  STRONG_CANDIDATE: "Strong candidate",
  WAITING_PRICE: "Waiting price",
  STUDYING: "Studying",
  AVOID: "Avoid for now",
  BOUGHT: "Bought",
};

function genSparkData(seed: number, n = 60): number[] {
  const r = (i: number) => Math.sin(seed * 0.1 + i * 0.7) * 0.025 + (Math.sin(i * 0.3 + seed) * 0.01);
  let v = 100;
  return Array.from({ length: n }, (_, i) => { v = v * (1 + r(i)); return v; });
}

function formatPct(v: number): string {
  return (v * 100).toFixed(2) + "%";
}

export default function WatchlistPage() {
  const [filter, setFilter] = useState<WatchlistStatus | "ALL">("ALL");
  const router = useRouter();

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: getWatchlist,
  });

  const filtered = useMemo(() => {
    if (filter === "ALL") return watchlist;
    return watchlist.filter((w: WatchlistItem) => w.status === filter);
  }, [watchlist, filter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* HEADER */}
      <Reveal>
        <div style={{ paddingBottom: 20, borderBottom: "1px solid var(--color-ink)", marginBottom: 24 }}>
          <div className="kicker" style={{ marginBottom: 8 }}>Watchlist · {watchlist.length} candidates</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(30px, 4vw, 48px)", lineHeight: 0.9, color: "var(--color-ink)", margin: 0, letterSpacing: "-0.03em" }}>
            What you&apos;re studying
          </h1>
        </div>
      </Reveal>

      {/* FILTER TABS */}
      <Reveal delay={50}>
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--color-ink)" }}>
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{
              padding: "10px 16px", border: "none", borderRight: "1px solid var(--color-rule-2)",
              background: filter === f.value ? "var(--color-ink)" : "transparent",
              color: filter === f.value ? "var(--color-paper)" : "var(--color-ink-3)",
              fontSize: 13, fontWeight: filter === f.value ? 700 : 500, cursor: "pointer",
              fontFamily: "var(--font-mono)",
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* LIST */}
      <Reveal delay={100}>
        {isLoading ? (
          <div style={{ color: "var(--color-ink-3)", fontFamily: "var(--font-mono)", padding: 24 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "var(--color-ink-3)", fontFamily: "var(--font-mono)", padding: 24 }}>No watchlist items</div>
        ) : (
          <div style={{ border: "1px solid var(--color-ink)" }}>
            {filtered.map((w: WatchlistItem, i: number) => {
              const series = genSparkData(w.ticker.charCodeAt(1), 60);
              const currentPrice = w.current_price || 0;
              const targetPrice = w.target_price || currentPrice;
              const distance = targetPrice > 0 ? ((currentPrice - targetPrice) / targetPrice) * 100 : 0;
              const above = currentPrice > targetPrice;
              const statusColor = STATUS_COLORS[w.status] || "var(--color-ink-3)";
              const minP = Math.min(currentPrice, targetPrice) * 0.95;
              const maxP = Math.max(currentPrice, targetPrice) * 1.05;
              const pctAlongTrack = maxP > minP ? ((currentPrice - minP) / (maxP - minP)) * 100 : 50;

              return (
                <div key={w.id} onClick={() => router.push(`/assets/${encodeURIComponent(w.ticker)}`)}
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--color-rule-2)" : "none",
                    padding: "18px 24px", cursor: "pointer", display: "grid",
                    gridTemplateColumns: "160px 1fr auto auto auto",
                    gap: 24, alignItems: "center",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-paper-2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>

                  {/* TICKER + NAME */}
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}>{w.ticker}</div>
                    <div style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 2 }}>{w.name || "Unknown"}</div>
                    <span style={{
                      display: "inline-block", marginTop: 6, padding: "2px 8px",
                      background: statusColor, color: "var(--color-paper)",
                      fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}>
                      {STATUS_LABELS[w.status]}
                    </span>
                  </div>

                  {/* TARGET PRICE TRACK */}
                  <div>
                    <div style={{ position: "relative", height: 1, background: "var(--color-ink)", margin: "12px 0" }}>
                      <span style={{ position: "absolute", left: 0, top: -3, width: 7, height: 7, background: "var(--color-ink)", borderRadius: "50%" }} />
                      <span style={{ position: "absolute", right: 0, top: -3, width: 7, height: 7, background: "var(--color-ink)", borderRadius: "50%" }} />
                      <span style={{
                        position: "absolute", top: -5, left: `${pctAlongTrack}%`, width: 11, height: 11,
                        background: "var(--color-terracotta)", borderRadius: "50%", border: "2px solid var(--color-paper)",
                        transform: "translateX(-50%)",
                      }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-ink-3)" }}>
                      <span>${minP.toFixed(2)}</span>
                      <span>${maxP.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* CURRENT + TARGET */}
                  <div style={{ textAlign: "right" }}>
                    <div className="kicker" style={{ marginBottom: 4 }}>Current</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--color-ink)" }}>${currentPrice.toFixed(2)}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: above ? "var(--color-crimson)" : "var(--color-teal)", marginTop: 2 }}>
                      {above ? "▲" : "▼"} {Math.abs(distance).toFixed(1)}% from target
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="kicker" style={{ marginBottom: 4 }}>Target</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--color-ink-2)" }}>${targetPrice.toFixed(2)}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-3)", marginTop: 2 }}>
                      30D {w.change_30d ? formatPct(w.change_30d) : "—"}
                    </div>
                  </div>

                  {/* SPARKLINE */}
                  <Sparkline data={series} width={90} height={32} color={above ? "#99291b" : "#0d6b65"} strokeWidth={1.5} fill={false} />
                </div>
              );
            })}
          </div>
        )}
      </Reveal>
    </div>
  );
}
