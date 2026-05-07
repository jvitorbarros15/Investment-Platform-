"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatBRL, formatUSD, formatPct, getReturnColor, assetClassLabel, assetClassColor } from "@/lib/formatters";
import { getHoldings } from "@/lib/api";
import type { AssetClass, Holding } from "@/lib/types";

const TABS: { label: string; value: AssetClass | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "BR Stocks", value: "BR_STOCK" },
  { label: "FIIs", value: "FII" },
  { label: "US Stocks", value: "US_STOCK" },
  { label: "Crypto", value: "CRYPTO" },
];

function withWeights(holdings: Holding[]): (Holding & { weight_in_class: number })[] {
  const totals: Record<string, number> = {};
  for (const h of holdings) totals[h.asset_class] = (totals[h.asset_class] || 0) + h.current_value;
  return holdings.map((h) => ({ ...h, weight_in_class: totals[h.asset_class] > 0 ? (h.current_value / totals[h.asset_class]) * 100 : 0 }));
}

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<AssetClass | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const { data: rawHoldings = [], isLoading } = useQuery({ queryKey: ["holdings"], queryFn: getHoldings });
  const holdings = withWeights(rawHoldings);

  const filtered = holdings.filter((h) => {
    const matchClass = activeTab === "ALL" || h.asset_class === activeTab;
    const matchSearch = h.ticker.toLowerCase().includes(search.toLowerCase()) || h.name.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  const totalValue = filtered.reduce((s, h) => {
    const rate = h.currency === "USD" ? 5.70 : 1;
    return s + h.current_value * rate;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#F0F2F7" }}>Portfolio</h1>
        <p className="text-sm mt-0.5" style={{ color: "#4A5568", fontFamily: "JetBrains Mono, monospace" }}>
          {isLoading ? "Loading..." : `${holdings.length} assets · ${formatBRL(totalValue)} consolidated`}
        </p>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#111318", border: "1px solid #1E2330" }}>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="px-4 py-1.5 rounded-md text-sm transition-all duration-150"
              style={{
                background: activeTab === tab.value ? "#1E2330" : "transparent",
                color: activeTab === tab.value ? "#C9963C" : "#8892A4",
                fontFamily: "DM Sans, sans-serif",
                fontWeight: activeTab === tab.value ? "500" : "400",
                border: activeTab === tab.value ? "1px solid rgba(201,150,60,0.2)" : "1px solid transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ticker or name..."
          className="px-4 py-2 rounded-md text-sm outline-none w-64"
          style={{ background: "#111318", border: "1px solid #1E2330", color: "#F0F2F7", fontFamily: "JetBrains Mono, monospace" }}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden" style={{ background: "#111318", borderColor: "#1E2330" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #1E2330", background: "#0D0F14" }}>
              {["Ticker", "Name", "Class", "Current Value", "Total Gain", "Return", "Weight (%)"].map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3 text-xs uppercase tracking-widest ${i >= 3 ? "text-right" : "text-left"}`}
                  style={{ color: "#4A5568", fontFamily: "JetBrains Mono, monospace" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-xs" style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>Loading...</td></tr>
            ) : filtered.map((h, i) => (
              <tr
                key={h.ticker}
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid #161A23" : "none", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#161A23"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <td className="px-5 py-3.5">
                  <span className="text-sm font-bold" style={{ color: "#C9963C", fontFamily: "JetBrains Mono, monospace" }}>{h.ticker}</span>
                </td>
                <td className="px-5 py-3.5 max-w-[180px]">
                  <span className="text-sm truncate block" style={{ color: "#8892A4" }}>{h.name}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border"
                    style={{
                      color: assetClassColor(h.asset_class),
                      borderColor: assetClassColor(h.asset_class) + "40",
                      background: assetClassColor(h.asset_class) + "15",
                      fontFamily: "JetBrains Mono",
                    }}
                  >
                    {assetClassLabel(h.asset_class)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-sm" style={{ color: "#F0F2F7", fontFamily: "JetBrains Mono, monospace" }}>
                    {h.currency === "BRL" ? formatBRL(h.current_value) : formatUSD(h.current_value)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`text-sm ${getReturnColor(h.total_gain)}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {h.currency === "BRL" ? formatBRL(h.total_gain) : formatUSD(h.total_gain)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`text-sm font-medium ${getReturnColor(h.return_pct)}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {formatPct(h.return_pct)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#1E2330" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(h.weight_in_class, 100)}%`, background: assetClassColor(h.asset_class) }}
                      />
                    </div>
                    <span className="text-xs w-10 text-right" style={{ color: "#8892A4", fontFamily: "JetBrains Mono" }}>
                      {h.weight_in_class.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
