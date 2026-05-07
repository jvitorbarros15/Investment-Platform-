"use client";

import { useState } from "react";
import { Save } from "lucide-react";

interface Weights {
  quality: number;
  value: number;
  growth: number;
  dividend: number;
  financial_health: number;
  momentum: number;
  risk: number;
  portfolio_fit: number;
}

const DEFAULTS: Weights = {
  quality: 25,
  value: 20,
  growth: 10,
  dividend: 20,
  financial_health: 15,
  momentum: 3,
  risk: 4,
  portfolio_fit: 3,
};

const LABELS: Record<keyof Weights, { label: string; desc: string }> = {
  quality: { label: "Quality", desc: "ROE, margins, earnings consistency" },
  value: { label: "Value", desc: "P/E, P/B, price vs historical range" },
  growth: { label: "Growth", desc: "Revenue growth, earnings growth" },
  dividend: { label: "Dividend Strength", desc: "Yield, growth, payout ratio" },
  financial_health: { label: "Financial Health", desc: "Debt/equity, current ratio, cash" },
  momentum: { label: "Momentum", desc: "Price vs moving average, 6m/12m return" },
  risk: { label: "Risk", desc: "Volatility, beta, max drawdown" },
  portfolio_fit: { label: "Portfolio Fit", desc: "Diversification, sector balance" },
};

export default function PhilosophyPage() {
  const [weights, setWeights] = useState<Weights>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = Math.abs(total - 100) < 0.5;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#F0F2F7" }}>
          Filosofia de Investimento
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#4A5568" }}>
          Defina o peso de cada critério para personalizar o scoring dos ativos.
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-6" style={{ background: "#111318", borderColor: "#1E2330" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9963C", fontFamily: "Syne" }}>
            Pesos por Categoria
          </h3>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md"
            style={{
              background: isValid ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
              border: `1px solid ${isValid ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`,
            }}
          >
            <span className="text-xs font-medium" style={{ fontFamily: "JetBrains Mono, monospace", color: isValid ? "#10B981" : "#F43F5E" }}>
              Total: {total.toFixed(0)}/100
            </span>
          </div>
        </div>

        <div className="space-y-5">
          {(Object.keys(weights) as (keyof Weights)[]).map((key) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-sm font-medium" style={{ color: "#F0F2F7", fontFamily: "DM Sans" }}>{LABELS[key].label}</span>
                  <span className="text-xs ml-2" style={{ color: "#4A5568" }}>{LABELS[key].desc}</span>
                </div>
                <span className="text-sm font-bold w-10 text-right" style={{ color: "#C9963C", fontFamily: "JetBrains Mono, monospace" }}>
                  {weights[key]}
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={weights[key]}
                  onChange={(e) => setWeights({ ...weights, [key]: parseInt(e.target.value) })}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #C9963C ${(weights[key] / 60) * 100}%, #1E2330 ${(weights[key] / 60) * 100}%)`,
                    accentColor: "#C9963C",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {!isValid && (
          <div className="px-3 py-2 rounded-md text-xs" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#F43F5E", fontFamily: "JetBrains Mono" }}>
            ⚠ Total deve ser 100. Diferença atual: {(total - 100).toFixed(0)}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!isValid}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all"
          style={{
            background: isValid ? "#C9963C" : "#1E2330",
            color: isValid ? "#0B0D12" : "#4A5568",
            cursor: isValid ? "pointer" : "not-allowed",
            fontFamily: "DM Sans",
          }}
        >
          <Save size={14} />
          {saved ? "Salvo!" : "Salvar filosofia"}
        </button>
      </div>

      {/* Preview */}
      <div className="rounded-lg border p-5" style={{ background: "#111318", borderColor: "#1E2330" }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#8892A4", fontFamily: "Syne" }}>
          Visualização dos pesos
        </h3>
        <div className="space-y-2">
          {(Object.keys(weights) as (keyof Weights)[]).map((key) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs w-28 truncate" style={{ color: "#8892A4", fontFamily: "JetBrains Mono" }}>{LABELS[key].label}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1E2330" }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${weights[key]}%`, background: "#C9963C" }} />
              </div>
              <span className="text-xs w-8 text-right" style={{ color: "#C9963C", fontFamily: "JetBrains Mono" }}>{weights[key]}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
