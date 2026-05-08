"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AllocationItem } from "@/lib/types";
import { formatBRL } from "@/lib/formatters";

interface Props {
  data: AllocationItem[];
}

interface TooltipPayload {
  payload: AllocationItem;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as AllocationItem;
  return (
    <div
      className="rounded-md px-3 py-2 text-xs border"
      style={{ background: "#161A23", borderColor: "#1E2330", fontFamily: "JetBrains Mono, monospace" }}
    >
      <p style={{ color: item.color }} className="font-medium">{item.name}</p>
      <p style={{ color: "#F0F2F7" }}>{formatBRL(item.value)}</p>
      <p style={{ color: "#8892A4" }}>{item.pct.toFixed(1)}%</p>
    </div>
  );
};

export function AllocationChart({ data }: Props) {
  return (
    <div
      className="rounded-lg p-5 border"
      style={{ background: "#111318", borderColor: "#1E2330" }}
    >
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-widest" style={{ color: "#C9963C", fontFamily: "Syne, sans-serif" }}>
        Allocation
      </h3>
      <div className="flex items-center gap-6">
        <div style={{ width: 140, height: 140, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={64}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-xs truncate" style={{ color: "#8892A4" }}>{item.name}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs" style={{ color: "#F0F2F7", fontFamily: "JetBrains Mono, monospace" }}>
                  {item.pct.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
