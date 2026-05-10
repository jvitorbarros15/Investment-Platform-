import { create } from "zustand";
import type { StateCreator } from "zustand/vanilla";
import type { Currency } from "./types";

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const currencyStoreCreator: StateCreator<CurrencyState> = (set) => ({
  currency: "BRL",
  setCurrency: (currency: Currency) => {
    if (typeof window !== "undefined") localStorage.setItem("invest_currency", currency);
    set({ currency });
  },
});

export const useCurrencyStore = create<CurrencyState>(currencyStoreCreator);

if (typeof window !== "undefined") {
  const stored = localStorage.getItem("invest_currency");
  if (stored === "BRL" || stored === "USD") {
    useCurrencyStore.setState({ currency: stored });
  }
}
