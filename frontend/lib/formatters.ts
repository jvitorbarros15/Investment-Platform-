export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPct(value: number, showSign = true): string {
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatCurrency(value: number, currency: "BRL" | "USD"): string {
  return currency === "BRL" ? formatBRL(value) : formatUSD(value);
}

export function getReturnColor(pct: number): string {
  if (pct > 0) return "text-gain";
  if (pct < 0) return "text-loss";
  return "text-[#8892A4]";
}

export function getReturnSign(pct: number): string {
  return pct > 0 ? "▲" : pct < 0 ? "▼" : "—";
}

export function assetClassLabel(cls: string): string {
  const map: Record<string, string> = {
    BR_STOCK: "Ação BR",
    US_STOCK: "US Stock",
    FII: "FII",
    CRYPTO: "Crypto",
    ETF: "ETF",
    CASH: "Cash",
  };
  return map[cls] || cls;
}

export function assetClassColor(cls: string): string {
  const map: Record<string, string> = {
    BR_STOCK: "#C9963C",
    FII: "#3B82F6",
    US_STOCK: "#8B5CF6",
    CRYPTO: "#10B981",
    ETF: "#F59E0B",
    CASH: "#6B7280",
  };
  return map[cls] || "#4A5568";
}

export function watchlistStatusColor(status: string): string {
  const map: Record<string, string> = {
    STUDYING: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    WAITING_PRICE: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    STRONG_CANDIDATE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    AVOID: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    BOUGHT: "bg-[#C9963C]/15 text-[#C9963C] border-[#C9963C]/30",
  };
  return map[status] || "bg-gray-500/15 text-gray-400";
}

export function watchlistStatusLabel(status: string): string {
  const map: Record<string, string> = {
    STUDYING: "Studying",
    WAITING_PRICE: "Waiting Price",
    STRONG_CANDIDATE: "Strong Candidate",
    AVOID: "Avoid",
    BOUGHT: "Bought",
  };
  return map[status] || status;
}
