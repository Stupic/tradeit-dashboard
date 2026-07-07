"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/format";
import styles from "./dashboard.module.css";

// 서버 시각으로 초기화 후 클라이언트에서 1초마다 진행 (폴링과 분리)
export default function RealtimeClock({ serverTime }: { serverTime?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const base = serverTime ? new Date(serverTime) : new Date();
    setNow(base);
    const id = setInterval(() => setNow((prev) => new Date((prev ?? base).getTime() + 1000)), 1000);
    return () => clearInterval(id);
    // serverTime이 폴링으로 갱신되면 시계도 재동기화
  }, [serverTime]);

  return <div className={styles.hubClock}>{now ? formatClock(now) : "--:--:--"}</div>;
}
