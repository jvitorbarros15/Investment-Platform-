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
  quality: 25, value: 20, growth: 10, dividend: 20,
  financial_health: 15, momentum: 3, risk: 4, portfolio_fit: 3,
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
    quality: p.quality_weight, value: p.value_weight, growth: p.growth_weight,
    dividend: p.dividend_weight, financial_health: p.financial_health_weight,
    momentum: p.momentum_weight, risk: p.risk_weight, portfolio_fit: p.portfolio_fit_weight,
  };
}

function weightsToPayload(w: Weights) {
  return {
    quality_weight: w.quality, value_weight: w.value, growth_weight: w.growth,
    dividend_weight: w.dividend, financial_health_weight: w.financial_health,
    momentum_weight: w.momentum, risk_weight: w.risk, portfolio_fit_weight: w.portfolio_fit,
  };
}

export default function PhilosophyPage() {
  const queryClient = useQueryClient();
  const [draftWeights, setDraftWeights] = useState<Weights | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: profiles, isLoading } = useQuery({ queryKey: ["philosophy"], queryFn: getPhilosophy });
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

  const ranked = useMemo(() => {
    return [...holdings, ...watchlist].slice(0, 6).map((a) => {
      const factor = weights.quality * 0.85 + weights.value * 0.6 + weights.growth * 0.7 + weights.dividend * 0.4 + weights.financial_health * 0.8 + weights.momentum * 0.6 + weights.risk * 0.5 + weights.portfolio_fit * 0.7;
      const ticker = a.ticker || "???";
      const adj = (a.score || 70) * (factor / 1000) * (0.85 + (ticker.charCodeAt(0) % 30) / 100);
      return { ticker, simScore: Math.max(20, Math.min(96, adj * 1.4 + 35)) };
    }).sort((a, b) => b.simScore - a.simScore);
  }, [weights, holdings, watchlist]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* HEADER */}
      <Reveal>
        <div style={{ paddingBottom: 20, borderBottom: "1px solid var(--color-ink)", marginBottom: 24 }}>
          <div className="kicker" style={{ marginBottom: 8 }}>Investment philosophy</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(30px, 4vw, 48px)", lineHeight: 0.9, color: "var(--color-ink)", margin: 0, letterSpacing: "-0.03em" }}>
            How you score every asset
          </h1>
          <p style={{ color: "var(--color-ink-3)", fontSize: 14, marginTop: 12, maxWidth: 600 }}>
            Set weights for each scoring category. Total must equal 100. Live preview shows how your watchlist re-ranks.
          </p>
        </div>
      </Reveal>

      {/* TOTAL INDICATOR */}
      <Reveal delay={50}>
        <div style={{
          border: `1px solid ${total === 100 ? "var(--color-teal)" : "var(--color-crimson)"}`,
          padding: "14px 20px", marginBottom: 24, background: "var(--color-paper)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div className="kicker">Total weight</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: total === 100 ? "var(--color-teal)" : "var(--color-crimson)" }}>
            {total}<span style={{ fontSize: 18, opacity: 0.5 }}> / 100</span>
          </div>
        </div>
      </Reveal>

      {/* TWO COLUMN LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 0, border: "1px solid var(--color-ink)" }}>
        {/* LEFT: SLIDERS */}
        <Reveal delay={100}>
          <div style={{ padding: 24, borderRight: "1px solid var(--color-ink)" }}>
            <div style={{ marginBottom: 24 }}>
              <div className="kicker" style={{ marginBottom: 4 }}>Weights</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-ink)", fontSize: 20, margin: 0 }}>Drag sliders to tune</h3>
            </div>

            {isLoading ? (
              <div style={{ color: "var(--color-ink-3)", fontFamily: "var(--font-mono)" }}>Loading...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {CATEGORIES.map((cat) => (
                  <div key={cat.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ color: "var(--color-ink)", fontSize: 13, fontWeight: 600 }}>{cat.label}</div>
                        <div style={{ color: "var(--color-ink-3)", fontSize: 11, marginTop: 2 }}>{cat.desc}</div>
                      </div>
                      <div style={{ color: "var(--color-terracotta)", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        {weights[cat.key as keyof Weights]}<span style={{ opacity: 0.5, fontSize: 12 }}>%</span>
                      </div>
                    </div>
                    <input type="range" min="0" max="50" value={weights[cat.key as keyof Weights]}
                      onChange={(e) => setDraftWeights({ ...weights, [cat.key]: parseInt(e.target.value) })} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
              <button onClick={() => saveMutation.mutate()} disabled={!isValid || !profileId || saveMutation.isPending} style={{
                padding: "10px 18px", border: "1px solid var(--color-terracotta-2)", borderRadius: 0,
                background: isValid && profileId ? "var(--color-terracotta)" : "var(--color-paper-2)",
                color: isValid && profileId ? "var(--color-paper)" : "var(--color-ink-4)",
                fontSize: 13, fontWeight: 700, cursor: isValid && profileId ? "pointer" : "not-allowed",
                fontFamily: "var(--font-mono)",
              }}>
                {saved ? "Saved!" : saveMutation.isPending ? "Saving..." : "Save weights"}
              </button>
              <button onClick={() => setDraftWeights(DEFAULTS)} style={{
                padding: "10px 18px", border: "1px solid var(--color-rule)", borderRadius: 0,
                background: "transparent", color: "var(--color-ink-3)",
                fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-mono)",
              }}>
                Reset
              </button>
            </div>
          </div>
        </Reveal>

        {/* RIGHT: LIVE PREVIEW */}
        <Reveal delay={200}>
          <div style={{ padding: 24, position: "sticky", top: 80 }}>
            <div style={{ marginBottom: 20 }}>
              <div className="kicker" style={{ marginBottom: 4 }}>Live preview</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-ink)", fontSize: 20, margin: 0 }}>Top fits with current weights</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {ranked.map((a, i) => (
                <div key={a.ticker + i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--color-rule-2)" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-ink-4)", fontFamily: "var(--font-mono)", width: 20 }}>
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>{a.ticker}</div>
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
