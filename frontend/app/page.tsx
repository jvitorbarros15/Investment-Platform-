"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AllocationChart } from "@/components/dashboard/AllocationChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { formatBRL, formatUSD, formatPct, getReturnColor, assetClassLabel } from "@/lib/formatters";
import { getPortfolioSummary, getHoldings, getPortfolioHistory, refreshPrices } from "@/lib/api";
import type { Holding } from "@/lib/types";

function withWeights(holdings: Holding[]): (Holding & { weight_in_class: number })[] {
  const totals: Record<string, number> = {};
  for (const h of holdings) totals[h.asset_class] = (totals[h.asset_class] || 0) + h.current_value;
  return holdings.map((h) => ({ ...h, weight_in_class: totals[h.asset_class] > 0 ? (h.current_value / totals[h.asset_class]) * 100 : 0 }));
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const [lastRefreshMessage, setLastRefreshMessage] = useState<string | null>(null);
  const {
    mutate: refreshLivePrices,
    isPending: isRefreshing,
    isError: refreshFailed,
  } = useMutation({
    mutationFn: refreshPrices,
    onSuccess: async (result) => {
      setLastRefreshMessage(
        result.updated > 0
          ? `${result.message}. Portfolio data reloaded from the API.`
          : `Live provider returned no new prices for ${result.attempted} holdings. Showing latest saved API values.`
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["holdings"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio-history"] }),
      ]);
    },
  });

  const handleRefresh = async () => {
    refreshLivePrices(false);
  };

  const { data: summary, isLoading: sl } = useQuery({ queryKey: ["portfolio-summary"], queryFn: getPortfolioSummary });
  const { data: rawHoldings = [], isLoading: hl } = useQuery({ queryKey: ["holdings"], queryFn: getHoldings });
  const { data: history = [], isLoading: histLoading } = useQuery({
    queryKey: ["portfolio-history"],
    queryFn: () => getPortfolioHistory("30d"),
    enabled: !!summary,
  });

  const holdings = withWeights(rawHoldings);
  const isLoading = sl || hl || histLoading;

  const brStocks = holdings.filter((h) => h.asset_class === "BR_STOCK");
  const fiis = holdings.filter((h) => h.asset_class === "FII");
  const usStocks = holdings.filter((h) => h.asset_class === "US_STOCK");
  const crypto = holdings.filter((h) => h.asset_class === "CRYPTO");

  const brTotal = brStocks.reduce((s, h) => s + h.current_value, 0);
  const fiiTotal = fiis.reduce((s, h) => s + h.current_value, 0);
  const usTotal = usStocks.reduce((s, h) => s + h.current_value, 0);
  const cryptoTotal = crypto.reduce((s, h) => s + h.current_value, 0);

  const top5 = [...holdings].sort((a, b) => b.current_value - a.current_value).slice(0, 6);

  return (
    <div className="space-y-8" style={{ animation: "fadeIn 0.5s ease-out" }}>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#F0F2F7" }}>
            Good morning, <span style={{ color: "#C9963C" }}>Joao</span>
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#4A5568", fontFamily: "JetBrains Mono, monospace" }}>
            {today}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3 py-1.5 rounded text-sm transition-all"
          style={{
            background: isRefreshing ? "#161A23" : "#C9963C",
            color: "#F0F2F7",
            opacity: isRefreshing ? 0.6 : 1,
            fontFamily: "JetBrains Mono, monospace",
            cursor: isRefreshing ? "not-allowed" : "pointer",
          }}
        >
          {isRefreshing ? "Refreshing..." : "Refresh live prices"}
        </button>
      </div>
      {(lastRefreshMessage || refreshFailed) && (
        <div className="rounded-md border px-3 py-2 text-xs" style={{ background: "#111318", borderColor: "#1E2330", color: refreshFailed ? "#F43F5E" : "#8892A4", fontFamily: "JetBrains Mono, monospace" }}>
          {refreshFailed ? "Live market refresh failed. Showing last saved API values." : lastRefreshMessage}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Portfolio" value={isLoading ? "—" : formatBRL(summary?.total_value_brl ?? 0)} subtitle="Consolidated value" subtitleColor="#8892A4" />
        <KpiCard label="Total Return" value={isLoading ? "—" : formatBRL(summary?.total_gain_brl ?? 0)} subtitle={isLoading ? "—" : `${formatPct(summary?.total_return_pct ?? 0)} on invested`} trend={!isLoading && (summary?.total_gain_brl ?? 0) >= 0 ? "up" : "down"} />
        <KpiCard label="Total Invested" value={isLoading ? "—" : formatBRL(summary?.total_invested_brl ?? 0)} subtitle="Cost basis" subtitleColor="#8892A4" />
        <KpiCard label="USD/BRL Exchange" value={isLoading ? "—" : `R$ ${(summary?.usd_to_brl ?? 0).toFixed(2)}`} subtitle="Reference" subtitleColor="#8892A4" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3"><PerformanceChart data={history} /></div>
        <div className="col-span-2"><AllocationChart data={summary?.allocation ?? []} /></div>
      </div>

      {/* Market Segments */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "BR Stocks", color: "#C9963C", total: brTotal, count: brStocks.length, currency: "BRL" as const },
          { label: "FIIs", color: "#3B82F6", total: fiiTotal, count: fiis.length, currency: "BRL" as const },
          { label: "US Stocks", color: "#8B5CF6", total: usTotal, count: usStocks.length, currency: "USD" as const },
          { label: "Crypto", color: "#10B981", total: cryptoTotal, count: crypto.length, currency: "USD" as const },
        ].map((seg) => (
          <div key={seg.label} className="rounded-lg p-4 border" style={{ background: "#111318", borderColor: "#1E2330" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: seg.color, fontFamily: "Syne" }}>{seg.label}</span>
            </div>
            <p className="text-lg font-bold" style={{ color: "#F0F2F7", fontFamily: "JetBrains Mono" }}>
              {isLoading ? "—" : seg.currency === "BRL" ? formatBRL(seg.total) : formatUSD(seg.total)}
            </p>
            <p className="text-xs mt-1" style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>{seg.count} assets</p>
          </div>
        ))}
      </div>

      {/* Holdings Table + Gainers/Losers */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 rounded-lg border overflow-hidden" style={{ background: "#111318", borderColor: "#1E2330" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#1E2330" }}>
            <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9963C", fontFamily: "Syne" }}>Top Holdings</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1E2330" }}>
                {["Ticker", "Class", "Value", "Return"].map((h, i) => (
                  <th key={h} className={`px-5 py-2.5 text-xs uppercase tracking-widest ${i >= 2 ? "text-right" : "text-left"}`} style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-xs" style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>Loading...</td></tr>
              ) : top5.map((h, i) => (
                <tr key={h.ticker} style={{ borderBottom: i < top5.length - 1 ? "1px solid #161A23" : "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#161A23"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <td className="px-5 py-3"><span className="text-sm font-bold" style={{ color: "#C9963C", fontFamily: "JetBrains Mono" }}>{h.ticker}</span></td>
                  <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded border" style={{ color: "#8892A4", borderColor: "#1E2330", fontFamily: "JetBrains Mono" }}>{assetClassLabel(h.asset_class)}</span></td>
                  <td className="px-5 py-3 text-right"><span className="text-sm" style={{ color: "#F0F2F7", fontFamily: "JetBrains Mono" }}>{h.currency === "BRL" ? formatBRL(h.current_value) : formatUSD(h.current_value)}</span></td>
                  <td className="px-5 py-3 text-right"><span className={`text-sm font-medium ${getReturnColor(h.return_pct)}`} style={{ fontFamily: "JetBrains Mono" }}>{formatPct(h.return_pct)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-2 space-y-4">
          {[
            { title: "▲ Top Gainers", color: "#10B981", items: summary?.top_gainers ?? [] },
            { title: "▼ Top Losers", color: "#F43F5E", items: summary?.top_losers ?? [] },
          ].map((group) => (
            <div key={group.title} className="rounded-lg border overflow-hidden" style={{ background: "#111318", borderColor: "#1E2330" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "#1E2330" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: group.color, fontFamily: "Syne" }}>{group.title}</h3>
              </div>
              {isLoading ? (
                <div className="px-4 py-4 text-xs text-center" style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>Loading...</div>
              ) : group.items.map((h: typeof summary.top_gainers[0]) => (
                <div key={h.ticker} className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid #161A23" }}>
                  <span className="text-sm font-bold" style={{ color: "#C9963C", fontFamily: "JetBrains Mono" }}>{h.ticker}</span>
                  <span className={`text-sm font-medium ${getReturnColor(h.return_pct)}`} style={{ fontFamily: "JetBrains Mono" }}>{formatPct(h.return_pct)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
