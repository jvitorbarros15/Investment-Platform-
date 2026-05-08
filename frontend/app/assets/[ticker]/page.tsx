"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAssetDetail, getAssetHistory, getHoldings } from "@/lib/api";
import { Reveal } from "@/components/ui/reveal";
import { Sparkline } from "@/components/ui/sparkline";
import { ClassChip, CLASS_COLOR } from "@/components/ui/class-chip";
import { ScoreBadge } from "@/components/ui/score-badge";
import { PortfolioLineChart } from "@/components/charts/PortfolioLineChart";
import type { Holding } from "@/lib/types";

function genSparkData(seed: number, n = 30): number[] {
  const r = (i: number) => Math.sin(seed * 0.1 + i * 0.7) * 0.03 + (Math.sin(i * 0.3 + seed) * 0.01);
  let v = 100;
  return Array.from({ length: n }, (_, i) => { v = v * (1 + r(i)); return v; });
}

function formatPct(v: number): string {
  return (v * 100).toFixed(2) + "%";
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = params.ticker as string;
  const [range, setRange] = useState("6M");

  const { data: holdings = [] } = useQuery({ queryKey: ["holdings"], queryFn: () => import("@/lib/api").then(m => m.getHoldings()) });
  const { data: history = [] } = useQuery({
    queryKey: ["asset-history", ticker, range],
    queryFn: () => import("@/lib/api").then(m => m.getAssetHistory(ticker, range === "1M" ? "30d" : range === "3M" ? "90d" : range === "6M" ? "180d" : "365d")),
  });

  const holding = holdings.find((h: Holding) => h.ticker === ticker);
  const inPortfolio = !!holding;

  const scoreBreakdown = [
    { label: "Quality", value: 84 },
    { label: "Value", value: 62 },
    { label: "Growth", value: 78 },
    { label: "Dividend", value: 45 },
    { label: "Health", value: 88 },
    { label: "Momentum", value: 72 },
    { label: "Risk", value: 60 },
    { label: "Fit", value: 80 },
  ];

  const asset_class = holding?.asset_class || "US_STOCK";

  const PANEL = {
    background: "#14130f",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 24,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* BACK BUTTON */}
      <Reveal>
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            color: "#8892a4",
            cursor: "pointer",
            fontSize: 14,
            fontFamily: "JetBrains Mono, monospace",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f5f1e8"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#8892a4"; }}
        >
          ← Back
        </button>
      </Reveal>

      {/* HERO */}
      <Reveal>
        <div
          style={{
            ...PANEL,
            background: `linear-gradient(135deg, ${CLASS_COLOR[asset_class]}15 0%, ${CLASS_COLOR[asset_class]}08 100%)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: CLASS_COLOR[asset_class] + "22",
                  color: CLASS_COLOR[asset_class],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 600,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {ticker.slice(0, 2)}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <h1
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 36,
                      fontWeight: 600,
                      color: "#f5f1e8",
                      margin: 0,
                    }}
                  >
                    {ticker}
                  </h1>
                  <ClassChip assetClass={asset_class} />
                  {inPortfolio && (
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        background: "#c9f76f15",
                        color: "#c9f76f",
                        border: "1px solid #c9f76f30",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      In portfolio
                    </span>
                  )}
                </div>
                <div style={{ color: "#8892a4", fontSize: 14 }}>
                  {holding?.name || "Asset"} {holding?.sector ? `· ${holding.sector}` : ""}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 36, fontWeight: 600, color: "#f5f1e8", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>
                ${(holding?.current_price || 0).toFixed(2)}
              </div>
              <div
                style={{
                  color: (holding?.change_1d || 0) >= 0 ? "#7dd3a8" : "#e07b6c",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 14,
                }}
              >
                {formatPct(holding?.change_1d || 0)} today
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* PRICE CHART */}
      <Reveal delay={100}>
        <div style={PANEL}>
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>
                Price history
              </div>
              <h3 style={{ color: "#f5f1e8", fontSize: 20, fontWeight: 600, margin: 0 }}>
                {range} performance
              </h3>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["1M", "3M", "6M", "1Y"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 4,
                    border: range === r ? "1px solid #c9f76f30" : "1px solid rgba(255,255,255,0.1)",
                    background: range === r ? "rgba(201,247,111,0.1)" : "transparent",
                    color: range === r ? "#c9f76f" : "#8892a4",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 300, display: "flex", alignItems: "flex-end", gap: 4 }}>
            {history.length > 0 ? (
              <PortfolioLineChart
                data={history}
                color={CLASS_COLOR[asset_class]}
              />
            ) : (
              <div style={{ color: "#8892a4" }}>No data available</div>
            )}
          </div>
        </div>
      </Reveal>

      {/* SCORE & METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <Reveal delay={180}>
          <div style={PANEL}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>
                Score breakdown
              </div>
              <h3 style={{ color: "#f5f1e8", fontSize: 20, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                Overall <ScoreBadge score={75} size="lg" />
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {scoreBreakdown.map((s) => (
                <div key={s.label} style={{ paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#8892a4", fontSize: 12 }}>{s.label}</span>
                    <span style={{ color: "#f5f1e8", fontSize: 12, fontWeight: 600, fontFamily: "JetBrains Mono" }}>
                      {s.value}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 4, borderRadius: 2, background: "rgba(0,0,0,0.3)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${s.value}%`,
                        background:
                          s.value >= 75
                            ? "#c9f76f"
                            : s.value >= 60
                            ? "#7dd3a8"
                            : s.value >= 40
                            ? "#f0c674"
                            : "#e07b6c",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={260}>
          <div style={PANEL}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>
                Key metrics
              </div>
              <h3 style={{ color: "#f5f1e8", fontSize: 20, fontWeight: 600, margin: 0 }}>
                Fundamentals
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "P/E Ratio", value: "24.5x" },
                { label: "Dividend Yield", value: "2.1%" },
                { label: "ROE", value: "18%" },
                { label: "Debt/Equity", value: "0.8" },
              ].map((m) => (
                <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#8892a4", fontSize: 12 }}>{m.label}</span>
                  <span style={{ color: "#f5f1e8", fontSize: 12, fontWeight: 600, fontFamily: "JetBrains Mono" }}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* STRENGTHS & CONCERNS */}
      <Reveal delay={340}>
        <div style={PANEL}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>
              Strengths & concerns
            </div>
            <h3 style={{ color: "#f5f1e8", fontSize: 20, fontWeight: 600, margin: 0 }}>
              Why this score
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { type: "strength", label: "High return on equity (28%)", desc: "above sector median" },
              { type: "strength", label: "Consistent free cash flow growth", desc: "low debt-to-equity" },
              { type: "concern", label: "Forward P/E premium", desc: "vs 5-year median — value score weak" },
              { type: "concern", label: "Sector concentration risk", desc: "already 35% Technology exposure" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background:
                    item.type === "strength"
                    ? "rgba(201, 247, 111, 0.08)"
                    : "rgba(224, 123, 108, 0.08)",
                  border:
                    item.type === "strength"
                    ? "1px solid rgba(201, 247, 111, 0.2)"
                    : "1px solid rgba(224, 123, 108, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    color: item.type === "strength" ? "#c9f76f" : "#e07b6c",
                    marginBottom: 4,
                  }}
                >
                  {item.type === "strength" ? "++ STRENGTH" : "-- CONCERN"}
                </div>
                <div style={{ color: "#f5f1e8", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ color: "#8892a4", fontSize: 12 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* TRANSACTIONS (if in portfolio) */}
      {inPortfolio && (
        <Reveal delay={420}>
          <div style={PANEL}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>
                Transaction history
              </div>
              <h3 style={{ color: "#f5f1e8", fontSize: 20, fontWeight: 600, margin: 0 }}>
                3 transactions
              </h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <th style={{ textAlign: "left", padding: "8px 0", color: "#8892a4", fontSize: 11, fontWeight: 600 }}>
                    Date
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 0", color: "#8892a4", fontSize: 11, fontWeight: 600 }}>
                    Type
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 0", color: "#8892a4", fontSize: 11, fontWeight: 600 }}>
                    Qty
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 0", color: "#8892a4", fontSize: 11, fontWeight: 600 }}>
                    Price
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 0", color: "#8892a4", fontSize: 11, fontWeight: 600 }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: "2024-08-15", type: "BUY", qty: 20, price: 150, total: 3000 },
                  { date: "2024-11-22", type: "BUY", qty: 15, price: 155, total: 2325 },
                  { date: "2025-03-08", type: "BUY", qty: 15, price: 160, total: 2400 },
                ].map((t) => (
                  <tr key={t.date} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "10px 0", color: "#8892a4", fontSize: 13, fontFamily: "JetBrains Mono" }}>
                      {t.date}
                    </td>
                    <td style={{ padding: "10px 0", color: "#7dd3a8", fontSize: 13, fontWeight: 600 }}>
                      {t.type}
                    </td>
                    <td style={{ padding: "10px 0", color: "#f5f1e8", fontSize: 13, fontFamily: "JetBrains Mono", textAlign: "right" }}>
                      {t.qty}
                    </td>
                    <td style={{ padding: "10px 0", color: "#f5f1e8", fontSize: 13, fontFamily: "JetBrains Mono", textAlign: "right" }}>
                      ${t.price.toFixed(2)}
                    </td>
                    <td style={{ padding: "10px 0", color: "#f5f1e8", fontSize: 13, fontFamily: "JetBrains Mono", textAlign: "right" }}>
                      ${t.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      )}
    </div>
  );
}
