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
  const summaryRate = summary?.usd_to_brl ?? 5.70;
  const liveRate = storeRate > 1 ? storeRate : summaryRate;
  const totalDisplay = convertCurrency(totalBrl, "BRL", displayCurrency, summaryRate);
  const gainDisplay = convertCurrency(gainBrl, "BRL", displayCurrency, summaryRate);

  const sortedByReturn = [...holdings].sort((a, b) => b.return_pct - a.return_pct);
  const winners = sortedByReturn.slice(0, 3);
  const losers = [...sortedByReturn].reverse().filter((h) => h.return_pct < 0).slice(0, 3);

  const allocation = summary?.allocation ?? [];
  const donutData = allocation.map((a: AllocationSummary) => ({
    label: a.name ?? "Other",
    value: convertCurrency(a.value ?? a.value_brl ?? 0, "BRL", displayCurrency, summaryRate),
    pct: a.pct ?? 0,
    color: a.color ?? "#0d6b65",
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
      color: ["#cc5230", "#0d6b65", "#c69a2c", "#2a3645", "#5b6573", "#8e96a3"][i],
    }));

  const usdHoldings = holdings.filter((h: Holding) => h.currency === "USD");
  const brlHoldings = holdings.filter((h: Holding) => h.currency === "BRL");
  const usdVal = usdHoldings.reduce((s: number, h: Holding) => s + h.current_value * summaryRate, 0);
  const brlVal = brlHoldings.reduce((s: number, h: Holding) => s + h.current_value, 0);
  const totalCurrency = usdVal + brlVal || 1;
  const usdPct = (usdVal / totalCurrency) * 100;
  const brlPct = (brlVal / totalCurrency) * 100;
  const displayHistory = history.map((point) => ({
    ...point,
    value: convertCurrency(point.value, "BRL", displayCurrency, summaryRate),
  }));
  const formatMoney = (value: number) => {
    const converted = convertCurrency(value, "BRL", displayCurrency, summaryRate);
    return formatCurrency(converted, displayCurrency);
  };

  const PANEL: React.CSSProperties = {
    background: "var(--color-paper)",
    border: "1px solid var(--color-ink)",
    padding: "22px 24px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* LEDE: hero grid */}
      <Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 40, paddingBottom: 28, borderBottom: "1px solid var(--color-ink)", marginBottom: 28 }}>
          {/* Left */}
          <div>
            <div className="kicker" style={{ marginBottom: 14 }}>
              Total portfolio · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(32px, 5vw, 96px)", lineHeight: 0.9, letterSpacing: "-0.03em", color: "var(--color-ink)", margin: "0 0 18px" }}>
              <span style={{ fontSize: "0.45em", opacity: 0.5 }}>{displayCurrency === "BRL" ? "R$" : "$"}</span>
              {isLoading ? "—" : <AnimatedNumber value={totalDisplay} fmt={(v) => v.toLocaleString(displayCurrency === "BRL" ? "pt-BR" : "en-US", { maximumFractionDigits: 0 })} />}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 13 }}>
              <span style={{ padding: "5px 10px", background: gainBrl >= 0 ? "var(--color-teal)" : "var(--color-crimson)", color: "var(--color-paper)", fontWeight: 500 }}>
                {gainDisplay >= 0 ? "▲" : "▼"} {formatCurrency(Math.abs(gainDisplay), displayCurrency)}
              </span>
              <span style={{ color: "var(--color-ink-4)" }}>·</span>
              <span style={{ color: "var(--color-ink-3)" }}>all-time return</span>
            </div>
          </div>
          {/* Right: stats */}
          <div style={{ borderLeft: "1px solid var(--color-ink)", paddingLeft: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 32px", alignContent: "start" }}>
            {[
              { label: "Invested capital", value: isLoading ? "—" : formatCurrency(convertCurrency(investedBrl, "BRL", displayCurrency, summaryRate), displayCurrency) },
              { label: "Unrealized gain",  value: isLoading ? "—" : `${gainDisplay >= 0 ? "+" : ""}${formatCurrency(Math.abs(gainDisplay), displayCurrency)}`, color: gainDisplay >= 0 ? "var(--color-teal)" : "var(--color-crimson)" },
              { label: "USD/BRL rate",     value: isLoading ? "—" : liveRate.toFixed(2) },
              { label: "Holdings",         value: String(holdings.length) },
            ].map(stat => (
              <div key={stat.label}>
                <div className="kicker" style={{ marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", color: stat.color ?? "var(--color-ink)" }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* PERFORMANCE BAND */}
      <Reveal delay={100}>
        <PortfolioLineChart data={displayHistory} currency={displayCurrency} />
      </Reveal>

      {/* ALLOCATION ROW: 3-col */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: "1px solid var(--color-ink)", marginBottom: 24 }}>
        <Reveal delay={150}>
          <div style={{ ...PANEL, borderRight: "1px solid var(--color-ink)" }}>
            <div className="kicker" style={{ marginBottom: 4 }}>Allocation</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, margin: "0 0 18px", paddingBottom: 12, borderBottom: "1px solid var(--color-rule-2)" }}>By asset class</h3>
            {!isLoading && <DonutChart data={donutData} centerValue={formatCurrency(totalDisplay, displayCurrency)} />}
          </div>
        </Reveal>
        <Reveal delay={210}>
          <div style={{ ...PANEL, borderRight: "1px solid var(--color-ink)" }}>
            <div className="kicker" style={{ marginBottom: 4 }}>Allocation</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, margin: "0 0 18px", paddingBottom: 12, borderBottom: "1px solid var(--color-rule-2)" }}>By sector</h3>
            <BarList data={sectorBars} />
          </div>
        </Reveal>
        <Reveal delay={270}>
          <div style={PANEL}>
            <div className="kicker" style={{ marginBottom: 4 }}>Currency exposure</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, margin: "0 0 18px", paddingBottom: 12, borderBottom: "1px solid var(--color-rule-2)" }}>USD vs BRL</h3>
            <div style={{ height: 14, border: "1px solid var(--color-ink)", display: "flex", overflow: "hidden", background: "var(--color-paper-3)", marginBottom: 16 }}>
              <div style={{ width: `${usdPct}%`, background: "var(--color-teal)", transition: "width 0.8s" }} />
              <div style={{ width: `${brlPct}%`, background: "var(--color-ochre)", transition: "width 0.8s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {[{ label: "USD", pct: usdPct, val: usdVal }, { label: "BRL", pct: brlPct, val: brlVal }].map(c => (
                <div key={c.label}>
                  <div className="kicker">{c.label} assets</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, marginTop: 4 }}>{c.pct.toFixed(1)}%</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-3)", marginTop: 2 }}>{formatMoney(c.val)}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--color-rule-2)", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--color-ink-3)" }}>FX rate · USD/BRL</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-ink)" }}>{liveRate.toFixed(2)}</span>
            </div>
          </div>
        </Reveal>
      </div>

      {/* MOVERS + TOP HOLDINGS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0, border: "1px solid var(--color-ink)" }}>
        <Reveal delay={320}>
          <div style={{ ...PANEL, borderRight: "1px solid var(--color-ink)" }}>
            <div className="kicker" style={{ marginBottom: 4 }}>Portfolio movers</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, margin: "0 0 18px", paddingBottom: 12, borderBottom: "1px solid var(--color-rule-2)" }}>Best &amp; worst performers</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0 }}>
              {[{ label: "▲ WINNERS", color: "var(--color-teal)", items: winners }, { label: "▼ LOSERS", color: "var(--color-crimson)", items: losers }].map(group => (
                <div key={group.label} style={{ borderRight: group.label.includes("WIN") ? "1px solid var(--color-rule-2)" : "none", paddingRight: group.label.includes("WIN") ? 16 : 0, paddingLeft: group.label.includes("LOS") ? 16 : 0 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", color: group.color, marginBottom: 12 }}>{group.label}</div>
                  {group.items.map((h: Holding) => {
                    const sparkData = genSparkData(h.ticker.charCodeAt(0));
                    const isUp = h.return_pct >= 0;
                    return (
                      <div key={h.ticker} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px dashed var(--color-rule-2)" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>{h.ticker}</div>
                          <div style={{ fontSize: 11, color: "var(--color-ink-3)" }}>{h.name ?? ""}</div>
                        </div>
                        <Sparkline data={sparkData} width={56} height={20} color={isUp ? "#0d6b65" : "#99291b"} />
                        <div style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <TickPulse trigger={tick} color={isUp ? "#0d6b65" : "#99291b"} />
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink)" }}>
                              {formatCurrency(convertCurrency(h.quantity ? (h.current_value / h.quantity) : 0, h.currency, displayCurrency, summaryRate), displayCurrency)}
                            </span>
                          </div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: isUp ? "var(--color-teal)" : "var(--color-crimson)" }}>
                            {h.return_pct >= 0 ? "+" : ""}{h.return_pct.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={400}>
          <div style={PANEL}>
            <div className="kicker" style={{ marginBottom: 4 }}>Positions</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, margin: "0 0 18px", paddingBottom: 12, borderBottom: "1px solid var(--color-rule-2)" }}>Top holdings by value</h3>
            {[...holdings].sort((a, b) => b.current_value - a.current_value).slice(0, 6).map((h, i) => (
              <div key={h.ticker} style={{ display: "grid", gridTemplateColumns: "24px 1fr auto auto", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--color-rule-2)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-4)" }}>{i + 1}</span>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>{h.ticker}</div>
                  <div style={{ fontSize: 11, color: "var(--color-ink-3)" }}>{h.name ?? ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-ink)" }}>
                    {formatCurrency(convertCurrency(h.current_value, h.currency, displayCurrency, summaryRate), displayCurrency)}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-3)" }}>
                    {((convertCurrency(h.current_value, h.currency, displayCurrency, summaryRate) / totalDisplay) * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: h.return_pct >= 0 ? "var(--color-teal)" : "var(--color-crimson)" }}>
                  {h.return_pct >= 0 ? "+" : ""}{h.return_pct.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
