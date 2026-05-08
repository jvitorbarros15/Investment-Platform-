"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface DataPoint { date: string; value: number; }

interface Props {
  data: DataPoint[];
  color?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#14130f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
      padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 11,
    }}>
      <div style={{ color: "rgba(245,241,232,0.5)", marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#c9f76f", fontWeight: 600 }}>
        R$ {payload[0]?.value?.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}

export function PortfolioLineChart({ data, color = "#c9f76f" }: Props) {
  const RANGES = ["1M", "3M", "6M", "ALL"] as const;
  const [range, setRange] = useState<typeof RANGES[number]>("1M");

  const cutMap = { "1M": 30, "3M": 90, "6M": 180, "ALL": Infinity };
  const cut = cutMap[range];
  const sliced = data.slice(-cut);

  return (
    <div style={{ background: "#14130f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div className="kicker" style={{ marginBottom: 4 }}>Portfolio performance · {range}</div>
        </div>
        <div style={{ display: "flex", background: "#1a1814", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "4px 10px", fontSize: 11, fontFamily: "var(--font-mono)",
              background: r === range ? "rgba(201,247,111,0.15)" : "none",
              color: r === range ? "#c9f76f" : "rgba(245,241,232,0.4)",
              border: "none", cursor: "pointer",
            }}>{r}</button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={sliced} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} width={56} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#portGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
