import { NextRequest, NextResponse } from "next/server";
import { getOverview } from "@/lib/dashboard-query";
import type { ApiResponse, DashboardOverview } from "@/lib/types";

// 실 DB 조회 엔드포인트: GET /api/dashboard/overview
// MariaDB(taas-v2)를 서버 사이드에서 직접 집계. Node 런타임 필수.
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // 매 요청 최신 값(폴링용)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  try {
    const data = await getOverview({
      date: searchParams.get("date") ?? undefined,
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
  } catch (err: any) {
    console.error("[dashboard/overview] query failed:", err?.message ?? err);
    return NextResponse.json(
      { status: 500, code: "common.ERROR", message: err?.message ?? "query failed", data: null },
      { status: 500 },
    );
  }
}
