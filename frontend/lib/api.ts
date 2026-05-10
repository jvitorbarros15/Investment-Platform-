import axios from "axios";
import { useAuthStore } from "./auth-store";
import type { AssetSearchResult, MarketIndex } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getPortfolioSummary() {
  const { data } = await api.get("/portfolio/summary");
  return data;
}

export async function getHoldings() {
  const { data } = await api.get("/portfolio/holdings");
  return data;
}

export async function getAllocation() {
  const { data } = await api.get("/portfolio/allocation");
  return data;
}

export async function getTransactions() {
  const { data } = await api.get("/transactions/");
  return data;
}

export async function getWatchlist() {
  const { data } = await api.get("/watchlist/");
  return data;
}

export async function getAlerts() {
  const { data } = await api.get("/alerts/");
  return data;
}

export async function getPhilosophy() {
  const { data } = await api.get("/philosophy/");
  return data;
}

export async function updatePhilosophy(id: string, weights: Record<string, number>) {
  const { data } = await api.put(`/philosophy/${id}`, weights);
  return data;
}

export async function refreshPrices(force = false) {
  const { data } = await api.post(`/market/refresh${force ? "?force=true" : ""}`);
  return data as { attempted: number; updated: number; skipped: number; cached?: boolean; message: string; usd_to_brl?: number };
}

export async function getPortfolioHistory(period = "30d") {
  const { data } = await api.get(`/portfolio/history?period=${period}`);
  return data as { date: string; value: number }[];
}

export async function searchAssets(query: string) {
  if (!query.trim()) return [] as AssetSearchResult[];
  const { data } = await api.get(`/assets/search?q=${encodeURIComponent(query.trim())}`);
  return data as AssetSearchResult[];
}

export async function getMarketIndexes() {
  const { data } = await api.get("/market/indexes");
  return data as MarketIndex[];
}

export async function markAlertRead(id: string) {
  const { data } = await api.post(`/alerts/mark-read/${id}`);
  return data;
}

export async function addWatchlistItem(item: { ticker: string; target_price?: number; status?: string; reason?: string; notes?: string }) {
  const { data } = await api.post("/watchlist/", item);
  return data;
}

export async function deleteWatchlistItem(id: string) {
  await api.delete(`/watchlist/${id}`);
}

export async function createTransaction(tx: {
  ticker: string;
  transaction_type: string;
  quantity: number;
  price: number;
  fees?: number;
  currency?: string;
  notes?: string;
}) {
  const { data } = await api.post("/transactions/", tx);
  return data;
}

export async function getAssetDetail(ticker: string) {
  const { data } = await api.get(`/market/quote/${encodeURIComponent(ticker)}`);
  return data;
}

export async function getAssetHistory(ticker: string, period = "30d") {
  const { data } = await api.get(`/market/history/${encodeURIComponent(ticker)}?period=${period}`);
  return data;
}
