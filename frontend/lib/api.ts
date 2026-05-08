import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("invest_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
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

export async function refreshPrices() {
  const { data } = await api.post("/market/refresh");
  return data;
}

export async function getPortfolioHistory(period = "30d") {
  const { data } = await api.get(`/portfolio/history?period=${period}`);
  return data as { date: string; value: number }[];
}

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  return data as { access_token: string };
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
  const { data } = await api.get(`/assets/${ticker}`);
  return data;
}

export async function getAssetHistory(ticker: string, period = "30d") {
  const { data } = await api.get(`/assets/${ticker}/history?period=${period}`);
  return data;
}
