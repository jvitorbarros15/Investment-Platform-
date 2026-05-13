"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HistoryPoint {
  date: string;
  close: number;
  volume?: number;
  ma50?: number;
  ma200?: number;
}

interface StockChartProps {
  history: HistoryPoint[];
  period: string;
}

export function StockChart({ history, period }: StockChartProps) {
  const [showVolume, setShowVolume] = useState(false);
  const [showMA50, setShowMA50] = useState(false);
  const [showMA200, setShowMA200] = useState(false);

  const canShowMA200 = period === "365d";

  // Calculate moving averages
  const chartData = useMemo(() => {
    const data = history.map((h) => ({ ...h }));

    // MA50
    if (showMA50) {
      for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - 49);
        const subset = data.slice(start, i + 1);
        const avg = subset.reduce((sum, d) => sum + d.close, 0) / subset.length;
        data[i] = { ...data[i], ma50: avg };
      }
    }

    // MA200
    if (showMA200) {
      for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - 199);
        const subset = data.slice(start, i + 1);
        const avg = subset.reduce((sum, d) => sum + d.close, 0) / subset.length;
        data[i] = { ...data[i], ma200: avg };
      }
    }

    return data;
  }, [history, showMA50, showMA200]);

  // Compute Y-axis domain from price data
  const prices = chartData.map((d) => d.close);
  const yMin = Math.min(...prices) * 0.98;
  const yMax = Math.max(...prices) * 1.02;

  return (
    <div className="bg-neutral-950 rounded-lg p-6 border border-neutral-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Price History</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`text-xs px-3 py-1 rounded transition ${
              showVolume
                ? "bg-blue-600 text-white"
                : "bg-neutral-800 hover:bg-neutral-700"
            }`}
          >
            VOL
          </button>
          <button
            onClick={() => setShowMA50(!showMA50)}
            className={`text-xs px-3 py-1 rounded transition ${
              showMA50
                ? "bg-blue-600 text-white"
                : "bg-neutral-800 hover:bg-neutral-700"
            }`}
          >
            MA50
          </button>
          <button
            onClick={() => setShowMA200(!showMA200)}
            disabled={!canShowMA200}
            className={`text-xs px-3 py-1 rounded transition ${
              showMA200
                ? "bg-blue-600 text-white"
                : canShowMA200
                  ? "bg-neutral-800 hover:bg-neutral-700"
                  : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
            }`}
          >
            MA200
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#888" }}
            interval={Math.floor(chartData.length / 6)}
          />
          <YAxis
            yAxisId="price"
            domain={[yMin, yMax]}
            tick={{ fontSize: 12, fill: "#888" }}
          />
          {showVolume && (
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={{ fontSize: 12, fill: "#666" }}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "8px",
            }}
            formatter={(value) => [typeof value === "number" ? value.toFixed(2) : value, ""]}
          />

          {showVolume && (
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="rgba(96, 165, 250, 0.3)"
              isAnimationActive={false}
            />
          )}

          <Line
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="#22c55e"
            dot={false}
            isAnimationActive={false}
            strokeWidth={2}
          />

          {showMA50 && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="ma50"
              stroke="#f59e0b"
              dot={false}
              isAnimationActive={false}
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          )}

          {showMA200 && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="ma200"
              stroke="#3b82f6"
              dot={false}
              isAnimationActive={false}
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
