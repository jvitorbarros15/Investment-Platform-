"use client";

import { useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties, FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTransaction, deleteHolding, getHoldings, getPortfolioSummary } from "@/lib/api";
import { Reveal } from "@/components/ui/reveal";
import { Sparkline } from "@/components/ui/sparkline";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useCurrencyStore } from "@/lib/currency-store";
import { convertCurrency, formatCurrency } from "@/lib/formatters";
import type { AssetClass, Holding } from "@/lib/types";

const TABS: { label: string; value: AssetClass | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "US Stocks", value: "US_STOCK" },
  { label: "BR Stocks", value: "BR_STOCK" },
  { label: "FIIs", value: "FII" },
  { label: "Crypto", value: "CRYPTO" },
];

function genSparkData(seed: number, n = 30): number[] {
  const r = (i: number) => Math.sin(seed * 0.1 + i * 0.7) * 0.03 + (Math.sin(i * 0.3 + seed) * 0.01);
  let v = 100;
  return Array.from({ length: n }, (_, i) => { v = v * (1 + r(i)); return v; });
}

function formatNum(v: number, decimals = 2): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatPct(v: number): string {
  return v.toFixed(2) + "%";
}

export default function HoldingsPage() {
  const [filter, setFilter] = useState<AssetClass | "ALL">("ALL");
  const [sort, setSort] = useState<{ key: string; dir: number }>({ key: "value", dir: -1 });
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<"BRL" | "USD">("BRL");
  const [formError, setFormError] = useState("");
  const [confirmingTicker, setConfirmingTicker] = useState<string | null>(null);
  const displayCurrency = useCurrencyStore((s) => s.currency);
  const storeRate = useCurrencyStore((s) => s.exchangeRate);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["holdings"],
    queryFn: getHoldings,
  });
  const { data: summary } = useQuery({ queryKey: ["portfolio-summary"], queryFn: getPortfolioSummary });
  const addPosition = useMutation({
    mutationFn: createTransaction,
    onSuccess: async () => {
      setTicker("");
      setQuantity("");
      setPrice("");
      setFormError("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["holdings"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio-history"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
    },
  });

  const removeHolding = useMutation({
    mutationFn: (ticker: string) => deleteHolding(ticker),
    onSuccess: async () => {
      setConfirmingTicker(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["holdings"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] }),
      ]);
    },
  });

  const usdBrl = storeRate > 1 ? storeRate : (summary?.usd_to_brl ?? 5.70);
  const toDisplay = useCallback(
    (value: number, currency: "BRL" | "USD") => convertCurrency(value, currency, displayCurrency, usdBrl),
    [displayCurrency, usdBrl]
  );

  const filtered = useMemo(() => {
    let rows = holdings.slice();
    if (filter !== "ALL") rows = rows.filter((h: Holding) => h.asset_class === filter);

    rows.sort((a: Holding, b: Holding) => {
      let aVal = 0, bVal = 0;
      if (sort.key === "value") {
        aVal = toDisplay(a.current_value || 0, a.currency);
        bVal = toDisplay(b.current_value || 0, b.currency);
      } else if (sort.key === "gain") {
        aVal = toDisplay(a.total_gain || 0, a.currency);
        bVal = toDisplay(b.total_gain || 0, b.currency);
      } else if (sort.key === "return") {
        aVal = a.return_pct || 0;
        bVal = b.return_pct || 0;
      }
      return (aVal - bVal) * sort.dir;
    });
    return rows;
  }, [holdings, filter, sort, toDisplay]);

  const totalValue = filtered.reduce((s: number, h: Holding) => s + toDisplay(h.current_value || 0, h.currency), 0);
  const totalGain = filtered.reduce((s: number, h: Holding) => s + toDisplay(h.total_gain || 0, h.currency), 0);
  const avgReturn = filtered.length > 0 ? filtered.reduce((s: number, h: Holding) => s + (h.return_pct || 0), 0) / filtered.length : 0;

  const headers = [
    { key: "asset", label: "Asset", sortable: false },
    { key: "qty", label: "Qty", sortable: false, align: "right" },
    { key: "avg", label: "Avg cost", sortable: false, align: "right" },
    { key: "price", label: "Price", sortable: false, align: "right" },
    { key: "spark", label: "30D", sortable: false, align: "center" },
    { key: "value", label: "Value", sortable: true, align: "right" },
    { key: "gain", label: "Gain", sortable: true, align: "right" },
    { key: "return", label: "Return", sortable: true, align: "right" },
    { key: "remove", label: "", sortable: false, align: "center" },
  ];

  const inputStyle: CSSProperties = {
    width: "100%", minWidth: 0, height: 38, borderRadius: 0,
    border: "1px solid var(--color-ink)", background: "var(--color-paper-2)",
    color: "var(--color-ink)", padding: "0 10px",
    fontFamily: "var(--font-mono)", fontSize: 13, outline: "none",
  };

  const handleAddPosition = (e: FormEvent) => {
    e.preventDefault();
    const cleanTicker = ticker.trim().toUpperCase();
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    if (!cleanTicker || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0 || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setFormError("Enter a ticker, quantity, and price.");
      return;
    }
    addPosition.mutate({ ticker: cleanTicker, transaction_type: "BUY", quantity: parsedQuantity, price: parsedPrice, currency });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* HEADER */}
      <Reveal>
        <div style={{ paddingBottom: 20, borderBottom: "1px solid var(--color-ink)", marginBottom: 24 }}>
          <div className="kicker" style={{ marginBottom: 8 }}>Holdings · {filtered.length} positions</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(30px, 4vw, 48px)", lineHeight: 0.9, color: "var(--color-ink)", margin: 0, letterSpacing: "-0.03em" }}>
            Portfolio breakdown
          </h1>
        </div>
      </Reveal>

      {/* ADD POSITION FORM */}
      <Reveal delay={75}>
        <form onSubmit={handleAddPosition} style={{
          border: "1px solid var(--color-ink)", padding: 20, marginBottom: 20,
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: 12, alignItems: "end",
          background: "var(--color-paper)",
        }}>
          <div>
            <div className="kicker" style={{ marginBottom: 6 }}>Ticker</div>
            <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="AAPL" style={inputStyle} />
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 6 }}>Quantity</div>
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="0" step="any" placeholder="10" style={inputStyle} />
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 6 }}>Buy price</div>
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="any" placeholder="185.50" style={inputStyle} />
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 6 }}>Currency</div>
            <select value={currency} onChange={(e) => setCurrency(e.target.value as "BRL" | "USD")} style={inputStyle}>
              <option value="BRL">BRL</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <button type="submit" disabled={addPosition.isPending} style={{
            height: 38, border: "1px solid var(--color-terracotta-2)", borderRadius: 0,
            background: "var(--color-terracotta)", color: "var(--color-paper)",
            fontWeight: 700, padding: "0 16px", cursor: addPosition.isPending ? "not-allowed" : "pointer",
            whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: 13,
            opacity: addPosition.isPending ? 0.6 : 1,
          }}>
            {addPosition.isPending ? "Adding..." : "Add position"}
          </button>
          {(formError || addPosition.isError) && (
            <div style={{ gridColumn: "1 / -1", color: "var(--color-crimson)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
              {formError || "Could not add this position."}
            </div>
          )}
        </form>
      </Reveal>

      {/* FILTER TABS */}
      <Reveal delay={50}>
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid var(--color-ink)" }}>
          {TABS.map((tab) => (
            <button key={tab.value} onClick={() => setFilter(tab.value)} style={{
              padding: "10px 16px", border: "none", borderRight: "1px solid var(--color-rule-2)",
              background: filter === tab.value ? "var(--color-ink)" : "transparent",
              color: filter === tab.value ? "var(--color-paper)" : "var(--color-ink-3)",
              fontSize: 13, fontWeight: filter === tab.value ? 700 : 500, cursor: "pointer",
              fontFamily: "var(--font-mono)",
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* SUMMARY STRIP */}
      <Reveal delay={100}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: "1px solid var(--color-ink)", marginBottom: 24 }}>
          {[
            { label: "Subset value", value: <AnimatedNumber value={totalValue} fmt={(v) => formatCurrency(v, displayCurrency)} />, color: "var(--color-ink)" },
            { label: "Subset gain", value: <>{totalGain >= 0 ? "+" : ""}<AnimatedNumber value={totalGain} fmt={(v) => v.toLocaleString("en-US", { maximumFractionDigits: 0 })} /></>, color: totalGain >= 0 ? "var(--color-teal)" : "var(--color-crimson)" },
            { label: "Avg return", value: formatPct(avgReturn), color: avgReturn >= 0 ? "var(--color-teal)" : "var(--color-crimson)" },
            { label: "Positions", value: filtered.length, color: "var(--color-ink)" },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: "16px 20px", borderRight: i < 3 ? "1px solid var(--color-ink)" : "none" }}>
              <div className="kicker" style={{ marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* TABLE */}
      <Reveal delay={150}>
        <div style={{ border: "1px solid var(--color-ink)", overflowX: "auto", overflowY: "hidden" }}>
          {isLoading ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--color-ink-3)", fontFamily: "var(--font-mono)" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--color-ink-3)", fontFamily: "var(--font-mono)" }}>No holdings</div>
          ) : (
            <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-ink)", background: "var(--color-paper-2)" }}>
                  {headers.map((h) => (
                    <th key={h.key} onClick={() => h.sortable && setSort((s) => ({ key: h.key, dir: s.key === h.key ? -s.dir : -1 }))}
                      style={{
                        padding: "10px 16px", textAlign: (h.align as CSSProperties["textAlign"]) || "left",
                        color: "var(--color-ink-3)", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
                        textTransform: "uppercase", cursor: h.sortable ? "pointer" : "default",
                        userSelect: "none", fontFamily: "var(--font-mono)",
                      }}>
                      {h.label}
                      {h.sortable && sort.key === h.key && (
                        <span style={{ marginLeft: 6, color: "var(--color-terracotta)" }}>{sort.dir < 0 ? "↓" : "↑"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((h: Holding, i: number) => {
                  const series = genSparkData(h.ticker.charCodeAt(0), 30);
                  const gain = h.total_gain || 0;
                  const ret = h.return_pct || 0;
                  const isUp = (h.change_1d || 0) >= 0;
                  return (
                    <tr key={h.ticker} onClick={() => router.push(`/assets/${encodeURIComponent(h.ticker)}`)}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-rule-2)" : "none", cursor: "pointer" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-paper-2)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <td style={{ padding: "12px 16px", color: "var(--color-ink)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 36, height: 36, border: "1px solid var(--color-ink)", background: "var(--color-paper-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-ink)" }}>
                            {h.ticker.slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ color: "var(--color-ink)", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{h.ticker}</div>
                            <div style={{ color: "var(--color-ink-3)", fontSize: 12, marginTop: 2 }}>{h.name} {h.sector ? `· ${h.sector}` : ""}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-ink)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                        {formatNum(h.quantity || 0, h.asset_class === "CRYPTO" ? 4 : 0)}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-ink-3)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                        {formatCurrency(toDisplay(h.average_cost || 0, h.currency), displayCurrency)}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-ink)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                        {formatCurrency(toDisplay(h.current_price || 0, h.currency), displayCurrency)}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <Sparkline data={series} width={70} height={22} color={isUp ? "#0d6b65" : "#99291b"} strokeWidth={1.3} fill={false} />
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-ink)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                        {formatCurrency(toDisplay(h.current_value || 0, h.currency), displayCurrency)}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 13, color: gain >= 0 ? "var(--color-teal)" : "var(--color-crimson)" }}>
                        {gain >= 0 ? "+" : ""}{formatCurrency(Math.abs(toDisplay(gain, h.currency)), displayCurrency)}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 13, color: ret >= 0 ? "var(--color-teal)" : "var(--color-crimson)" }}>
                        {formatPct(ret)}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        {confirmingTicker === h.ticker ? (
                          <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "center" }}>
                            <button onClick={(e) => { e.stopPropagation(); removeHolding.mutate(h.ticker); }} disabled={removeHolding.isPending} title="Confirm remove"
                              style={{ width: 24, height: 24, border: "1px solid var(--color-teal)", background: "transparent", color: "var(--color-teal)", cursor: removeHolding.isPending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, opacity: removeHolding.isPending ? 0.5 : 1 }}>
                              ✓
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setConfirmingTicker(null); }} title="Cancel"
                              style={{ width: 24, height: 24, border: "1px solid var(--color-rule)", background: "transparent", color: "var(--color-ink-3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setConfirmingTicker(h.ticker); }} title={`Remove ${h.ticker}`}
                            style={{ width: 28, height: 28, border: "none", background: "transparent", color: "var(--color-ink-4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-crimson)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-ink-4)"; }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Reveal>
    </div>
  );
}
