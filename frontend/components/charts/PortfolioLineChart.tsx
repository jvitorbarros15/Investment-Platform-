"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint { date: string; value: number; }
interface Props { data: DataPoint[]; color?: string; currency?: "BRL" | "USD"; }
interface TooltipPayload { value?: number; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayload[]; label?: string; currency?: "BRL" | "USD"; }

function formatMoney(value: number, currency: "BRL" | "USD", compact = false) {
  if (compact) { const prefix = currency === "BRL" ? "R$" : "$"; return `${prefix}${(value / 1000).toFixed(0)}k`; }
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function CustomTooltip({ active, payload, label, currency = "BRL" }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-ink)", padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 11, boxShadow: "3px 3px 0 var(--color-ink)" }}>
      <div style={{ color: "var(--color-ink-3)", marginBottom: 4 }}>{label}</div>
      <div style={{ color: "var(--color-teal)", fontWeight: 600 }}>{formatMoney(payload[0]?.value ?? 0, currency)}</div>
    </div>
  );
}

export function PortfolioLineChart({ data, color = "#0d6b65", currency = "BRL" }: Props) {
  const RANGES = ["1M", "3M", "6M", "ALL"] as const;
  const [range, setRange] = useState<typeof RANGES[number]>("1M");
  const cutMap = { "1M": 30, "3M": 90, "6M": 180, "ALL": Infinity };
  const sliced = data.slice(-cutMap[range]);

  return (
    <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-ink)", marginBottom: 24 }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-ink)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="kicker" style={{ marginBottom: 4 }}>Portfolio performance</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}>Historical value · {range}</div>
        </div>
        <div style={{ display: "flex", border: "1px solid var(--color-ink)" }}>
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "4px 10px", fontSize: 11, fontFamily: "var(--font-mono)",
              background: r === range ? "var(--color-ink)" : "var(--color-paper)",
              color: r === range ? "var(--color-paper)" : "var(--color-ink-3)",
              border: "none", borderRight: r !== "ALL" ? "1px solid var(--color-ink)" : "none",
              cursor: "pointer",
            }}>{r}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: "24px 24px 16px" }}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={sliced} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatMoney(Number(v), currency, true)} width={56} />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#portGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
