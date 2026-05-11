"use client";

import React from "react";
import { Holding } from "@/lib/types";
import { useCurrencyStore } from "@/lib/currency-store";
import { convertAmount } from "@/lib/utils/currency";

interface StockPositionProps {
  holding: Holding;
}

export function StockPosition({ holding }: StockPositionProps) {
  const currency = useCurrencyStore((state) => state.currency);
  const exchangeRate = useCurrencyStore((state) => state.exchangeRate);

  const formatCurrency = (value: number): string => {
    const converted = convertAmount(value, holding.currency, currency, exchangeRate);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "BRL" ? "BRL" : "USD",
      maximumFractionDigits: 2,
    }).format(converted);
  };

  const plColor = (holding.unrealized_gain ?? 0) >= 0 ? "text-green-500" : "text-red-500";
  const plBgColor =
    (holding.unrealized_gain ?? 0) >= 0 ? "bg-green-950" : "bg-red-950";

  return (
    <div className="bg-neutral-950 rounded-lg p-6 border border-neutral-800">
      <h2 className="text-lg font-semibold mb-4">Your Position</h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div>
          <div className="text-neutral-500 text-xs mb-1">Quantity</div>
          <div className="text-white font-medium text-lg">
            {holding.quantity.toFixed(2)}
          </div>
        </div>

        <div>
          <div className="text-neutral-500 text-xs mb-1">Avg Cost</div>
          <div className="text-white font-medium text-lg">
            {formatCurrency(holding.average_cost)}
          </div>
        </div>

        <div>
          <div className="text-neutral-500 text-xs mb-1">Current Value</div>
          <div className="text-white font-medium text-lg">
            {formatCurrency(holding.current_value)}
          </div>
        </div>

        <div>
          <div className="text-neutral-500 text-xs mb-1">Unrealized P/L</div>
          <div className={`font-medium text-lg ${plColor}`}>
            {formatCurrency(holding.unrealized_gain ?? 0)}
          </div>
        </div>

        <div>
          <div className="text-neutral-500 text-xs mb-1">Return %</div>
          <div className={`font-medium text-lg ${plColor}`}>
            {holding.return_pct >= 0 ? "+" : ""}
            {holding.return_pct.toFixed(2)}%
          </div>
        </div>

        <div>
          <div className="text-neutral-500 text-xs mb-1">Weight</div>
          <div className="text-white font-medium text-lg">
            {holding.weight_in_class?.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className={`mt-4 p-3 rounded ${plBgColor}`}>
        <div className="text-xs text-neutral-400 mb-1">1-Day Change</div>
        <div className={`font-semibold text-sm ${plColor}`}>
          {(holding.change_1d ?? 0) >= 0 ? "+" : ""}
          {formatCurrency(holding.change_1d ?? 0)}
        </div>
      </div>
    </div>
  );
}
