"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAssetDetail, getAssetHistory, getHoldings, getWatchlist } from "@/lib/api";
import { useCurrencyStore } from "@/lib/currency-store";
import { StockQuote, Holding } from "@/lib/types";
import { convertAmount } from "@/lib/utils/currency";
import { StockFundamentals } from "@/components/stock/StockFundamentals";
import { StockPosition } from "@/components/stock/StockPosition";
import { StockChart } from "@/components/stock/StockChart";
import { WatchlistToggle } from "@/components/stock/WatchlistToggle";
import { QuickAddModal } from "@/components/layout/QuickAddModal";

interface HistoryPoint {
  date: string;
  close: number;
  volume?: number;
}

export default function AssetDetailPage() {
  const params = useParams();
  const ticker = params.ticker as string;
  const currency = useCurrencyStore((state) => state.currency);
  const exchangeRate = useCurrencyStore((state) => state.exchangeRate);
  const fetchRate = useCurrencyStore((state) => state.fetchRate);

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [holding, setHolding] = useState<Holding | null>(null);
  const [watchlistItemId, setWatchlistItemId] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("365d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [addPositionOpen, setAddPositionOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [quoteData, historyData, holdings, watchlist] = await Promise.all([
          getAssetDetail(ticker),
          getAssetHistory(ticker, period),
          getHoldings(),
          getWatchlist(),
        ]);
        setQuote(quoteData);
        setHistory(historyData);
        const found = holdings.find((h) => h.ticker.toUpperCase() === ticker.toUpperCase());
        setHolding(found || null);
        const wItem = watchlist.find((w: { ticker: string; id: string }) => w.ticker.toUpperCase() === ticker.toUpperCase());
        setWatchlistItemId(wItem?.id ?? null);
      } catch (err) {
        setError("Failed to load asset details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [ticker, period]);

  const handleRefreshRate = async () => {
    setRateLoading(true);
    try { await fetchRate(); } catch {}
    finally { setRateLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--color-ink-3)", letterSpacing: "0.12em" }}>Loading...</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--color-crimson)" }}>{error || "Asset not found"}</div>
      </div>
    );
  }

  const displayPrice = convertAmount(quote.price, quote.currency, currency, exchangeRate);
  const changePct = quote.change_1d_pct ?? 0;
  const isUp = changePct >= 0;

  const PERIOD_MAP: Record<string, string> = { "1m": "30d", "3m": "90d", "6m": "180d", "1y": "365d" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* BACK */}
      <Link href="/portfolio" style={{ display: "inline-block", marginBottom: 20, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-ink-3)", textDecoration: "none", letterSpacing: "0.1em" }}>
        ← Back to Holdings
      </Link>

      {/* HEADER BAND */}
      <div style={{ border: "1px solid var(--color-ink)", padding: "20px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "var(--color-paper-2)" }}>
        <div>
          <div className="kicker" style={{ marginBottom: 8 }}>{quote.sector || "Equity"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <h1 style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 32, color: "var(--color-ink)", margin: 0, letterSpacing: "-0.02em" }}>{quote.symbol}</h1>
            <WatchlistToggle ticker={ticker} watchlistItemId={watchlistItemId} />
            <button onClick={() => setAddPositionOpen(true)} title="Add position" style={{
              width: 32, height: 32, border: "1px solid var(--color-ink)", background: "var(--color-paper)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <div style={{ fontSize: 14, color: "var(--color-ink-3)" }}>{quote.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 40, color: "var(--color-ink)", lineHeight: 0.9, marginBottom: 10 }}>
            {new Intl.NumberFormat("en-US", { style: "currency", currency: currency === "BRL" ? "BRL" : "USD" }).format(displayPrice)}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: isUp ? "var(--color-teal)" : "var(--color-crimson)", fontWeight: 600 }}>
            {isUp ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}% today
          </div>
          <button onClick={handleRefreshRate} disabled={rateLoading} style={{
            marginTop: 8, width: 28, height: 28, border: "1px solid var(--color-rule)", background: "var(--color-paper)",
            cursor: rateLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: rateLoading ? 0.5 : 1,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-4)" strokeWidth="2"
              style={{ animation: rateLoading ? "topbarSpin 0.8s linear infinite" : "none" }}>
              <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7-3.3M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7 3.3" />
              <path d="M21 3v6h-6M3 21v-6h6" />
            </svg>
          </button>
        </div>
      </div>

      {/* CHART */}
      <div style={{ border: "1px solid var(--color-ink)", marginBottom: 24 }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--color-rule-2)", display: "flex", gap: 0 }}>
          {(["1m", "3m", "6m", "1y"] as const).map((p) => {
            const mapped = PERIOD_MAP[p];
            const active = period === mapped;
            return (
              <button key={p} onClick={() => setPeriod(mapped)} style={{
                padding: "5px 12px", border: "none", borderRight: "1px solid var(--color-rule-2)",
                background: active ? "var(--color-ink)" : "transparent",
                color: active ? "var(--color-paper)" : "var(--color-ink-3)",
                fontSize: 11, fontFamily: "var(--font-mono)", cursor: "pointer", fontWeight: active ? 700 : 400,
              }}>
                {p.toUpperCase()}
              </button>
            );
          })}
        </div>
        <div style={{ padding: 24 }}>
          <StockChart history={history} period={period} />
        </div>
      </div>

      {/* FUNDAMENTALS + POSITION */}
      <div style={{ display: "grid", gridTemplateColumns: holding ? "1fr 1fr" : "1fr", gap: 0, border: "1px solid var(--color-ink)" }}>
        <div style={{ padding: 24, borderRight: holding ? "1px solid var(--color-ink)" : "none" }}>
          <div className="kicker" style={{ marginBottom: 12 }}>Fundamentals</div>
          <StockFundamentals quote={quote} />
        </div>
        {holding && (
          <div style={{ padding: 24 }}>
            <div className="kicker" style={{ marginBottom: 12 }}>Your position</div>
            <StockPosition holding={holding} />
          </div>
        )}
      </div>

      {addPositionOpen && (
        <QuickAddModal
          onClose={() => setAddPositionOpen(false)}
          initialTicker={quote.symbol}
          initialPrice={quote.price}
          initialCurrency={quote.currency as "BRL" | "USD"}
        />
      )}
    </div>
  );
}
