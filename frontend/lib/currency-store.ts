import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getExchangeRate } from "./api";

export type Currency = "BRL" | "USD";

interface CurrencyStore {
  currency: Currency;
  exchangeRate: number;
  lastUpdated: Date | null;
  setCurrency: (currency: Currency) => void;
  fetchRate: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: "BRL",
      exchangeRate: 1.0,
      lastUpdated: null,
      setCurrency: (currency: Currency) => set({ currency }),
      fetchRate: async () => {
        try {
          const data = await getExchangeRate();
          set({ exchangeRate: data.rate, lastUpdated: new Date() });
        } catch (error) {
          console.error("Failed to fetch exchange rate:", error);
        }
      },
    }),
    {
      name: "invest_currency",
      partialize: (state) => ({ currency: state.currency }),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== "undefined") {
          state?.fetchRate();
        }
      },
    }
  )
);
