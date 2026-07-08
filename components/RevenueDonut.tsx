"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { RevenueComposition } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import styles from "./dashboard.module.css";

// 카테고리 색: 등급 개수가 가변이므로 인덱스 순서로 배정 (dataviz 검증 색).
// 마지막(기타/잔여)은 중립 슬레이트로 떨어지도록 팔레트 끝에 배치.
const PALETTE = ["#8b7cf6", "#38bdf8", "#4a9eff", "#22c55e", "#f59e0b", "#94a3b8"];
const colorAt = (i: number, n: number) =>
  i === n - 1 && n > 1 ? "#94a3b8" : PALETTE[i % PALETTE.length];

export default function RevenueDonut({
  comp,
  currency,
}: {
  comp: RevenueComposition;
  currency: string;
}) {
  return (
    <div className={styles.donutWrap}>
      <div style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={comp.items}
              dataKey="ratio"
              nameKey="label"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={3}
              stroke="#0a0f1e"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {comp.items.map((it, i) => (
                <Cell key={it.key} fill={colorAt(i, comp.items.length)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0a0f1e",
                border: "1px solid rgba(120,150,255,0.28)",
                borderRadius: 10,
                fontSize: 12,
                color: "#e8edf7",
              }}
              formatter={(v: any, _n: any, p: any) => [
                `${v}% · ${formatCurrency(p.payload.amount, currency)}`,
                p.payload.label,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.donutCenter}>
          <div>
            <div className={styles.donutTotal}>{formatCurrency(comp.total, currency)}</div>
            <div className={styles.donutCaption}>이번 달 총 매출</div>
          </div>
        </div>
      </div>

      <div className={styles.legend}>
        {comp.items.map((it, i) => (
          <div className={styles.legendRow} key={it.key}>
            <span className={styles.infoDot} style={{ background: colorAt(i, comp.items.length) }} />
            <span className={styles.legendName}>{it.label}</span>
            <span className={styles.legendPct}>{it.ratio}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
