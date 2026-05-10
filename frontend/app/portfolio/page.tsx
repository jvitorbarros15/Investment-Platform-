"use client";

import { useCallback, useState, useMemo } from "react";
import type { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHoldings, getPortfolioSummary } from "@/lib/api";
import { Reveal } from "@/components/ui/reveal";
import { Sparkline } from "@/components/ui/sparkline";
import { CLASS_COLOR } from "@/components/ui/class-chip";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useCurrencyStore } from "@/lib/currency-store";
import { convertCurrency, formatCurrency } from "@/lib/formatters";
import type { AssetClass, Holding } from "@/lib/types";

const TABS: { label: string; value: AssetClass | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "US Stocks", value: "US_STOCK" },
  { label: "BR Stocks", value: "BR_STOCK" },
  { label: "FIIs", value: "FII" },
  { label: "Crypto", value: "CRYPTO" },
];

function genSparkData(seed: number, n = 30): number[] {
  const r = (i: number) => Math.sin(seed * 0.1 + i * 0.7) * 0.03 + (Math.sin(i * 0.3 + seed) * 0.01);
  let v = 100;
  return Array.from({ length: n }, (_, i) => { v = v * (1 + r(i)); return v; });
}

function formatNum(v: number, decimals = 2): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatPct(v: number): string {
  return (v * 100).toFixed(2) + "%";
}

