"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMarketIndexes, refreshPrices, searchAssets } from "@/lib/api";
import { useCurrencyStore } from "@/lib/currency-store";
import type { AssetSearchResult, Currency } from "@/lib/types";

export function Topbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ["asset-search", debouncedQuery],
    queryFn: () => searchAssets(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });
  const { data: indexes = [] } = useQuery({
    queryKey: ["market-indexes"],
    queryFn: getMarketIndexes,
    staleTime: 60_000,
    enabled: searchOpen,
  });

  const visibleResults = useMemo(() => searchResults.slice(0, 8), [searchResults]);
  const hasSearch = debouncedQuery.length >= 2;
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const openAsset = (symbol: string) => {
    setSearchOpen(false);
    setQuery("");
    setDebouncedQuery("");
    router.push(`/assets/${encodeURIComponent(symbol)}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshPrices();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["holdings"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio-history"] }),
      ]);
    } catch (err) {
      console.error("Price refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="app-topbar" style={{
      height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)",
      background: "#0c0b08", display: "flex", alignItems: "center",
      padding: "0 32px", gap: 24, position: "sticky", top: 0, zIndex: 30,
    }}>
      <div className="app-topbar-status" style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7dd3a8", animation: "marketPulse 2s infinite", display: "inline-block" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", color: "#7dd3a8" }}>MARKETS OPEN</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(245,241,232,0.5)" }}>{timeStr} <span style={{ opacity: 0.5 }}>EST</span></span>
        </div>
        <span className="app-topbar-date" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(245,241,232,0.35)" }}>{dateStr}</span>
      </div>

      <div ref={searchRef} className="app-topbar-search" style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#14130f", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8, padding: "6px 12px", width: 320, position: "relative",
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,232,0.35)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && visibleResults[0]) {
              event.preventDefault();
              openAsset(visibleResults[0].yahoo_symbol || visibleResults[0].ticker);
            }
          }}
          placeholder="Search ticker, asset..."
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            fontSize: 13, color: "#f5f1e8", fontFamily: "var(--font-sans)",
          }}
        />
        {searchOpen && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#14130f",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            overflow: "hidden",
            zIndex: 100,
          }}>
            {hasSearch ? (
              <div>
                {isSearching && (
                  <div style={{ padding: "12px 14px", color: "#8892a4", fontSize: 12 }}>Searching Yahoo...</div>
                )}
                {!isSearching && visibleResults.length === 0 && (
                  <div style={{ padding: "12px 14px", color: "#8892a4", fontSize: 12 }}>No matches</div>
                )}
                {visibleResults.map((asset: AssetSearchResult) => (
                  <button
                    key={`${asset.ticker}-${asset.exchange ?? ""}`}
                    onClick={() => openAsset(asset.yahoo_symbol || asset.ticker)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      color: "#f5f1e8",
                      display: "grid",
                      gridTemplateColumns: "70px 1fr auto",
                      gap: 10,
                      alignItems: "center",
                      padding: "10px 12px",
                      cursor: "pointer",
                      textAlign: "left",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#c9f76f", fontWeight: 700 }}>{asset.ticker}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{asset.name}</span>
                      <span style={{ display: "block", color: "rgba(245,241,232,0.4)", fontSize: 10 }}>{asset.exchange ?? asset.quote_type ?? asset.source}</span>
                    </span>
                    <span style={{ color: "#8892a4", fontSize: 10, fontFamily: "var(--font-mono)" }}>{asset.asset_class}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ padding: "10px 12px 4px", color: "rgba(245,241,232,0.4)", fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>MAIN INDEXES</div>
                {indexes.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => openAsset(item.symbol)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      color: "#f5f1e8",
                      display: "grid",
                      gridTemplateColumns: "70px 1fr auto",
                      gap: 10,
                      alignItems: "center",
                      padding: "9px 12px",
                      cursor: "pointer",
                      textAlign: "left",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#cfa6f0", fontWeight: 700 }}>{item.symbol}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{item.name}</span>
                      <span style={{ display: "block", color: "rgba(245,241,232,0.4)", fontSize: 10 }}>{item.region}</span>
                    </span>
                    <span style={{ color: "#8892a4", fontSize: 10, fontFamily: "var(--font-mono)" }}>
                      {typeof item.price === "number" ? item.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "--"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="app-topbar-actions" style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" }}>
        <div style={{ display: "flex", background: "#14130f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, overflow: "hidden" }}>
          {(["USD", "BRL"] as Currency[]).map(c => (
            <button key={c} onClick={() => setCurrency(c)} aria-pressed={currency === c} style={{
              padding: "4px 10px", fontSize: 11, fontFamily: "var(--font-mono)",
              background: c === currency ? "#c9f76f" : "none",
              color: c === currency ? "#0c0b08" : "rgba(245,241,232,0.5)",
              border: "none", cursor: "pointer", fontWeight: c === currency ? 600 : 400,
            }}>{c}</button>
          ))}
        </div>
        <button onClick={handleRefresh} disabled={isRefreshing} style={{
          width: 32, height: 32, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
          background: "#14130f", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          opacity: isRefreshing ? 0.5 : 1,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,232,0.6)" strokeWidth="2">
            <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7-3.3M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7 3.3" />
            <path d="M21 3v6h-6M3 21v-6h6" />
          </svg>
        </button>
        <button style={{
          width: 32, height: 32, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
          background: "#14130f", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,232,0.6)" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </header>
  );
}
