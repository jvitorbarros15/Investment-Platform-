"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWatchlist } from "@/lib/api";
import { Reveal } from "@/components/ui/reveal";
import { Sparkline } from "@/components/ui/sparkline";
import { ClassChip, CLASS_COLOR } from "@/components/ui/class-chip";
import { ScoreBadge } from "@/components/ui/score-badge";
import type { WatchlistStatus, WatchlistItem } from "@/lib/types";

const STATUS_FILTERS: { value: WatchlistStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "STRONG_CANDIDATE", label: "Strong candidate" },
  { value: "WAITING_PRICE", label: "Waiting price" },
  { value: "STUDYING", label: "Studying" },
  { value: "AVOID", label: "Avoid" },
];

const STATUS_COLORS: Record<WatchlistStatus, string> = {
  STRONG_CANDIDATE: "#c9f76f",
  WAITING_PRICE: "#f0c674",
  STUDYING: "#9ec5fe",
  AVOID: "#e07b6c",
  BOUGHT: "#7dd3a8",
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

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: getWatchlist,
  });

  const filtered = useMemo(() => {
    if (filter === "ALL") return watchlist;
    return watchlist.filter((w: WatchlistItem) => w.status === filter);
  }, [watchlist, filter]);

  const PANEL = {
    background: "#14130f",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 24,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* HEADER */}
      <Reveal>
        <div>
          <div style={{ marginBottom: 8, color: "#8892a4", fontSize: 12, fontWeight: 500, letterSpacing: "0.05em" }}>
            Watchlist · {watchlist.length} candidates
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f5f1e8", margin: 0 }}>
            What you're studying
          </h1>
        </div>
      </Reveal>

      {/* FILTER TABS */}
      <Reveal delay={50}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: filter === f.value ? "1px solid rgba(201, 247, 111, 0.3)" : "1px solid rgba(255,255,255,0.1)",
                background: filter === f.value ? "rgba(201, 247, 111, 0.1)" : "rgba(0,0,0,0.2)",
                color: filter === f.value ? "#c9f76f" : "#8892a4",
                fontSize: 13,
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* CARD GRID */}
      <Reveal delay={100}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {isLoading ? (
            <div style={{ color: "#8892a4" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: "#8892a4" }}>No watchlist items</div>
          ) : (
            filtered.map((w: WatchlistItem, i: number) => {
              const series = genSparkData(w.ticker.charCodeAt(1), 60);
              const currentPrice = w.current_price || 0;
              const targetPrice = w.target_price || currentPrice;
              const distance = targetPrice > 0 ? ((currentPrice - targetPrice) / targetPrice) * 100 : 0;
              const above = currentPrice > targetPrice;
              const statusColor = STATUS_COLORS[w.status] || "#9ec5fe";
              const progress = Math.max(0, Math.min(100, 100 - Math.abs(distance) * 6));

              return (
                <Reveal key={w.id} delay={i * 60}>
                  <div
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
                    {/* HEADER */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16, fontWeight: 600, fontFamily: "JetBrains Mono, monospace", color: "#f5f1e8" }}>
                            {w.ticker}
                          </span>
                          {w.asset_class && <ClassChip assetClass={w.asset_class} />}
                        </div>
                        <div style={{ fontSize: 13, color: "#8892a4" }}>{w.name || "Unknown"}</div>
                      </div>
                      {w.score && <ScoreBadge score={Math.round(w.score)} />}
                    </div>

                    {/* SPARKLINE */}
                    <div style={{ marginBottom: 16, overflow: "hidden", borderRadius: 8 }}>
                      <Sparkline data={series} width={280} height={48} color={statusColor} strokeWidth={1.6} fill={true} />
                    </div>

                    {/* PRICES */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#8892a4", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>
                          Current
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: "#f5f1e8", fontFamily: "JetBrains Mono, monospace" }}>
                          ${currentPrice.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: above ? "#e89b7c" : "#7dd3a8", textAlign: "center" }}>
                        {above ? "↑" : "↓"}
                        <div style={{ fontSize: 13 }}>{Math.abs(distance).toFixed(1)}%</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "#8892a4", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>
                          Target
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: "#f5f1e8", fontFamily: "JetBrains Mono, monospace" }}>
                          ${targetPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          width: "100%",
                          height: 6,
                          borderRadius: 3,
                          background: "rgba(0,0,0,0.4)",
                          overflow: "hidden",
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${progress}%`,
                            background: statusColor,
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8892a4" }}>
                        <span style={{ color: statusColor, fontWeight: 600 }}>{STATUS_LABELS[w.status]}</span>
                        <span>30D {w.change_30d ? formatPct(w.change_30d) : "—"}</span>
                      </div>
                    </div>

                    {/* REASON */}
                    <div
                      style={{
                        fontSize: 12,
                        color: "#8892a4",
                        fontStyle: "italic",
                        marginTop: "auto",
                        paddingTop: 12,
                        borderTop: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      "{w.reason || "No reason provided"}"
                    </div>
                  </div>
                </Reveal>
              );
            })
          )}
        </div>
      </Reveal>
    </div>
  );
}
