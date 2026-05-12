"use client";

import React, { useState } from "react";
import { StockQuote } from "@/lib/types";
import { useCurrencyStore } from "@/lib/currency-store";
import { convertAmount } from "@/lib/utils/currency";

interface StockFundamentalsProps {
  quote: StockQuote;
}

export function StockFundamentals({ quote }: StockFundamentalsProps) {
  const [showContext, setShowContext] = useState(false);
  const currency = useCurrencyStore((state) => state.currency);
  const exchangeRate = useCurrencyStore((state) => state.exchangeRate);

  const getContext = (label: string, raw: number | null, converted: number | null): string => {
    if (!showContext || raw === null || converted === null) return "";

    switch (label) {
      case "Market Cap":
        // Compare against converted value so BRL stocks use BRL thresholds scaled by rate
        if (converted > 200e9) return "Large cap";
        if (converted > 10e9) return "Mid cap";
        return "Small cap";
      case "P/E Ratio":
      case "Forward P/E":
        if (raw <= 0) return "";
        if (raw < 15) return "Cheap";
        if (raw <= 30) return "Fair";
        return "Expensive";
      case "P/VP":
        if (raw < 1) return "Below book";
        if (raw <= 3) return "Fair";
        return "Premium";
      case "EPS":
        return raw > 0 ? "Profitable" : "Unprofitable";
      case "Dividend Yield":
        if (raw < 0.02) return "Low";
        if (raw <= 0.04) return "Moderate";
        return "High";
      case "Beta":
        if (raw < 0.8) return "Low vol";
        if (raw <= 1.2) return "Market";
        return "Volatile";
      default:
        return "";
    }
  };

  const convertPrice = (value: number | null): number | null => {
    if (value === null) return null;
    return convertAmount(value, quote.currency, currency, exchangeRate);
  };

  const formatPrice = (value: number | null): string => {
    const converted = convertPrice(value);
    if (converted === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "BRL" ? "BRL" : "USD",
      maximumFractionDigits: 2,
    }).format(converted);
  };

  const formatValue = (value: number | null): string => {
    if (value === null) return "—";
    const abs = Math.abs(value);
    const formatted = abs < 1 ? value.toFixed(3) : abs < 100 ? value.toFixed(2) : value.toFixed(0);
    return formatted;
  };

  const formatMarketCap = (value: number | null): string => {
    if (value === null) return "—";
    const converted = convertPrice(value);
    if (converted === null) return "—";
    const sym = currency === "BRL" ? "R$" : "$";
    if (Math.abs(converted) >= 1e12) return `${sym}${(converted / 1e12).toFixed(2)}T`;
    if (Math.abs(converted) >= 1e9) return `${sym}${(converted / 1e9).toFixed(2)}B`;
    if (Math.abs(converted) >= 1e6) return `${sym}${(converted / 1e6).toFixed(2)}M`;
    return `${sym}${converted.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  };

  const numericMetrics: { label: string; value: number | null; format: (v: number | null) => string }[] = [
    { label: "Market Cap", value: quote.market_cap, format: formatMarketCap },
    { label: "P/E Ratio", value: quote.pe_ratio, format: formatValue },
    { label: "Forward P/E", value: quote.forward_pe, format: formatValue },
    { label: "P/VP", value: quote.price_to_book, format: formatValue },
    { label: "EPS", value: quote.eps, format: formatPrice },
    {
      label: "Dividend Yield",
      value: quote.dividend_yield,
      format: (v) => (v === null ? "—" : `${(v * 100).toFixed(2)}%`),
    },
    { label: "Beta", value: quote.beta, format: formatValue },
    { label: "52W High", value: quote.week_52_high, format: formatPrice },
    { label: "52W Low", value: quote.week_52_low, format: formatPrice },
  ];

  return (
    <div className="bg-neutral-950 rounded-lg p-6 border border-neutral-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Fundamentals</h2>
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-xs px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition"
        >
          {showContext ? "Hide context" : "Show context"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {numericMetrics.map((metric) => {
          const converted = convertPrice(metric.value);
          const context = getContext(metric.label, metric.value, converted);
          return (
            <div key={metric.label} className="text-sm">
              <div className="text-neutral-500 text-xs mb-1">{metric.label}</div>
              <div className="text-white font-medium text-sm">{metric.format(metric.value)}</div>
              {context && <div className="text-neutral-400 text-xs mt-1">{context}</div>}
            </div>
          );
        })}

        {/* Sector rendered separately — string value, no conversion */}
        <div className="text-sm">
          <div className="text-neutral-500 text-xs mb-1">Sector</div>
          <div className="text-white font-medium text-sm">{quote.sector || "—"}</div>
        </div>
      </div>
    </div>
  );
}
