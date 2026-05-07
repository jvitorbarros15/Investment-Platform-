"use client";

import { AllocationChart } from "@/components/dashboard/AllocationChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { formatBRL, formatUSD, formatPct, getReturnColor, assetClassLabel } from "@/lib/formatters";
import { MOCK_SUMMARY, MOCK_HOLDINGS, generatePortfolioHistory } from "@/lib/mock-data";

const history = generatePortfolioHistory(MOCK_SUMMARY.total_value_brl);

export default function Dashboard() {
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const brStocks = MOCK_HOLDINGS.filter((h) => h.asset_class === "BR_STOCK");
  const fiis = MOCK_HOLDINGS.filter((h) => h.asset_class === "FII");
  const usStocks = MOCK_HOLDINGS.filter((h) => h.asset_class === "US_STOCK");
  const crypto = MOCK_HOLDINGS.filter((h) => h.asset_class === "CRYPTO");

  const brTotal = brStocks.reduce((s, h) => s + h.current_value, 0);
  const fiiTotal = fiis.reduce((s, h) => s + h.current_value, 0);
  const usTotal = usStocks.reduce((s, h) => s + h.current_value, 0);
  const cryptoTotal = crypto.reduce((s, h) => s + h.current_value, 0);

  const top5 = [...MOCK_HOLDINGS].sort((a, b) => b.current_value - a.current_value).slice(0, 6);

  return (
    <div className="space-y-8" style={{ animation: "fadeIn 0.5s ease-out" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#F0F2F7" }}>
          Bom dia, <span style={{ color: "#C9963C" }}>Joao</span>
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#4A5568", fontFamily: "JetBrains Mono, monospace" }}>
          {today}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Patrimônio Total" value={formatBRL(MOCK_SUMMARY.total_value_brl)} subtitle="Valor consolidado" subtitleColor="#8892A4" />
        <KpiCard label="Retorno Total" value={formatBRL(MOCK_SUMMARY.total_gain_brl)} subtitle={`${formatPct(MOCK_SUMMARY.total_return_pct)} sobre investido`} trend="up" />
        <KpiCard label="Total Investido" value={formatBRL(MOCK_SUMMARY.total_invested_brl)} subtitle="Custo base" subtitleColor="#8892A4" />
        <KpiCard label="Câmbio USD/BRL" value={`R$ ${MOCK_SUMMARY.usd_to_brl.toFixed(2)}`} subtitle="Referência" subtitleColor="#8892A4" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3"><PerformanceChart data={history} /></div>
        <div className="col-span-2"><AllocationChart data={MOCK_SUMMARY.allocation} /></div>
      </div>

      {/* Market Segments */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Ações BR", color: "#C9963C", total: brTotal, count: brStocks.length, currency: "BRL" as const },
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
              {seg.currency === "BRL" ? formatBRL(seg.total) : formatUSD(seg.total)}
            </p>
            <p className="text-xs mt-1" style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>{seg.count} ativos</p>
          </div>
        ))}
      </div>

      {/* Holdings Table + Gainers/Losers */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 rounded-lg border overflow-hidden" style={{ background: "#111318", borderColor: "#1E2330" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#1E2330" }}>
            <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9963C", fontFamily: "Syne" }}>Maiores Posições</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1E2330" }}>
                {["Ticker", "Classe", "Valor", "Retorno"].map((h, i) => (
                  <th key={h} className={`px-5 py-2.5 text-xs uppercase tracking-widest ${i >= 2 ? "text-right" : "text-left"}`} style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top5.map((h, i) => (
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
            { title: "▲ Melhores", color: "#10B981", items: MOCK_SUMMARY.top_gainers },
            { title: "▼ Piores", color: "#F43F5E", items: MOCK_SUMMARY.top_losers },
          ].map((group) => (
            <div key={group.title} className="rounded-lg border overflow-hidden" style={{ background: "#111318", borderColor: "#1E2330" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "#1E2330" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: group.color, fontFamily: "Syne" }}>{group.title}</h3>
              </div>
              {group.items.map((h) => (
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
