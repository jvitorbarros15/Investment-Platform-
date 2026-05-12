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
        const found = holdings.find(
          (h) => h.ticker.toUpperCase() === ticker.toUpperCase()
        );
        setHolding(found || null);
        const wItem = watchlist.find(
          (w: { ticker: string; id: string }) => w.ticker.toUpperCase() === ticker.toUpperCase()
        );
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
    try {
      await fetchRate();
    } catch (error) {
      console.error("Failed to refresh rate:", error);
    } finally {
      setRateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-red-500">{error || "Asset not found"}</div>
      </div>
    );
  }

  const displayPrice = convertAmount(quote.price, quote.currency, currency, exchangeRate);
  const changePct = quote.change_1d_pct ?? 0;
  const displayColor = changePct >= 0 ? "text-green-500" : "text-red-500";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <Link href="/assets" className="text-neutral-400 hover:text-white mb-6">
          ← Back
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{quote.symbol}</h1>
              <span className="text-xs bg-neutral-800 px-2 py-1 rounded">
                {quote.sector || "N/A"}
              </span>
              <WatchlistToggle ticker={ticker} watchlistItemId={watchlistItemId} />
              <button
                onClick={() => setAddPositionOpen(true)}
                title="Add position"
                style={{
                  width: 32, height: 32, borderRadius: 6,
                  border: "1px solid rgba(201,247,111,0.3)",
                  background: "rgba(201,247,111,0.08)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9f76f" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
            <p className="text-neutral-400 text-lg">{quote.name}</p>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold mb-2">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency === "BRL" ? "BRL" : "USD",
              }).format(displayPrice)}
            </div>
            <div className={`text-lg font-semibold ${displayColor}`}>
              {changePct >= 0 ? "+" : ""}
              {changePct.toFixed(2)}% today
            </div>
          </div>
        </div>

        {/* Refresh Rate Button */}
        <div className="mb-8 flex gap-2 items-center">
          <button
            onClick={handleRefreshRate}
            disabled={rateLoading}
            title="Refresh exchange rate"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#14130f",
              cursor: rateLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: rateLoading ? 0.6 : 1,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(245,241,232,0.6)"
              strokeWidth="2"
              style={{ animation: rateLoading ? "topbarSpin 0.8s linear infinite" : "none" }}
            >
              <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7-3.3M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7 3.3" />
              <path d="M21 3v6h-6M3 21v-6h6" />
            </svg>
          </button>
          {useCurrencyStore.getState().lastUpdated && (
            <span className="text-xs text-neutral-500">
              Rate: {useCurrencyStore.getState().lastUpdated?.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Chart */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {["1m", "3m", "6m", "1y"].map((p) => {
              const periodMap: Record<string, string> = {
                "1m": "30d",
                "3m": "90d",
                "6m": "180d",
                "1y": "365d",
              };
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(periodMap[p])}
                  className={`px-3 py-1 text-sm rounded transition ${
                    period === periodMap[p]
                      ? "bg-blue-600"
                      : "bg-neutral-800 hover:bg-neutral-700"
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              );
            })}
          </div>
          <StockChart history={history} period={period} />
        </div>

        {/* Fundamentals */}
        <div className="mb-8">
          <StockFundamentals quote={quote} />
        </div>

        {/* Position */}
        {holding && (
          <div className="mb-8">
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
