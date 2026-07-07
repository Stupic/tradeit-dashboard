import type { DashboardOverview, TrendPoint } from "./types";

// ── 목업 데이터 생성 ──────────────────────────────────────────────
// 백엔드 완성 전까지 사용. 응답 스키마는 실제 API(overview)와 동일하므로
// 나중에 이 파일 대신 실제 fetch로만 바꾸면 된다.

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// baseDate 기준 최근 n일 시계열 생성 (완만한 상승 + 잡음)
function makeTrend(base: Date, days: number, start: number, end: number, jitter: number): TrendPoint[] {
  const out: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const t = (days - 1 - i) / Math.max(1, days - 1);
    const trend = start + (end - start) * t;
    const noise = (Math.random() - 0.5) * 2 * jitter;
    out.push({ date: ymd(d), value: Math.max(0, Math.round(trend + noise)) });
  }
  return out;
}

// 소폭 변동 (폴링 시 살아있는 느낌)
const wobble = (v: number, pct = 0.04) => Math.round(v * (1 + (Math.random() - 0.5) * pct));

export function buildMockOverview(opts?: {
  baseDate?: string;
  trendDays?: number;
  visitSource?: "CRM" | "ADMIN";
}): DashboardOverview {
  const trendDays = opts?.trendDays ?? 7;
  const base = opts?.baseDate ? new Date(opts.baseDate + "T00:00:00") : new Date();
  const now = new Date();

  const membersTrend = makeTrend(base, trendDays, 8200, 12560, 900);
  const revenueTrend = makeTrend(base, trendDays, 22_000, 55_200, 6_000);
  const paymentsTrend = makeTrend(base, trendDays, 1150, 1287, 350);
  const visitsTrend = makeTrend(base, trendDays, 6100, 8720, 700);

  const revThisMonth = 32_450;
  const composition = [
    { key: "SUBSCRIPTION", label: "구독 결제", ratio: 56.2 },
    { key: "ONE_TIME", label: "단일 결제", ratio: 28.7 },
    { key: "ETC", label: "기타", ratio: 15.1 },
  ].map((c) => ({ ...c, amount: Math.round((revThisMonth * c.ratio) / 100) }));

  return {
    baseDate: ymd(base),
    serverTime: now.toISOString(),
    currency: "USD",
    members: { total: 128_560, thisMonth: 3_245, today: wobble(128, 0.1), changeRate: 12.4 },
    payments: { total: 45_230, thisMonth: 1_287, today: wobble(56, 0.12), changeRate: 8.7 },
    revenue: { total: 1_245_670, thisMonth: revThisMonth, today: wobble(1_680, 0.08), changeRate: 15.3 },
    activeUsers: { today: wobble(2_345, 0.05), changeRate: 7.2 },
    visits: {
      source: opts?.visitSource ?? "CRM",
      pvToday: wobble(8_720, 0.06),
      uvToday: wobble(2_103, 0.05),
      uvByIpToday: wobble(2_540, 0.05),
      changeRate: 5.1,
    },
    trends: { members: membersTrend, revenue: revenueTrend, payments: paymentsTrend, visits: visitsTrend },
    revenueComposition: { total: revThisMonth, items: composition },
  };
}
