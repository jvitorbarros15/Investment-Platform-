"use client";

import { Radar, RadarChart as ReRadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface Axis { label: string; value: number; }

export function RadarChart({ data, color = "#c9f76f", size = 240 }: { data: Axis[]; color?: string; size?: number }) {
  return (
    <ResponsiveContainer width={size} height={size}>
      <ReRadarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(245,241,232,0.48)", fontFamily: "var(--font-mono)" }} />
        <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={1.5} dot={{ fill: color, r: 3 }} />
      </ReRadarChart>
    </ResponsiveContainer>
  );
}
