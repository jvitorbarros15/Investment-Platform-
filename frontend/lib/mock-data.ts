import type { AlertEvent, Holding, PortfolioSummary, WatchlistItem } from "./types";

export const MOCK_HOLDINGS: Holding[] = [
  { ticker: "BBAS3", name: "Banco do Brasil S/A", asset_class: "BR_STOCK", currency: "BRL", current_value: 2768.60, total_gain: 711.42, return_pct: 25.69, sector: "Financials", weight_in_class: 35.07 },
  { ticker: "BBSE3", name: "BB Seguridade S/A", asset_class: "BR_STOCK", currency: "BRL", current_value: 620.10, total_gain: 333.75, return_pct: 32.45, sector: "Insurance", weight_in_class: 7.85 },
  { ticker: "ISAE4", name: "ISA Energia", asset_class: "BR_STOCK", currency: "BRL", current_value: 4220.13, total_gain: 1288.89, return_pct: 41.44, sector: "Utilities", weight_in_class: 53.45 },
  { ticker: "TAEE11", name: "Transmissora Aliança de Energia", asset_class: "BR_STOCK", currency: "BRL", current_value: 286.79, total_gain: 343.87, return_pct: 51.02, sector: "Utilities", weight_in_class: 3.63 },
  { ticker: "KNCR11", name: "FII Kinea RI", asset_class: "FII", currency: "BRL", current_value: 746.34, total_gain: 531.38, return_pct: 61.69, sector: "Real Estate", weight_in_class: 34.88 },
  { ticker: "MFII11", name: "FII Merito I", asset_class: "FII", currency: "BRL", current_value: 1393.68, total_gain: 688.44, return_pct: 14.62, sector: "Real Estate", weight_in_class: 65.12 },
  { ticker: "IONQ", name: "IonQ Inc", asset_class: "US_STOCK", currency: "USD", current_value: 93.63, total_gain: -6.65, return_pct: -6.63, sector: "Quantum Computing", weight_in_class: 40.0 },
  { ticker: "QBTS", name: "D-Wave Quantum Inc", asset_class: "US_STOCK", currency: "USD", current_value: 66.04, total_gain: -9.13, return_pct: -12.14, sector: "Quantum Computing", weight_in_class: 28.2 },
  { ticker: "NVDA", name: "Nvidia Corp", asset_class: "US_STOCK", currency: "USD", current_value: 44.61, total_gain: 4.61, return_pct: 11.53, sector: "Technology", weight_in_class: 19.0 },
  { ticker: "RGTI", name: "Rigetti Computing", asset_class: "US_STOCK", currency: "USD", current_value: 30.55, total_gain: -29.44, return_pct: -49.07, sector: "Quantum Computing", weight_in_class: 13.0 },
  { ticker: "BTC", name: "Bitcoin", asset_class: "CRYPTO", currency: "USD", current_value: 689.57, total_gain: 0, return_pct: -6.57, sector: "Crypto", quantity: 0.00849051, weight_in_class: 98.1 },
  { ticker: "XRP", name: "XRP", asset_class: "CRYPTO", currency: "USD", current_value: 12.96, total_gain: 0, return_pct: -1.77, sector: "Crypto", quantity: 9.162, weight_in_class: 1.8 },
  { ticker: "CRO", name: "Cronos", asset_class: "CRYPTO", currency: "USD", current_value: 0.22, total_gain: 0, return_pct: -0.17, sector: "Crypto", quantity: 3.1427, weight_in_class: 0.03 },
  { ticker: "PENGU", name: "Pudgy Penguins", asset_class: "CRYPTO", currency: "USD", current_value: 0.04, total_gain: 0, return_pct: -6.34, sector: "Crypto", quantity: 4.4027, weight_in_class: 0.005 },
  { ticker: "SHIB", name: "Shiba Inu", asset_class: "CRYPTO", currency: "USD", current_value: 0.01, total_gain: 0, return_pct: -1.04, sector: "Crypto", quantity: 2185.07, weight_in_class: 0.001 },
];

