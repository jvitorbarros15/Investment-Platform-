"use client";

import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransaction } from "@/lib/api";

interface QuickAddModalProps {
  onClose: () => void;
  initialTicker?: string;
  initialPrice?: number;
  initialCurrency?: "BRL" | "USD";
}

const OVERLAY: CSSProperties = {
  position: "fixed", inset: 0, zIndex: 200,
  background: "rgba(22,32,45,0.5)", backdropFilter: "blur(2px)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const PANEL: CSSProperties = {
  background: "var(--color-paper)", border: "1px solid var(--color-ink)",
  borderRadius: 0, padding: 28, width: "100%", maxWidth: 420,
  boxShadow: "6px 6px 0 var(--color-ink)",
};

const INPUT: CSSProperties = {
  width: "100%", height: 38, borderRadius: 0,
  border: "1px solid var(--color-ink)", background: "var(--color-paper-2)",
  color: "var(--color-ink)", padding: "0 10px",
  fontFamily: "var(--font-mono)", fontSize: 13, outline: "none",
  boxSizing: "border-box",
};

const LABEL: CSSProperties = { display: "grid", gap: 6 };
const LABEL_TEXT: CSSProperties = { color: "var(--color-ink-3)", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-mono)" };

export function QuickAddModal({ onClose, initialTicker = "", initialPrice, initialCurrency = "BRL" }: QuickAddModalProps) {
  const queryClient = useQueryClient();
  const [ticker, setTicker] = useState(initialTicker);
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(initialPrice !== undefined ? String(initialPrice) : "");
  const [currency, setCurrency] = useState<"BRL" | "USD">(initialCurrency);
  const [error, setError] = useState("");

  const addTx = useMutation({
    mutationFn: createTransaction,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["holdings"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio-history"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanTicker = ticker.trim().toUpperCase();
    const qty = Number(quantity);
    const px = Number(price);
    if (!cleanTicker || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(px) || px <= 0) {
      setError("Enter a valid ticker, quantity, and price.");
      return;
    }
    setError("");
    addTx.mutate({ ticker: cleanTicker, transaction_type: type, quantity: qty, price: px, currency });
  };

  return (
    <div style={OVERLAY} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={PANEL}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--color-ink)" }}>Add Transaction</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-ink-3)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          {/* BUY / SELL toggle */}
          <div style={{ display: "flex", border: "1px solid var(--color-ink)", overflow: "hidden" }}>
            {(["BUY", "SELL"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} style={{
                flex: 1, height: 36, border: "none", cursor: "pointer", fontSize: 12,
                fontFamily: "var(--font-mono)", letterSpacing: "0.08em", fontWeight: 600,
                background: type === t ? (t === "BUY" ? "var(--color-teal)" : "var(--color-crimson)") : "transparent",
                color: type === t ? "var(--color-paper)" : "var(--color-ink-3)",
              }}>{t}</button>
            ))}
          </div>

          <label style={LABEL}>
            <span style={LABEL_TEXT}>TICKER</span>
            <input
              style={INPUT} value={ticker} placeholder="e.g. AAPL, PETR4"
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              autoFocus={!initialTicker}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={LABEL}>
              <span style={LABEL_TEXT}>QUANTITY</span>
              <input style={INPUT} type="number" min="0" step="any" value={quantity} placeholder="0" onChange={(e) => setQuantity(e.target.value)} autoFocus={!!initialTicker} />
            </label>
            <label style={LABEL}>
              <span style={LABEL_TEXT}>PRICE</span>
              <input style={INPUT} type="number" min="0" step="any" value={price} placeholder="0.00" onChange={(e) => setPrice(e.target.value)} />
            </label>
          </div>

          {/* Currency toggle */}
          <div style={{ display: "flex", border: "1px solid var(--color-ink)", overflow: "hidden" }}>
            {(["BRL", "USD"] as const).map((c) => (
              <button key={c} type="button" onClick={() => setCurrency(c)} style={{
                flex: 1, height: 32, border: "none", cursor: "pointer", fontSize: 11,
                fontFamily: "var(--font-mono)", fontWeight: 600,
                background: currency === c ? "var(--color-ink)" : "transparent",
                color: currency === c ? "var(--color-paper)" : "var(--color-ink-3)",
              }}>{c}</button>
            ))}
          </div>

          {error && <span style={{ color: "var(--color-crimson)", fontSize: 12 }}>{error}</span>}
          {addTx.isError && <span style={{ color: "var(--color-crimson)", fontSize: 12 }}>Failed to save. Try again.</span>}

          <button type="submit" disabled={addTx.isPending} style={{
            height: 40, border: "1px solid var(--color-terracotta-2)", cursor: "pointer",
            background: "#cc5230", color: "var(--color-paper)",
            fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13,
            opacity: addTx.isPending ? 0.6 : 1, borderRadius: 0,
          }}>
            {addTx.isPending ? "Saving…" : `Confirm ${type}`}
          </button>
        </form>
      </div>
    </div>
  );
}
