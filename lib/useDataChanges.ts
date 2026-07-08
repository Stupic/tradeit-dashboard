"use client";

import { useEffect, useRef, useState } from "react";
import type { DashboardOverview } from "./types";

// 데이터 변동 감지 환경.
// 폴링으로 data가 갱신될 때마다 이전 스냅샷과 비교해, 누적값이 바뀐 지표의
// 증감(delta)을 이벤트로 내보낸다. 실제 알림/효과는 이 이벤트를 구독해 붙이면 된다.
//
// 감지 대상: 가입자(members) · 결제건수(payments) · 매출(revenue)
// 기준값: total(누적) — 값이 늘면 "새 가입/결제/매출 발생"을 의미.

export type ChangeKey = "members" | "payments" | "revenue";

export interface MetricChange {
  key: ChangeKey;
  prev: number;
  curr: number;
  delta: number; // curr - prev (양수 = 증가)
}

export interface DataChanges {
  at: number; // 감지 시각 (epoch ms)
  members?: MetricChange;
  payments?: MetricChange;
  revenue?: MetricChange;
}

type Snapshot = Record<ChangeKey, number>;

function snapshot(d: DashboardOverview): Snapshot {
  return {
    members: d.members.total,
    payments: d.payments.total,
    revenue: d.revenue.total,
  };
}

/**
 * data가 갱신될 때마다 변동분을 계산해 반환.
 * - 최초 로드(비교 대상 없음)에는 이벤트를 내지 않는다.
 * - 변동이 하나도 없으면 null 유지(직전 이벤트를 새로 갱신하지 않음).
 */
export function useDataChanges(data?: DashboardOverview): DataChanges | null {
  const prevRef = useRef<Snapshot | null>(null);
  const [changes, setChanges] = useState<DataChanges | null>(null);

  useEffect(() => {
    if (!data) return;
    const curr = snapshot(data);
    const prev = prevRef.current;
    prevRef.current = curr;
    if (!prev) return; // 최초 스냅샷은 기준만 저장

    const keys: ChangeKey[] = ["members", "payments", "revenue"];
    const event: DataChanges = { at: Date.now() };
    let changed = false;
    for (const k of keys) {
      if (curr[k] !== prev[k]) {
        event[k] = { key: k, prev: prev[k], curr: curr[k], delta: curr[k] - prev[k] };
        changed = true;
      }
    }
    if (changed) setChanges(event);
  }, [data]);

  return changes;
}