export const MOCK_SUMMARY: PortfolioSummary = {
  total_value_brl: 18294.60,
  total_invested_brl: 14784.47,
  total_gain_brl: 3510.13,
  total_return_pct: 23.74,
  usd_to_brl: 5.70,
  allocation: [
    { name: "BR Stocks", value: 7895.62, pct: 43.2, color: "#C9963C" },
    { name: "FIIs", value: 2140.02, pct: 11.7, color: "#3B82F6" },
    { name: "US Stocks", value: 1337.99, pct: 7.3, color: "#8B5CF6" },
    { name: "Crypto", value: 4016.57, pct: 22.0, color: "#10B981" },
    { name: "Other", value: 2904.40, pct: 15.9, color: "#4A5568" },
  ],
  top_gainers: [
    { ticker: "KNCR11", name: "FII Kinea RI", asset_class: "FII", currency: "BRL", current_value: 746.34, total_gain: 531.38, return_pct: 61.69 },
    { ticker: "TAEE11", name: "Transmissora Aliança", asset_class: "BR_STOCK", currency: "BRL", current_value: 286.79, total_gain: 343.87, return_pct: 51.02 },
    { ticker: "ISAE4", name: "ISA Energia", asset_class: "BR_STOCK", currency: "BRL", current_value: 4220.13, total_gain: 1288.89, return_pct: 41.44 },
  ],
  top_losers: [
    { ticker: "RGTI", name: "Rigetti Computing", asset_class: "US_STOCK", currency: "USD", current_value: 30.55, total_gain: -29.44, return_pct: -49.07 },
    { ticker: "QBTS", name: "D-Wave Quantum", asset_class: "US_STOCK", currency: "USD", current_value: 66.04, total_gain: -9.13, return_pct: -12.14 },
    { ticker: "IONQ", name: "IonQ Inc", asset_class: "US_STOCK", currency: "USD", current_value: 93.63, total_gain: -6.65, return_pct: -6.63 },
  ],
};

export const MOCK_WATCHLIST: WatchlistItem[] = [
  { id: "1", ticker: "VALE3", target_price: 85.00, status: "STUDYING", reason: "Iron ore + strong dividend yield", notes: "Waiting for better entry near 52w low.", created_at: "2025-03-01" },
  { id: "2", ticker: "MXRF11", target_price: 10.50, status: "WAITING_PRICE", reason: "FII with above-average yield", notes: "Target R$ 10.50 for good DY entry.", created_at: "2025-03-15" },
  { id: "3", ticker: "AAPL", target_price: 185.00, status: "STRONG_CANDIDATE", reason: "Services revenue + buyback machine", notes: "Strong margins, waiting for 10% pullback.", created_at: "2025-04-01" },
  { id: "4", ticker: "PETR4", target_price: 40.00, status: "STUDYING", reason: "High dividend but political risk", notes: "Monitor Petrobras dividend policy changes.", created_at: "2025-04-20" },
];

export const MOCK_ALERTS: AlertEvent[] = [
  { id: "1", ticker: "ISAE4", message: "ISAE4 reached return of +41.44% — consider reviewing your position.", triggered_at: "2025-05-07T10:30:00Z", is_read: false },
  { id: "2", ticker: "RGTI", message: "RGTI down -49.07% — review your investment thesis.", triggered_at: "2025-05-06T15:00:00Z", is_read: false },
  { id: "3", ticker: "KNCR11", message: "KNCR11 with exceptional return of +61.69%. Strong position.", triggered_at: "2025-05-05T09:00:00Z", is_read: true },
];

// Generate fake 30-day portfolio performance data
export function generatePortfolioHistory(finalValue: number = 18294.60) {
  const data = [];
  const startValue = finalValue * 0.87;
  const today = new Date("2025-05-07");
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const progress = (29 - i) / 29;
    const trend = startValue + (finalValue - startValue) * progress;
    const noise = (Math.random() - 0.48) * finalValue * 0.015;
    data.push({
      date: date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" }),
      value: Math.round((trend + noise) * 100) / 100,
    });
  }
  data[data.length - 1].value = finalValue;
  return data;
}
