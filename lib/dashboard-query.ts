import "server-only";
import { query, queryOne } from "./db";
import type { DashboardOverview, TrendPoint } from "./types";

// ── 날짜 헬퍼 (KST 라벨 기준, DB 세션 tz도 +09:00) ──────────────
function kstToday(base?: string): string {
  const d = base ? new Date(base + "T00:00:00+09:00") : new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
}
function ymdUTC(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function addDays(ymd: string, n: number): string {
  const dt = ymdUTC(ymd);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
const monthStartOf = (ymd: string) => `${ymd.slice(0, 7)}-01 00:00:00`;

// ── 숫자 변환 (mysql2는 BIGINT/DECIMAL을 문자열로 반환) ─────────
const num = (v: any): number => (v == null ? 0 : Number(v));
function rate(today: number, yesterday: number): number {
  if (yesterday === 0) return 0;
  return Math.round(((today - yesterday) / yesterday) * 1000) / 10;
}

// 추이: 결측일 0 보정
async function trend(
  sql: string,
  params: any[],
  from: string,
  today: string,
  days: number,
): Promise<TrendPoint[]> {
  const rows = await query<{ d: string; v: any }>(sql, params);
  const byDate = new Map<string, number>();
  for (const r of rows) byDate.set(String(r.d), num(r.v));
  const out: TrendPoint[] = [];
  for (let i = Math.max(1, days) - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    out.push({ date: d, value: byDate.get(d) ?? 0 });
  }
  return out;
}

export async function getOverview(opts?: {
  date?: string;
  trendDays?: number;
  visitSource?: "CRM" | "ADMIN";
}): Promise<DashboardOverview> {
  const today = kstToday(opts?.date);
  const yesterday = addDays(today, -1);
  const monthStart = monthStartOf(today);
  const trendDays = opts?.trendDays ?? 7;
  const trendFrom = addDays(today, -(Math.max(1, trendDays) - 1));
  const trendFromDt = `${trendFrom} 00:00:00`;
  const source = opts?.visitSource ?? "CRM";

  const [
    membersRow,
    paymentsRow,
    revenueRow,
    activeRow,
    visitsRow,
    compRows,
    membersTrend,
    revenueTrend,
    paymentsTrend,
    visitsTrend,
  ] = await Promise.all([
    // 회원가입수 (users)
    queryOne<any>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS m,
         SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) AS t,
         SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) AS y
       FROM users
       WHERE status <> 'WITHDRAWN' AND deleted_at IS NULL`,
      [monthStart, today, yesterday],
    ),
    // 결제건수 (payment_histories, COMPLETED)
    queryOne<any>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS m,
         SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) AS t,
         SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) AS y
       FROM payment_histories
       WHERE payment_status = 'COMPLETED'`,
      [monthStart, today, yesterday],
    ),
    // 총수익 (payment_histories.amount)
    queryOne<any>(
      `SELECT
         COALESCE(SUM(amount), 0) AS total,
         COALESCE(SUM(CASE WHEN created_at >= ? THEN amount ELSE 0 END), 0) AS m,
         COALESCE(SUM(CASE WHEN DATE(created_at) = ? THEN amount ELSE 0 END), 0) AS t,
         COALESCE(SUM(CASE WHEN DATE(created_at) = ? THEN amount ELSE 0 END), 0) AS y
       FROM payment_histories
       WHERE payment_status = 'COMPLETED'`,
      [monthStart, today, yesterday],
    ),
    // 접속자 수 (users.last_login_at)
    queryOne<any>(
      `SELECT
         SUM(CASE WHEN DATE(last_login_at) = ? THEN 1 ELSE 0 END) AS t,
         SUM(CASE WHEN DATE(last_login_at) = ? THEN 1 ELSE 0 END) AS y
       FROM users
       WHERE last_login_at IS NOT NULL AND deleted_at IS NULL`,
      [today, yesterday],
    ),
    // 방문 트래픽 (page_visit_logs)
    queryOne<any>(
      `SELECT
         SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) AS pv,
         COUNT(DISTINCT CASE WHEN DATE(created_at) = ? THEN login_id END) AS uvLogin,
         COUNT(DISTINCT CASE WHEN DATE(created_at) = ? THEN ip END) AS uvIp,
         SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) AS pvYday
       FROM page_visit_logs
       WHERE source = ? AND created_at >= ? AND created_at < ?`,
      [today, today, today, yesterday, source, `${yesterday} 00:00:00`, `${addDays(today, 1)} 00:00:00`],
    ),
    // 매출 구성 (이번 달, 등급별)
    query<any>(
      `SELECT g.grade_code AS k, g.grade_name AS label, COALESCE(SUM(ph.amount), 0) AS amount
       FROM payment_histories ph
       JOIN subscriptions s ON ph.subscription_id = s.id
       JOIN grades g ON s.grade_id = g.id
       WHERE ph.payment_status = 'COMPLETED' AND ph.created_at >= ?
       GROUP BY g.id, g.grade_code, g.grade_name
       ORDER BY amount DESC`,
      [monthStart],
    ),
    // 추이 4종
    trend(
      `SELECT DATE(created_at) d, COUNT(*) v FROM users
       WHERE created_at >= ? AND status <> 'WITHDRAWN' AND deleted_at IS NULL
       GROUP BY DATE(created_at)`,
      [trendFromDt], trendFrom, today, trendDays,
    ),
    trend(
      `SELECT DATE(created_at) d, COALESCE(SUM(amount), 0) v FROM payment_histories
       WHERE created_at >= ? AND payment_status = 'COMPLETED'
       GROUP BY DATE(created_at)`,
      [trendFromDt], trendFrom, today, trendDays,
    ),
    trend(
      `SELECT DATE(created_at) d, COUNT(*) v FROM payment_histories
       WHERE created_at >= ? AND payment_status = 'COMPLETED'
       GROUP BY DATE(created_at)`,
      [trendFromDt], trendFrom, today, trendDays,
    ),
    trend(
      `SELECT DATE(created_at) d, COUNT(*) v FROM page_visit_logs
       WHERE created_at >= ? AND source = ?
       GROUP BY DATE(created_at)`,
      [trendFromDt, source], trendFrom, today, trendDays,
    ),
  ]);

  // 매출 구성 비율 계산
  const compTotal = compRows.reduce((s, r) => s + num(r.amount), 0);
  const compItems = compRows.map((r) => ({
    key: r.k as string,
    label: r.label as string,
    amount: num(r.amount),
    ratio: compTotal === 0 ? 0 : Math.round((num(r.amount) / compTotal) * 1000) / 10,
  }));

  const mToday = num(membersRow?.t), mYday = num(membersRow?.y);
  const pToday = num(paymentsRow?.t), pYday = num(paymentsRow?.y);
  const rToday = num(revenueRow?.t), rYday = num(revenueRow?.y);
  const aToday = num(activeRow?.t), aYday = num(activeRow?.y);
  const vPv = num(visitsRow?.pv), vPvYday = num(visitsRow?.pvYday);

  return {
    baseDate: today,
    serverTime: new Date().toISOString(),
    currency: "USD",
    members: {
      total: num(membersRow?.total),
      thisMonth: num(membersRow?.m),
      today: mToday,
      changeRate: rate(mToday, mYday),
    },
    payments: {
      total: num(paymentsRow?.total),
      thisMonth: num(paymentsRow?.m),
      today: pToday,
      changeRate: rate(pToday, pYday),
    },
    revenue: {
      total: num(revenueRow?.total),
      thisMonth: num(revenueRow?.m),
      today: rToday,
      changeRate: rate(rToday, rYday),
    },
    activeUsers: { today: aToday, changeRate: rate(aToday, aYday) },
    visits: {
      source,
      pvToday: vPv,
      uvToday: num(visitsRow?.uvLogin),
      uvByIpToday: num(visitsRow?.uvIp),
      changeRate: rate(vPv, vPvYday),
    },
    trends: {
      members: membersTrend,
      revenue: revenueTrend,
      payments: paymentsTrend,
      visits: visitsTrend,
    },
    revenueComposition: { total: compTotal, items: compItems },
  };
}