export default function HoldingsPage() {
  const [filter, setFilter] = useState<AssetClass | "ALL">("ALL");
  const [sort, setSort] = useState<{ key: string; dir: number }>({ key: "value", dir: -1 });
  const displayCurrency = useCurrencyStore((s) => s.currency);

  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["holdings"],
    queryFn: getHoldings,
  });
  const { data: summary } = useQuery({ queryKey: ["portfolio-summary"], queryFn: getPortfolioSummary });

  const usdBrl = summary?.usd_to_brl ?? 5.70;
  const toDisplay = useCallback(
    (value: number, currency: "BRL" | "USD") => convertCurrency(value, currency, displayCurrency, usdBrl),
    [displayCurrency, usdBrl]
  );

  const filtered = useMemo(() => {
    let rows = holdings.slice();
    if (filter !== "ALL") rows = rows.filter((h: Holding) => h.asset_class === filter);

    rows.sort((a: Holding, b: Holding) => {
      let aVal = 0,
        bVal = 0;
      if (sort.key === "value") {
        aVal = toDisplay(a.current_value || 0, a.currency);
        bVal = toDisplay(b.current_value || 0, b.currency);
      } else if (sort.key === "gain") {
        aVal = toDisplay(a.total_gain || 0, a.currency);
        bVal = toDisplay(b.total_gain || 0, b.currency);
      } else if (sort.key === "return") {
        aVal = a.return_pct || 0;
        bVal = b.return_pct || 0;
      }
      return (aVal - bVal) * sort.dir;
    });
    return rows;
  }, [holdings, filter, sort, toDisplay]);

  const totalValue = filtered.reduce((s: number, h: Holding) => s + toDisplay(h.current_value || 0, h.currency), 0);
  const totalGain = filtered.reduce((s: number, h: Holding) => s + toDisplay(h.total_gain || 0, h.currency), 0);
  const avgReturn = filtered.length > 0 ? filtered.reduce((s: number, h: Holding) => s + (h.return_pct || 0), 0) / filtered.length : 0;

  const headers = [
    { key: "asset", label: "Asset", sortable: false },
    { key: "qty", label: "Qty", sortable: false, align: "right" },
    { key: "avg", label: "Avg cost", sortable: false, align: "right" },
    { key: "price", label: "Price", sortable: false, align: "right" },
    { key: "spark", label: "30D", sortable: false, align: "center" },
    { key: "value", label: "Value", sortable: true, align: "right" },
    { key: "gain", label: "Gain", sortable: true, align: "right" },
    { key: "return", label: "Return", sortable: true, align: "right" },
  ];

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
            Holdings · {filtered.length} positions
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px, 4vw, 36px)", lineHeight: 1.2, color: "#f5f1e8", margin: 0 }}>
            Portfolio breakdown
          </h1>
        </div>
      </Reveal>

      {/* FILTER TABS */}
      <Reveal delay={50}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: filter === tab.value ? "1px solid rgba(201, 247, 111, 0.3)" : "1px solid rgba(255,255,255,0.1)",
                background: filter === tab.value ? "rgba(201, 247, 111, 0.1)" : "rgba(0,0,0,0.2)",
                color: filter === tab.value ? "#c9f76f" : "#8892a4",
                fontSize: 13,
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* SUMMARY STRIP */}
      <Reveal delay={100}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
          }}
        >
          <div style={{ ...PANEL, padding: 16 }}>
            <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>
              Subset value
            </div>
            <div style={{ color: "#f5f1e8", fontSize: 22, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
              <AnimatedNumber value={totalValue} fmt={(v) => formatCurrency(v, displayCurrency)} />
            </div>
          </div>
          <div style={{ ...PANEL, padding: 16 }}>
            <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>
              Subset gain
            </div>
            <div style={{ color: totalGain >= 0 ? "#7dd3a8" : "#e07b6c", fontSize: 22, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
              {totalGain >= 0 ? "+" : ""}<AnimatedNumber value={totalGain} fmt={(v) => v.toLocaleString("en-US", { maximumFractionDigits: 0 })} />
            </div>
          </div>
          <div style={{ ...PANEL, padding: 16 }}>
            <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>
              Avg return
            </div>
            <div style={{ color: avgReturn >= 0 ? "#7dd3a8" : "#e07b6c", fontSize: 22, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
              {formatPct(avgReturn)}
            </div>
          </div>
          <div style={{ ...PANEL, padding: 16 }}>
            <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>
              Positions
            </div>
            <div style={{ color: "#f5f1e8", fontSize: 22, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
              {filtered.length}
            </div>
          </div>
        </div>
      </Reveal>

      {/* TABLE */}
      <Reveal delay={150}>
        <div
          style={{
            ...PANEL,
            padding: 0,
            overflowX: "auto",
            overflowY: "hidden",
          }}
        >
          {isLoading ? (
            <div style={{ padding: 24, textAlign: "center", color: "#8892a4" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#8892a4" }}>No holdings</div>
          ) : (
            <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
                {headers.map((h) => (
                    <th
                      key={h.key}
                      onClick={() => h.sortable && setSort((s) => ({ key: h.key, dir: s.key === h.key ? -s.dir : -1 }))}
                      style={{
                        padding: "12px 16px",
                        textAlign: (h.align as CSSProperties["textAlign"]) || "left",
                        color: "#8892a4",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        cursor: h.sortable ? "pointer" : "default",
                        userSelect: "none",
                      }}
                    >
                      {h.label}
                      {h.sortable && sort.key === h.key && (
                        <span style={{ marginLeft: 6, color: "#c9f76f" }}>
                          {sort.dir < 0 ? "↓" : "↑"}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((h: Holding, i: number) => {
                  const series = genSparkData(h.ticker.charCodeAt(0), 30);
                  const gain = h.total_gain || 0;
                  const ret = h.return_pct || 0;
                  const changeColor = (h.change_1d || 0) >= 0 ? "#7dd3a8" : "#e07b6c";

                  return (
                    <tr
                      key={h.ticker}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        transition: "background 0.15s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      {/* ASSET */}
                      <td style={{ padding: "12px 16px", color: "#f5f1e8" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: CLASS_COLOR[h.asset_class] + "22",
                              color: CLASS_COLOR[h.asset_class],
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 600,
                              fontFamily: "JetBrains Mono, monospace",
                            }}
                          >
                            {h.ticker.slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ color: "#f5f1e8", fontSize: 13, fontWeight: 600, fontFamily: "JetBrains Mono, monospace" }}>
                              {h.ticker}
                            </div>
                            <div style={{ color: "#8892a4", fontSize: 12, marginTop: 2 }}>
                              {h.name} {h.sector ? `· ${h.sector}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* QTY */}
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#f5f1e8", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>
                        {formatNum(h.quantity || 0, h.asset_class === "CRYPTO" ? 4 : 0)}
                      </td>

                      {/* AVG COST */}
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#8892a4", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>
                        {formatCurrency(toDisplay(h.average_cost || 0, h.currency), displayCurrency)}
                      </td>

                      {/* PRICE */}
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#f5f1e8", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>
                        {formatCurrency(toDisplay(h.current_price || 0, h.currency), displayCurrency)}
                      </td>

                      {/* 30D SPARKLINE */}
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <Sparkline data={series} width={70} height={22} color={changeColor} strokeWidth={1.3} fill={false} />
                      </td>

                      {/* VALUE */}
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#f5f1e8", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>
                        {formatCurrency(toDisplay(h.current_value || 0, h.currency), displayCurrency)}
                      </td>

                      {/* GAIN */}
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: gain >= 0 ? "#7dd3a8" : "#e07b6c" }}>
                        {gain >= 0 ? "+" : ""}{formatCurrency(Math.abs(toDisplay(gain, h.currency)), displayCurrency)}
                      </td>

                      {/* RETURN */}
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: ret >= 0 ? "#7dd3a8" : "#e07b6c" }}>
                        {formatPct(ret)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Reveal>
    </div>
  );
}
