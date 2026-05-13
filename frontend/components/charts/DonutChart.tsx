"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Slice { label: string; value: number; pct: number; color: string; }
interface Props { data: Slice[]; size?: number; centerLabel?: string; centerValue?: string; }

export function DonutChart({ data, size = 184, centerLabel = "Total", centerValue = "" }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <ResponsiveContainer width={size} height={size}>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={size * 0.35} outerRadius={size * 0.48} paddingAngle={2} startAngle={90} endAngle={-270}>
              {data.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div className="kicker">{centerLabel}</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--color-ink)", marginTop: 2 }}>{centerValue}</div>
        </div>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {data.map((s, i) => (
          <li key={`${s.label}-${i}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--color-ink-2)", flex: 1 }}>{s.label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-3)" }}>{s.pct.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
