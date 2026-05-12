"use client";

import React, { useState } from "react";
import { Holding } from "@/lib/types";
import { useCurrencyStore } from "@/lib/currency-store";
import { convertAmount } from "@/lib/utils/currency";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteHolding } from "@/lib/api";
import { useRouter } from "next/navigation";

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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const removeMutation = useMutation({
    mutationFn: () => deleteHolding(holding.ticker),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["holdings"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio-history"] }),
      ]);
      router.push("/portfolio");
    },
  });

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

      {/* Remove Position */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {!confirmOpen ? (
          <button
            onClick={() => setConfirmOpen(true)}
            style={{
              fontSize: 12, padding: "6px 12px", borderRadius: 6,
              border: "1px solid rgba(224,123,108,0.3)",
              background: "transparent", color: "#e07b6c",
              cursor: "pointer", fontFamily: "var(--font-mono)",
            }}
          >
            Remove position
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "rgba(245,241,232,0.6)" }}>
              Delete all {holding.ticker} shares? This cannot be undone.
            </span>
            <button
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
              style={{
                fontSize: 12, padding: "5px 10px", borderRadius: 5,
                border: "none", background: "#e07b6c", color: "#0c0b08",
                fontWeight: 700, cursor: removeMutation.isPending ? "not-allowed" : "pointer",
                fontFamily: "var(--font-mono)", opacity: removeMutation.isPending ? 0.6 : 1,
              }}
            >
              {removeMutation.isPending ? "Removing…" : "Confirm"}
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              style={{
                fontSize: 12, padding: "5px 10px", borderRadius: 5,
                border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                color: "rgba(245,241,232,0.5)", cursor: "pointer", fontFamily: "var(--font-mono)",
              }}
            >
              Cancel
            </button>
          </div>
        )}
        {removeMutation.isError && (
          <div style={{ marginTop: 6, fontSize: 12, color: "#e07b6c" }}>Failed to remove. Try again.</div>
        )}
      </div>
    </div>
  );
}
