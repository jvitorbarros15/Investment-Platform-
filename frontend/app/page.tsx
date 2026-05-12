"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPortfolioSummary, getHoldings, getPortfolioHistory } from "@/lib/api";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Reveal } from "@/components/ui/reveal";
import { TickPulse } from "@/components/ui/tick-pulse";
import { Sparkline } from "@/components/ui/sparkline";
import { PortfolioLineChart } from "@/components/charts/PortfolioLineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarList } from "@/components/charts/BarList";
import { useCurrencyStore } from "@/lib/currency-store";
import { convertCurrency, formatCurrency } from "@/lib/formatters";
import type { Holding } from "@/lib/types";

interface AllocationSummary {
  name?: string;
  value?: number;
  value_brl?: number;
  pct?: number;
  color?: string;
}

function genSparkData(seed: number, n = 30): number[] {
  const r = (i: number) => Math.sin(seed * 0.1 + i * 0.7) * 0.03 + (Math.sin(i * 0.3 + seed) * 0.01);
  let v = 100;
  return Array.from({ length: n }, (_, i) => { v = v * (1 + r(i)); return v; });
}

export default function Dashboard() {
  const [tick, setTick] = useState(0);
  const displayCurrency = useCurrencyStore((s) => s.currency);
  const storeRate = useCurrencyStore((s) => s.exchangeRate);
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 3500);
    return () => clearInterval(i);
  }, []);

  const { data: summary, isLoading: sl } = useQuery({ queryKey: ["portfolio-summary"], queryFn: getPortfolioSummary });
  const { data: holdings = [], isLoading: hl } = useQuery({ queryKey: ["holdings"], queryFn: getHoldings });
  const { data: history = [] } = useQuery({ queryKey: ["portfolio-history"], queryFn: () => getPortfolioHistory("30d"), enabled: !!summary });

  const isLoading = sl || hl;
  const totalBrl = summary?.total_value_brl ?? 0;
  const gainBrl = summary?.total_gain_brl ?? 0;
  const investedBrl = summary?.total_invested_brl ?? 0;
  const usdBrl = storeRate > 1 ? storeRate : (summary?.usd_to_brl ?? 5.70);
  const totalDisplay = convertCurrency(totalBrl, "BRL", displayCurrency, usdBrl);
  const gainDisplay = convertCurrency(gainBrl, "BRL", displayCurrency, usdBrl);

  const sortedByReturn = [...holdings].sort((a, b) => b.return_pct - a.return_pct);
  const winners = sortedByReturn.slice(0, 3);
  const losers = [...sortedByReturn].reverse().filter((h) => h.return_pct < 0).slice(0, 3);

  const allocation = summary?.allocation ?? [];
  const donutData = allocation.map((a: AllocationSummary) => ({
    label: a.name ?? "Other",
    value: convertCurrency(a.value ?? a.value_brl ?? 0, "BRL", displayCurrency, usdBrl),
    pct: a.pct ?? 0,
    color: a.color ?? "#9ec5fe",
  }));

  const sectorMap: Record<string, number> = {};
  for (const h of holdings) {
    const s: string = h.sector ?? "Other";
    sectorMap[s] = (sectorMap[s] ?? 0) + h.current_value;
  }
  const totalVal = Object.values(sectorMap).reduce((s: number, v: number) => s + v, 0) || 1;
  const sectorBars = Object.entries(sectorMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([label, value], i) => ({
      label,
      value: (value / totalVal) * 100,
      color: ["#c9f76f", "#7dd3a8", "#f0c674", "#e89b7c", "#9ec5fe", "#cfa6f0"][i],
    }));

  const usdHoldings = holdings.filter((h: Holding) => h.currency === "USD");
  const brlHoldings = holdings.filter((h: Holding) => h.currency === "BRL");
  const usdVal = usdHoldings.reduce((s: number, h: Holding) => s + h.current_value * usdBrl, 0);
  const brlVal = brlHoldings.reduce((s: number, h: Holding) => s + h.current_value, 0);
  const totalCurrency = usdVal + brlVal || 1;
  const usdPct = (usdVal / totalCurrency) * 100;
  const brlPct = (brlVal / totalCurrency) * 100;
  const displayHistory = history.map((point) => ({
    ...point,
    value: convertCurrency(point.value, "BRL", displayCurrency, usdBrl),
  }));
  const compactMoney = (value: number) => {
    const converted = convertCurrency(value, "BRL", displayCurrency, usdBrl);
    return formatCurrency(converted, displayCurrency);
  };

  const PANEL: React.CSSProperties = {
    background: "#14130f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* HERO */}
      <Reveal>
        <section style={{
          ...PANEL,
          background: "linear-gradient(135deg, #14130f 0%, #1a1814 100%)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div className="kicker" style={{ marginBottom: 8 }}>
                Total portfolio · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 7vw, 72px)", lineHeight: 1, color: "#f5f1e8", margin: 0 }}>
                <span style={{ fontSize: "0.5em" }}>{displayCurrency === "BRL" ? "R$" : "$"}</span>
                {isLoading ? "—" : <AnimatedNumber value={totalDisplay} fmt={(v) => v.toLocaleString(displayCurrency === "BRL" ? "pt-BR" : "en-US", { maximumFractionDigits: 0 })} />}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <span style={{ color: gainBrl >= 0 ? "#7dd3a8" : "#e07b6c", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  {gainDisplay >= 0 ? "▲" : "▼"} {formatCurrency(Math.abs(gainDisplay), displayCurrency)}
                </span>
                <span style={{ color: "rgba(245,241,232,0.3)" }}>·</span>
                <span style={{ color: "rgba(245,241,232,0.5)", fontSize: 13 }}>all-time return</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(120px, 1fr))", gap: 20, minWidth: 260 }}>
              {[
                { label: "Invested capital", value: compactMoney(investedBrl) },
                { label: "Unrealized gain", value: `${gainDisplay >= 0 ? "+" : "-"}${compactMoney(Math.abs(gainBrl))}`, color: gainDisplay >= 0 ? "#7dd3a8" : "#e07b6c" },
                { label: "USD/BRL rate", value: `${usdBrl.toFixed(2)}` },
                { label: "Holdings", value: String(holdings.length) },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="kicker" style={{ marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: stat.color ?? "#f5f1e8" }}>{isLoading ? "—" : stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* PERFORMANCE CHART */}
      <Reveal delay={100}>
        <PortfolioLineChart data={displayHistory} currency={displayCurrency} />
      </Reveal>

      {/* ALLOCATION ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 16 }}>
        <Reveal delay={150}>
          <section style={PANEL}>
            <div className="kicker" style={{ marginBottom: 4 }}>Allocation</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 16px" }}>By asset class</h3>
            {!isLoading && <DonutChart data={donutData} centerValue={`${displayCurrency === "BRL" ? "R$" : "$"}${(totalDisplay / 1000).toFixed(0)}k`} />}
          </section>
        </Reveal>

        <Reveal delay={210}>
          <section style={PANEL}>
            <div className="kicker" style={{ marginBottom: 4 }}>Allocation</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 16px" }}>By sector</h3>
            <BarList data={sectorBars} />
          </section>
        </Reveal>

        <Reveal delay={270}>
          <section style={PANEL}>
            <div className="kicker" style={{ marginBottom: 4 }}>Currency exposure</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 16px" }}>USD vs BRL</h3>
            <div style={{ height: 14, borderRadius: 8, display: "flex", overflow: "hidden", background: "rgba(255,255,255,0.05)", marginBottom: 16 }}>
              <div style={{ width: `${usdPct}%`, background: "#7dd3a8", transition: "width 0.8s" }} />
              <div style={{ width: `${brlPct}%`, background: "#f0c674", transition: "width 0.8s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {[{ label: "USD ASSETS", pct: usdPct, val: usdVal }, { label: "BRL ASSETS", pct: brlPct, val: brlVal }].map(c => (
                <div key={c.label}>
                  <div className="kicker">{c.label}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 4 }}>{c.pct.toFixed(1)}%</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(245,241,232,0.4)" }}>{compactMoney(c.val)}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "rgba(245,241,232,0.4)" }}>FX rate · USD/BRL</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "#f5f1e8" }}>{usdBrl.toFixed(2)}</span>
            </div>
          </section>
        </Reveal>
      </div>

      {/* MOVERS + WATCHLIST */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 16 }}>
        <Reveal delay={320}>
          <section style={PANEL}>
            <div className="kicker" style={{ marginBottom: 4 }}>Today&apos;s movers</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 16px" }}>Best & worst performers</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 16 }}>
              {[{ label: "▲ WINNERS", color: "#7dd3a8", items: winners }, { label: "▼ LOSERS", color: "#e07b6c", items: losers }].map(group => (
                <div key={group.label}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", color: group.color, marginBottom: 12 }}>{group.label}</div>
                  {group.items.map((h: Holding) => {
                    const sparkData = genSparkData(h.ticker.charCodeAt(0));
                    const isUp = h.return_pct >= 0;
                    return (
                      <div key={h.ticker} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "#c9f76f" }}>{h.ticker}</div>
                          <div style={{ fontSize: 11, color: "rgba(245,241,232,0.4)" }}>{h.name ?? ""}</div>
                        </div>
                        <Sparkline data={sparkData} width={60} height={22} color={isUp ? "#7dd3a8" : "#e07b6c"} />
                        <div style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <TickPulse trigger={tick} color={isUp ? "#7dd3a8" : "#e07b6c"} />
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                              {formatCurrency(convertCurrency(h.quantity ? (h.current_value / h.quantity) : 0, h.currency, displayCurrency, usdBrl), displayCurrency)}
                            </span>
                          </div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: isUp ? "#7dd3a8" : "#e07b6c" }}>
                            {h.return_pct >= 0 ? "+" : ""}{h.return_pct.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal delay={400}>
          <section style={PANEL}>
            <div className="kicker" style={{ marginBottom: 4 }}>Opportunity engine</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 16px" }}>Top holdings</h3>
            {[...holdings].sort((a, b) => b.current_value - a.current_value).slice(0, 5).map(h => (
              <div key={h.ticker} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "#c9f76f" }}>{h.ticker}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: h.return_pct >= 0 ? "#7dd3a8" : "#e07b6c" }}>
                  {h.return_pct >= 0 ? "+" : ""}{h.return_pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </section>
        </Reveal>
      </div>
    </div>
  );
}
