// 표시 포맷 유틸

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

// 통화: currency 코드에 따라 기호/자릿수 처리 (USD/KRW 모두 지원)
export function formatCurrency(n: number, currency = "USD"): string {
  const fractionDigits = currency === "KRW" || currency === "JPY" ? 0 : 0;
  return new Intl.NumberFormat(currency === "KRW" ? "ko-KR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

// 큰 수 축약 (차트 축 라벨용): 55200 -> 55.2K, 1245670 -> 1.2M
export function compact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function formatPercent(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

// MM/DD (차트 X축용)
export function shortDate(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${m}/${d}`;
}

export function formatClock(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour12: false }); // HH:MM:SS
}
