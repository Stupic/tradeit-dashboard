// API 명세(docs/dashboard-spec.md §4.2)의 GET /api/admin/dashboard/overview 응답 스키마.
// 백엔드 연동 시 이 타입을 그대로 사용하고, mock 대신 실제 엔드포인트만 교체하면 된다.

export interface MetricBlock {
  total: number;
  thisMonth: number;
  today: number;
  changeRate: number; // 오늘 vs 어제 (%)
}

export interface ActiveUsers {
  today: number;
  changeRate: number;
}

export interface Visits {
  source: "CRM" | "ADMIN";
  pvToday: number;
  uvToday: number;
  uvByIpToday: number;
  changeRate: number;
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface Trends {
  members: TrendPoint[];
  revenue: TrendPoint[];
  payments: TrendPoint[];
  visits: TrendPoint[];
}

export interface RevenueCompositionItem {
  key: string;
  label: string;
  amount: number;
  ratio: number; // %
}

export interface RevenueComposition {
  total: number;
  items: RevenueCompositionItem[];
}

export interface DashboardOverview {
  baseDate: string;
  serverTime: string; // ISO8601 with offset
  currency: string; // "USD" | "KRW"
  members: MetricBlock;
  payments: MetricBlock;
  revenue: MetricBlock;
  activeUsers: ActiveUsers;
  visits: Visits;
  trends: Trends;
  revenueComposition: RevenueComposition;
}

// 프로젝트 표준 응답 래퍼 (core/vo/ApiResponse.java)
export interface ApiResponse<T> {
  status: number;
  code: string;
  message: string | null;
  data: T;
}
