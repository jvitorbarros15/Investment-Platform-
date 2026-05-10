"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAssetDetail, getAssetHistory, getHoldings } from "@/lib/api";
import { PortfolioLineChart } from "@/components/charts/PortfolioLineChart";
import { ClassChip, CLASS_COLOR } from "@/components/ui/class-chip";
import { Reveal } from "@/components/ui/reveal";
import type { Holding } from "@/lib/types";

function formatPct(v: number): string {
  return (v * 100).toFixed(2) + "%";
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = decodeURIComponent(params.ticker as string);
  const [range, setRange] = useState("6M");

  const { data: holdings = [] } = useQuery({ queryKey: ["holdings"], queryFn: getHoldings });
  const { data: quote } = useQuery({ queryKey: ["asset-detail", ticker], queryFn: () => getAssetDetail(ticker) });
  const { data: history = [] } = useQuery({
    queryKey: ["asset-history", ticker, range],
    queryFn: () => getAssetHistory(ticker, range === "1M" ? "30d" : range === "3M" ? "90d" : range === "6M" ? "180d" : "365d"),
  });

  const holding = holdings.find((h: Holding) => h.ticker === ticker);
  const assetClass = holding?.asset_class || (ticker.startsWith("^") ? "INDEX" : ticker.endsWith(".SA") ? "BR_STOCK" : "US_STOCK");
  const color = CLASS_COLOR[assetClass] ?? "#9ec5fe";
  const currentPrice = holding?.current_price || quote?.price || 0;
  const displayName = holding?.name || quote?.name || ticker;
  const displayCurrency = holding?.currency || quote?.currency || "USD";
  const chartData = history.map((point: { date: string; close?: number; value?: number }) => ({
    date: point.date,
    value: point.close ?? point.value ?? 0,
  }));

  const panel = {
    background: "#14130f",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 24,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Reveal>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", fontSize: 14, fontFamily: "JetBrains Mono, monospace" }}
        >
          Back
        </button>
      </Reveal>

      <Reveal>
        <section style={{ ...panel, background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", minWidth: 0 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: color + "22",
                color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 600,
                fontFamily: "JetBrains Mono, monospace",
              }}>
                {ticker.replace("^", "").slice(0, 2)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                  <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 600, color: "#f5f1e8", margin: 0 }}>
                    {ticker}
                  </h1>
                  <ClassChip assetClass={assetClass} />
                  {holding && (
                    <span style={{ padding: "4px 8px", borderRadius: 6, background: "#c9f76f15", color: "#c9f76f", border: "1px solid #c9f76f30", fontSize: 11, fontWeight: 600 }}>
                      In portfolio
                    </span>
                  )}
                </div>
                <div style={{ color: "#8892a4", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName} {holding?.sector ? `- ${holding.sector}` : ""}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 36, fontWeight: 600, color: "#f5f1e8", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>
                {displayCurrency} {Number(currentPrice).toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </div>
              <div style={{ color: (holding?.change_1d || 0) >= 0 ? "#7dd3a8" : "#e07b6c", fontFamily: "JetBrains Mono, monospace", fontSize: 14 }}>
                {formatPct(holding?.change_1d || 0)} today
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={100}>
        <section style={panel}>
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>
                Price history
              </div>
              <h3 style={{ color: "#f5f1e8", fontSize: 20, fontWeight: 600, margin: 0 }}>
                {range} performance
              </h3>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["1M", "3M", "6M", "1Y"].map((item) => (
                <button
                  key={item}
                  onClick={() => setRange(item)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 4,
                    border: range === item ? "1px solid #c9f76f30" : "1px solid rgba(255,255,255,0.1)",
                    background: range === item ? "rgba(201,247,111,0.1)" : "transparent",
                    color: range === item ? "#c9f76f" : "#8892a4",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {chartData.length > 0 ? (
            <PortfolioLineChart data={chartData} color={color} currency={displayCurrency === "BRL" ? "BRL" : "USD"} />
          ) : (
            <div style={{ color: "#8892a4", minHeight: 180, display: "flex", alignItems: "center" }}>No data available</div>
          )}
        </section>
      </Reveal>
    </div>
  );
}
