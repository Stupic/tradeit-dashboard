"use client";

import styles from "./dashboard.module.css";
import { useDashboard } from "@/lib/useDashboard";
import FitScreen from "./FitScreen";
import Sidebar from "./Sidebar";

// 설계 기준 크기 (16:9). 이 크기로 렌더 후 화면에 맞춰 스케일 → 스크롤 없음.
const DESIGN_W = 1600;
const DESIGN_H = 900;
import Card from "./Card";
import CenterStage from "./CenterStage";
import InfoPanel from "./InfoPanel";
import TrendChart from "./TrendChart";
import RevenueDonut from "./RevenueDonut";
import TodaySummary from "./TodaySummary";
import { IconCalendar, IconChevron } from "./icons";
import { formatNumber, formatCurrency, compact } from "@/lib/format";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
function dateLabel(ymd: string): string {
  const d = new Date(ymd + "T00:00:00");
  const w = WEEKDAY[d.getDay()];
  return `${ymd.replace(/-/g, ".")} (${w})`;
}

export default function Dashboard() {
  const { data, error } = useDashboard();

  if (error) {
    return (
      <FitScreen width={DESIGN_W} height={DESIGN_H}>
        <div className={styles.app}>
          <Sidebar />
          <div className={styles.content}>
            <div className={styles.loading}>데이터를 불러오지 못했습니다.</div>
          </div>
        </div>
      </FitScreen>
    );
  }

  if (!data) {
    return (
      <FitScreen width={DESIGN_W} height={DESIGN_H}>
        <div className={styles.app}>
          <Sidebar />
          <div className={styles.content}>
            <div className={styles.loading}>
              <div className={styles.pulseDot} /> 대시보드를 불러오는 중…
            </div>
          </div>
        </div>
      </FitScreen>
    );
  }

  const cur = data.currency;

  return (
    <FitScreen width={DESIGN_W} height={DESIGN_H}>
    <div className={styles.app}>
      <Sidebar />
      <div className={styles.content}>
        {/* topbar */}
        <div className={styles.topbar}>
          <div className={styles.brand}>
            <span className={styles.logoDot} style={{ width: 22, height: 22, marginBottom: 0 }} />
            DASHBOARD
          </div>
          <div className={styles.datePicker}>
            <IconCalendar size={16} />
            {dateLabel(data.baseDate)}
            <IconChevron size={16} />
          </div>
        </div>

        {/* page head */}
        <div className={styles.pageHead}>
          <div>
            <h1>비즈니스 현황</h1>
            <p>서비스의 주요 지표를 한눈에 확인하세요.</p>
          </div>
          <span className={styles.realtime}>
            <span className={styles.pulseDot} /> 실시간
          </span>
        </div>

        {/* main grid */}
        <div className={styles.grid}>
          {/* LEFT */}
          <div className={styles.col}>
            <Card title="회원가입 추이" sub="(최근 7일)">
              <TrendChart data={data.trends.members} color="#4a9eff" valueFormat={compact} />
            </Card>
            <Card>
              <InfoPanel data={data.payments} color="#22c55e" unit="건" format={formatNumber} />
            </Card>
            <Card title="결제건수 추이" sub="(최근 7일)">
              <TrendChart data={data.trends.payments} color="#22c55e" valueFormat={compact} />
            </Card>
          </div>

          {/* CENTER */}
          <div className={styles.center}>
            <CenterStage data={data} />
            <Card title="오늘의 요약">
              <TodaySummary data={data} />
            </Card>
          </div>

          {/* RIGHT */}
          <div className={styles.col}>
            <Card title="매출 추이" sub="(최근 7일)">
              <TrendChart
                data={data.trends.revenue}
                color="#f59e0b"
                valueFormat={(n) => compact(n)}
              />
            </Card>
            <Card>
              <InfoPanel data={data.revenue} color="#f59e0b" format={(n) => formatCurrency(n, cur)} />
            </Card>
            <Card title="매출 구성" sub="(이번 달)">
              <RevenueDonut comp={data.revenueComposition} currency={cur} />
            </Card>
          </div>
        </div>
      </div>
    </div>
    </FitScreen>
  );
}
