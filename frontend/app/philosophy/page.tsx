"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { getPhilosophy, updatePhilosophy } from "@/lib/api";
import type { PhilosophyProfile } from "@/lib/types";

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
  quality: 25, value: 20, growth: 10, dividend: 20,
  financial_health: 15, momentum: 3, risk: 4, portfolio_fit: 3,
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

function profileToWeights(p: PhilosophyProfile): Weights {
  return {
    quality: p.quality_weight,
    value: p.value_weight,
    growth: p.growth_weight,
    dividend: p.dividend_weight,
    financial_health: p.financial_health_weight,
    momentum: p.momentum_weight,
    risk: p.risk_weight,
    portfolio_fit: p.portfolio_fit_weight,
  };
}

function weightsToPayload(w: Weights) {
  return {
    quality_weight: w.quality,
    value_weight: w.value,
    growth_weight: w.growth,
    dividend_weight: w.dividend,
    financial_health_weight: w.financial_health,
    momentum_weight: w.momentum,
    risk_weight: w.risk,
    portfolio_fit_weight: w.portfolio_fit,
  };
}

export default function PhilosophyPage() {
  const queryClient = useQueryClient();
  const [weights, setWeights] = useState<Weights>(DEFAULTS);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: profiles, isLoading } = useQuery<PhilosophyProfile[]>({
    queryKey: ["philosophy"],
    queryFn: getPhilosophy,
  });

  useEffect(() => {
    if (profiles && profiles.length > 0) {
      setProfileId(profiles[0].id);
      setWeights(profileToWeights(profiles[0]));
    }
  }, [profiles]);

  const saveMutation = useMutation({
    mutationFn: () => updatePhilosophy(profileId!, weightsToPayload(weights)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["philosophy"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = Math.abs(total - 100) < 0.5;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#F0F2F7" }}>
          Investment Philosophy
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#4A5568" }}>
          Define the weight of each criterion to personalize asset scoring.
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-6" style={{ background: "#111318", borderColor: "#1E2330" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9963C", fontFamily: "Syne" }}>
            Weights by Category
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

        {isLoading ? (
          <p className="text-xs text-center py-4" style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>Loading...</p>
        ) : (
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
                    type="range" min={0} max={60} step={1} value={weights[key]}
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
        )}

        {!isValid && (
          <div className="px-3 py-2 rounded-md text-xs" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#F43F5E", fontFamily: "JetBrains Mono" }}>
            ⚠ Total must be 100. Current difference: {(total - 100).toFixed(0)}
          </div>
        )}

        <button
          onClick={() => saveMutation.mutate()}
          disabled={!isValid || !profileId || saveMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all"
          style={{
            background: isValid && profileId ? "#C9963C" : "#1E2330",
            color: isValid && profileId ? "#0B0D12" : "#4A5568",
            cursor: isValid && profileId ? "pointer" : "not-allowed",
            fontFamily: "DM Sans",
          }}
        >
          <Save size={14} />
          {saved ? "Saved!" : saveMutation.isPending ? "Saving..." : "Save Philosophy"}
        </button>
      </div>

      {/* Preview */}
      <div className="rounded-lg border p-5" style={{ background: "#111318", borderColor: "#1E2330" }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#8892A4", fontFamily: "Syne" }}>
          Weight Preview
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
