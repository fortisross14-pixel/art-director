/** §64,200 -> §64k, §1,250,000 -> §1.3M */
export function compact(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (a >= 1e6) return `${sign}§${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e4) return `${sign}§${Math.round(a / 1e3)}k`;
  return `${sign}§${Math.round(a).toLocaleString()}`;
}
