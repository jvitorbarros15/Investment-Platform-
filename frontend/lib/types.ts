export type AssetClass = "BR_STOCK" | "US_STOCK" | "FII" | "CRYPTO" | "ETF" | "CASH";
export type Currency = "BRL" | "USD";
export type WatchlistStatus = "STUDYING" | "WAITING_PRICE" | "STRONG_CANDIDATE" | "AVOID" | "BOUGHT";

export interface Holding {
  ticker: string;
  name: string;
  asset_class: AssetClass;
  currency: Currency;
  current_value: number;
  total_gain: number;
  return_pct: number;
  sector?: string;
  weight_in_class?: number;
  quantity?: number;
  average_cost?: number;
  current_price?: number;
}

export interface AllocationItem {
  name: string;
  value: number;
  pct: number;
  color: string;
}

export interface PortfolioSummary {
  total_value_brl: number;
  total_invested_brl: number;
  total_gain_brl: number;
  total_return_pct: number;
  usd_to_brl: number;
  allocation: AllocationItem[];
  top_gainers: Holding[];
  top_losers: Holding[];
}

export interface WatchlistItem {
  id: string;
  ticker: string;
  target_price?: number;
  status: WatchlistStatus;
  reason?: string;
  notes?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  ticker: string;
  transaction_type: string;
  date: string;
  quantity: number;
  price: number;
  gross_amount: number;
  fees: number;
  currency: Currency;
  notes?: string;
}

export interface AlertEvent {
  id: string;
  ticker?: string;
  message: string;
  triggered_at: string;
  is_read: boolean;
}

export interface PhilosophyProfile {
  id: string;
  name: string;
  quality_weight: number;
  value_weight: number;
  growth_weight: number;
  dividend_weight: number;
  financial_health_weight: number;
  momentum_weight: number;
  risk_weight: number;
  portfolio_fit_weight: number;
}
