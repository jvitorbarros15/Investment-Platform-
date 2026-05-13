"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAssets, getMarketIndexes } from "@/lib/api";
import type { AssetSearchResult } from "@/lib/types";
import { QuickAddModal } from "@/components/layout/QuickAddModal";

const NAV = [
  { href: "/",           label: "Dashboard" },
  { href: "/portfolio",  label: "Holdings" },
  { href: "/watchlist",  label: "Watchlist" },
  { href: "/philosophy", label: "Philosophy" },
  { href: "/alerts",     label: "Alerts" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setSearchOpen(false);
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

  const openAsset = (symbol: string) => {
    setSearchOpen(false);
    setQuery("");
    setDebouncedQuery("");
    router.push(`/assets/${encodeURIComponent(symbol)}`);
  };

  return (
    <>
      <div style={{
        borderBottom: "1px solid var(--color-ink)",
        padding: "0 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "var(--color-paper)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        {/* Tabs */}
        <nav style={{ display: "flex" }}>
          {NAV.map(item => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                padding: "12px 18px",
                fontFamily: "var(--font-display)",
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                color: active ? "var(--color-ink)" : "var(--color-ink-3)",
                textDecoration: "none",
                borderRight: "1px solid var(--color-rule-2)",
                position: "relative",
                transition: "color 0.15s",
                letterSpacing: "0.01em",
              }}
              onMouseOver={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--color-terracotta)"; }}
              onMouseOut={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--color-ink-3)"; }}
              >
                {item.label}
                {active && (
                  <span style={{
                    position: "absolute", left: 0, right: 0, bottom: -1,
                    height: 3, background: "var(--color-terracotta)",
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Search + QuickAdd */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0" }}>
          <div ref={searchRef} style={{ position: "relative" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              border: "1px solid var(--color-ink)", padding: "5px 10px",
              background: "var(--color-paper-2)", width: 260,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-4)" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={e => {
                  if (e.key === "Enter" && visibleResults[0]) {
                    e.preventDefault();
                    openAsset(visibleResults[0].yahoo_symbol || visibleResults[0].ticker);
                  }
                }}
                placeholder="Search ticker, asset..."
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontSize: 12, color: "var(--color-ink)", fontFamily: "var(--font-mono)",
                }}
              />
            </div>
            {searchOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                background: "var(--color-paper)", border: "1px solid var(--color-ink)",
                boxShadow: "4px 4px 0 var(--color-ink)", zIndex: 100, overflow: "hidden",
              }}>
                {hasSearch ? (
                  <div>
                    {isSearching && <div style={{ padding: "10px 12px", color: "var(--color-ink-3)", fontSize: 12, fontFamily: "var(--font-mono)" }}>Searching...</div>}
                    {!isSearching && visibleResults.length === 0 && <div style={{ padding: "10px 12px", color: "var(--color-ink-3)", fontSize: 12, fontFamily: "var(--font-mono)" }}>No matches</div>}
                    {visibleResults.map((asset: AssetSearchResult) => (
                      <button key={`${asset.ticker}-${asset.exchange ?? ""}`} onClick={() => openAsset(asset.yahoo_symbol || asset.ticker)}
                        style={{ width: "100%", border: "none", background: "transparent", color: "var(--color-ink)", display: "grid", gridTemplateColumns: "64px 1fr auto", gap: 8, alignItems: "center", padding: "9px 12px", cursor: "pointer", textAlign: "left", borderBottom: "1px solid var(--color-rule-2)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-terracotta)", fontWeight: 700 }}>{asset.ticker}</span>
                        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{asset.name}</span>
                        <span style={{ color: "var(--color-ink-4)", fontSize: 10, fontFamily: "var(--font-mono)" }}>{asset.asset_class}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div style={{ padding: "8px 12px 4px", color: "var(--color-ink-3)", fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}>MAIN INDEXES</div>
                    {indexes.map(item => (
                      <button key={item.symbol} onClick={() => openAsset(item.symbol)}
                        style={{ width: "100%", border: "none", background: "transparent", color: "var(--color-ink)", display: "grid", gridTemplateColumns: "64px 1fr auto", gap: 8, alignItems: "center", padding: "9px 12px", cursor: "pointer", textAlign: "left", borderBottom: "1px solid var(--color-rule-2)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-terracotta)", fontWeight: 700 }}>{item.symbol}</span>
                        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{item.name}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-ink-3)" }}>{typeof item.price === "number" ? item.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "--"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={() => setQuickAddOpen(true)} title="Add transaction" style={{
            width: 32, height: 32, border: "1px solid var(--color-ink)",
            background: "var(--color-paper-2)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
      {quickAddOpen && <QuickAddModal onClose={() => setQuickAddOpen(false)} />}
    </>
  );
}
