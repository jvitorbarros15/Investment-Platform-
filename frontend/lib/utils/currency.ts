/**
 * Convert a monetary value between USD and BRL.
 * - Same currency: no-op
 * - USD → BRL: multiply by rate
 * - BRL → USD: divide by rate
 */
export function convertAmount(
  value: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number
): number {
  if (fromCurrency === toCurrency) return value;
  if (fromCurrency === "USD" && toCurrency === "BRL") return value * rate;
  if (fromCurrency === "BRL" && toCurrency === "USD") return value / rate;
  return value;
}
