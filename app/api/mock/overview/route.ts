import { NextRequest, NextResponse } from "next/server";
import { buildMockOverview } from "@/lib/mock";
import type { ApiResponse, DashboardOverview } from "@/lib/types";

// 목업 엔드포인트: GET /api/mock/overview
// 실제 백엔드(GET :801/api/admin/dashboard/overview)와 동일한 형태로 응답한다.
// 연동 시 프론트의 fetch URL만 실제 주소로 교체하면 된다.
export const dynamic = "force-dynamic"; // 매 요청 최신 값(폴링용)

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = buildMockOverview({
    baseDate: searchParams.get("date") ?? undefined,
    trendDays: searchParams.get("trendDays") ? Number(searchParams.get("trendDays")) : undefined,
    visitSource: (searchParams.get("visitSource") as "CRM" | "ADMIN") ?? undefined,
  });

  const body: ApiResponse<DashboardOverview> = {
    status: 200,
    code: "common.SUCCESS",
    message: null,
    data,
  };
  return NextResponse.json(body);
}
