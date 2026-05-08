"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL } from "@/lib/formatters";

interface DataPoint {
  date: string;
  value: number;
}

interface TooltipPayload {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-md px-3 py-2 text-xs border"
      style={{ background: "#161A23", borderColor: "#1E2330", fontFamily: "JetBrains Mono, monospace" }}
    >
      <p style={{ color: "#8892A4" }}>{label}</p>
      <p style={{ color: "#C9963C" }} className="font-medium">{formatBRL(payload[0].value)}</p>
    </div>
  );
};

export function PerformanceChart({ data }: { data: DataPoint[] }) {
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));

  return (
    <div
      className="rounded-lg p-5 border"
      style={{ background: "#111318", borderColor: "#1E2330" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9963C", fontFamily: "Syne, sans-serif" }}>
          Desempenho — 30 dias
        </h3>
        <span className="text-xs" style={{ color: "#4A5568", fontFamily: "JetBrains Mono, monospace" }}>
          {formatBRL(data[0]?.value || 0)} → {formatBRL(data[data.length - 1]?.value || 0)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C9963C" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#C9963C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1E2330" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#4A5568", fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
            interval={6}
          />
          <YAxis
            domain={[min * 0.98, max * 1.01]}
            tick={{ fill: "#4A5568", fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#C9963C"
            strokeWidth={1.5}
            fill="url(#goldGrad)"
            dot={false}
            activeDot={{ r: 3, fill: "#C9963C", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
