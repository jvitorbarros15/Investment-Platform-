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

  const getContext = (label: string, value: number | null): string => {
    if (!showContext || value === null) return "";

    switch (label) {
      case "Market Cap":
        if (value > 200e9) return "Large cap";
        if (value > 10e9) return "Mid cap";
        return "Small cap";
      case "P/E Ratio":
      case "Forward P/E":
        if (value < 15) return "Cheap";
        if (value <= 30) return "Fair";
        return "Expensive";
      case "P/VP":
        if (value < 1) return "Below book";
        if (value <= 3) return "Fair";
        return "Premium";
      case "EPS":
        return value > 0 ? "Profitable" : "Unprofitable";
      case "Dividend Yield":
        if (value < 0.02) return "Low";
        if (value <= 0.04) return "Moderate";
        return "High";
      case "Beta":
        if (value < 0.8) return "Low vol";
        if (value <= 1.2) return "Market";
        return "Volatile";
      default:
        return "";
    }
  };

  const formatPrice = (value: number | null): string => {
    if (value === null) return "—";
    const converted = convertAmount(value, quote.currency, currency, exchangeRate);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "BRL" ? "BRL" : "USD",
      maximumFractionDigits: 2,
    }).format(converted);
  };

  const formatValue = (value: number | null): string => {
    if (value === null) return "—";
    if (value < 1) return value.toFixed(3);
    if (value < 100) return value.toFixed(2);
    return value.toFixed(0);
  };

  const metrics = [
    { label: "Market Cap", value: quote.market_cap, format: formatPrice },
    { label: "P/E Ratio", value: quote.pe_ratio, format: formatValue },
    { label: "Forward P/E", value: quote.forward_pe, format: formatValue },
    { label: "P/VP", value: quote.price_to_book, format: formatValue },
    { label: "EPS", value: quote.eps, format: formatPrice },
    { label: "Dividend Yield", value: quote.dividend_yield, format: (v) => (v === null ? "—" : `${(v * 100).toFixed(2)}%`) },
    { label: "Beta", value: quote.beta, format: formatValue },
    { label: "52W High", value: quote.week_52_high, format: formatPrice },
    { label: "52W Low", value: quote.week_52_low, format: formatPrice },
    { label: "Sector", value: quote.sector || "—", format: (v) => String(v) },
  ];

  return (
    <div className="bg-neutral-950 rounded-lg p-6 border border-neutral-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Fundamentals</h2>
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-xs px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition"
        >
          {showContext ? "Context" : "Raw"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {metrics.map((metric, idx) => (
          <div key={idx} className="text-sm">
            <div className="text-neutral-500 text-xs mb-1">{metric.label}</div>
            <div className="text-white font-medium text-sm">
              {metric.format(metric.value)}
            </div>
            {getContext(metric.label, metric.value) && (
              <div className="text-neutral-400 text-xs mt-1">
                {getContext(metric.label, metric.value)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
