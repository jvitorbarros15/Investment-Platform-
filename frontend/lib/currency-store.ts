import { create } from "zustand";
import type { Currency } from "./types";

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: "BRL",
  setCurrency: (currency) => {
    if (typeof window !== "undefined") localStorage.setItem("invest_currency", currency);
    set({ currency });
  },
}));

if (typeof window !== "undefined") {
  const stored = localStorage.getItem("invest_currency");
  if (stored === "BRL" || stored === "USD") {
    useCurrencyStore.setState({ currency: stored });
  }
}
