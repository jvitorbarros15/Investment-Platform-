"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPhilosophy, updatePhilosophy, getHoldings, getWatchlist } from "@/lib/api";
import { Reveal } from "@/components/ui/reveal";
import { ScoreBadge } from "@/components/ui/score-badge";
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
  quality: 25,
  value: 20,
  growth: 10,
  dividend: 20,
  financial_health: 15,
  momentum: 3,
  risk: 4,
  portfolio_fit: 3,
};

const CATEGORIES = [
  { key: "quality", label: "Quality", desc: "ROE, margins, earnings consistency, FCF reliability" },
  { key: "value", label: "Value", desc: "P/E, P/B, P/S, price vs historical range" },
  { key: "growth", label: "Growth", desc: "Revenue, earnings, FCF growth, analyst estimates" },
  { key: "dividend", label: "Dividend strength", desc: "Yield, growth, payout ratio, consistency" },
  { key: "financial_health", label: "Financial health", desc: "Debt-to-equity, current ratio, interest coverage" },
  { key: "momentum", label: "Momentum", desc: "Price vs MA, 6M/12M returns, relative strength" },
  { key: "risk", label: "Risk", desc: "Volatility, beta, drawdown, sector concentration" },
  { key: "portfolio_fit", label: "Portfolio fit", desc: "Diversification, sector gap, currency balance" },
];

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
  const [draftWeights, setDraftWeights] = useState<Weights | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["philosophy"],
    queryFn: getPhilosophy,
  });

  const { data: holdings = [] } = useQuery({ queryKey: ["holdings"], queryFn: getHoldings });
  const { data: watchlist = [] } = useQuery({ queryKey: ["watchlist"], queryFn: getWatchlist });

  const profile = profiles?.[0] ?? null;
  const profileId = profile?.id ?? null;
  const weights = draftWeights ?? (profile ? profileToWeights(profile) : DEFAULTS);

  const saveMutation = useMutation({
    mutationFn: () => updatePhilosophy(profileId!, weightsToPayload(weights)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["philosophy"] });
      setDraftWeights(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = Math.abs(total - 100) < 0.5;

  // Simulated live preview ranking
  const ranked = useMemo(() => {
    return [...holdings, ...watchlist]
      .slice(0, 6)
      .map((a) => {
        const factor =
          weights.quality * 0.85 +
          weights.value * 0.6 +
          weights.growth * 0.7 +
          weights.dividend * 0.4 +
          weights.financial_health * 0.8 +
          weights.momentum * 0.6 +
          weights.risk * 0.5 +
          weights.portfolio_fit * 0.7;
        const ticker = a.ticker || "???";
        const adj = (a.score || 70) * (factor / 1000) * (0.85 + (ticker.charCodeAt(0) % 30) / 100);
        return { ticker, simScore: Math.max(20, Math.min(96, adj * 1.4 + 35)) };
      })
      .sort((a, b) => b.simScore - a.simScore);
  }, [weights, holdings, watchlist]);

  const PANEL = {
    background: "#14130f",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 24,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* HEADER */}
      <Reveal>
        <div>
          <div style={{ marginBottom: 8, color: "#8892a4", fontSize: 12, fontWeight: 500, letterSpacing: "0.05em" }}>
            Investment philosophy
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px, 4vw, 36px)", lineHeight: 1.2, color: "#f5f1e8", margin: 0 }}>
            How you score every asset
          </h1>
          <p style={{ color: "#8892a4", fontSize: 14, marginTop: 8, maxWidth: 600 }}>
            Set weights for each scoring category. Total must equal 100. Live preview shows how your watchlist re-ranks.
          </p>
        </div>
      </Reveal>

      {/* TOTAL INDICATOR */}
      <Reveal delay={50}>
        <div
          style={{
            ...PANEL,
            padding: 16,
            border: `1px solid ${total === 100 ? "rgba(201,247,111,0.3)" : "rgba(224,123,108,0.3)"}`,
          }}
        >
          <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>
            Total weight
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              color: total === 100 ? "#c9f76f" : "#e89b7c",
              margin: 0,
            }}
          >
            {total}
            <span style={{ fontSize: 20, opacity: 0.5 }}> / 100</span>
          </div>
        </div>
      </Reveal>

      {/* TWO COLUMN LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 24 }}>
        {/* LEFT: SLIDERS */}
        <Reveal delay={100}>
          <div style={PANEL}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>
                Weights
              </div>
              <h3 style={{ color: "#f5f1e8", fontSize: 20, fontWeight: 600, margin: 0 }}>
                Drag sliders to tune
              </h3>
            </div>

            {isLoading ? (
              <div style={{ color: "#8892a4" }}>Loading...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {CATEGORIES.map((cat) => (
                  <div key={cat.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ color: "#f5f1e8", fontSize: 13, fontWeight: 600 }}>{cat.label}</div>
                        <div style={{ color: "#8892a4", fontSize: 11, marginTop: 2 }}>{cat.desc}</div>
                      </div>
                      <div style={{ color: "#c9f76f", fontSize: 14, fontWeight: 600, fontFamily: "JetBrains Mono, monospace" }}>
                        {weights[cat.key as keyof Weights]}
                        <span style={{ opacity: 0.4, fontSize: 12 }}>%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={weights[cat.key as keyof Weights]}
                      onChange={(e) => setDraftWeights({ ...weights, [cat.key]: parseInt(e.target.value) })}
                      style={{
                        width: "100%",
                        height: 6,
                        borderRadius: 3,
                        background: `linear-gradient(to right, #c9f76f 0%, #c9f76f ${(weights[cat.key as keyof Weights] / 50) * 100}%, rgba(255,255,255,0.1) ${(weights[cat.key as keyof Weights] / 50) * 100}%, rgba(255,255,255,0.1) 100%)`,
                        outline: "none",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!isValid || !profileId || saveMutation.isPending}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: isValid && profileId ? "#c9f76f" : "#1E2330",
                  color: isValid && profileId ? "#0c0b08" : "#8892a4",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isValid && profileId ? "pointer" : "not-allowed",
                  fontFamily: "JetBrains Mono, monospace",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (isValid && profileId) {
                    (e.currentTarget as HTMLElement).style.opacity = "0.8";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isValid && profileId) {
                    (e.currentTarget as HTMLElement).style.opacity = "1";
                  }
                }}
              >
                {saved ? "Saved!" : saveMutation.isPending ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setDraftWeights(DEFAULTS)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "#8892a4",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "JetBrains Mono, monospace",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#f5f1e8";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#8892a4";
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </Reveal>

        {/* RIGHT: LIVE PREVIEW */}
        <Reveal delay={200}>
          <div style={{ ...PANEL, position: "sticky", top: 80, display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>
                Live preview
              </div>
              <h3 style={{ color: "#f5f1e8", fontSize: 20, fontWeight: 600, margin: 0 }}>
                Top fits
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ranked.map((a, i) => (
                <div key={a.ticker + i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#8892a4",
                      fontFamily: "JetBrains Mono, monospace",
                      width: 20,
                    }}
                  >
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#f5f1e8", fontSize: 13, fontWeight: 600, fontFamily: "JetBrains Mono, monospace" }}>
                      {a.ticker}
                    </div>
                  </div>
                  <ScoreBadge score={Math.round(a.simScore)} />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
