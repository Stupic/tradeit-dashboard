"use client";

import useSWR from "swr";
import type { ApiResponse, DashboardOverview } from "./types";

// 폴링 주기 (ms). 30초. 요구사항: 30초~1분마다 갱신.
export const REFRESH_INTERVAL = 30_000;

// 기본: Next.js가 MariaDB를 직접 조회하는 실 DB 라우트.
// (목업으로 보고 싶으면 /api/mock/overview 로 바꾸면 됨)
const QUERY = "trendDays=7&visitSource=CRM";
const ENDPOINT = `/api/dashboard/overview?${QUERY}`;

async function fetcher(url: string): Promise<DashboardOverview> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  const json: ApiResponse<DashboardOverview> = await res.json();
  return json.data;
}

export function useDashboard() {
  const { data, error, isLoading } = useSWR<DashboardOverview>(ENDPOINT, fetcher, {
    refreshInterval: REFRESH_INTERVAL,
    revalidateOnFocus: true,
    keepPreviousData: true, // 갱신 시 깜빡임 방지
  });

  return { data, error, isLoading };
}
