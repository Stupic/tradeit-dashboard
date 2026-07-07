import styles from "./dashboard.module.css";
import MetricNode from "./MetricNode";
import RealtimeClock from "./RealtimeClock";
import Card from "./Card";
import InfoPanel from "./InfoPanel";
import { IconUser, IconCart, IconMoney, IconPulse } from "./icons";
import { formatNumber, formatCurrency } from "@/lib/format";
import type { DashboardOverview } from "@/lib/types";

const rings = [520, 420, 300];

// 노드 중심(궤도 위) — CSS 위치와 일치 (viewBox 0~100 기준)
const NODE_POS = {
  top: { x: 50, y: 15 },
  left: { x: 22, y: 68 },
  right: { x: 78, y: 68 },
};
const CENTER = { x: 50, y: 50 };

// 별자리 메시 점: 허브 주위 두 개의 타원 링 위에 분포 (결정적, 랜덤 미사용)
const meshOuter = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2;
  return { x: 50 + 33 * Math.cos(a), y: 50 + 31 * Math.sin(a) };
});
const meshInner = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 + 0.32;
  return { x: 50 + 20 * Math.cos(a), y: 50 + 19 * Math.sin(a) };
});

export default function CenterStage({ data }: { data: DashboardOverview }) {
  return (
    <div className={styles.stage}>
      {/* 동심원 링 */}
      {rings.map((d, i) => (
        <div
          key={d}
          className={`${styles.ring} ${i === 1 ? styles.ringSpin : ""}`}
          style={{ width: d, height: d }}
        />
      ))}

      {/* 별자리(네트워크) 오버레이 */}
      <svg className={styles.constellation} viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* 허브 → 각 노드 스포크 */}
        {Object.values(NODE_POS).map((p, i) => (
          <line
            key={`sp-${i}`}
            className={styles.constSpoke}
            x1={CENTER.x} y1={CENTER.y} x2={p.x} y2={p.y}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {/* 외곽 메시 링 연결 */}
        {meshOuter.map((p, i) => {
          const n = meshOuter[(i + 1) % meshOuter.length];
          return (
            <line key={`o-${i}`} className={styles.constLine}
              x1={p.x} y1={p.y} x2={n.x} y2={n.y} vectorEffect="non-scaling-stroke" />
          );
        })}
        {/* 내곽 메시 링 연결 */}
        {meshInner.map((p, i) => {
          const n = meshInner[(i + 1) % meshInner.length];
          return (
            <line key={`i-${i}`} className={styles.constLine}
              x1={p.x} y1={p.y} x2={n.x} y2={n.y} vectorEffect="non-scaling-stroke" />
          );
        })}
        {/* 내↔외 방사형 링크 (일부) */}
        {meshInner.map((p, i) => {
          const n = meshOuter[(i * 3) % meshOuter.length];
          return (
            <line key={`r-${i}`} className={styles.constLine}
              x1={p.x} y1={p.y} x2={n.x} y2={n.y} vectorEffect="non-scaling-stroke" />
          );
        })}
        {/* 점 */}
        {meshOuter.map((p, i) => (
          <circle key={`od-${i}`} className={i % 4 === 0 ? styles.constDotBright : styles.constDot}
            cx={p.x} cy={p.y} r={i % 4 === 0 ? 0.55 : 0.4} />
        ))}
        {meshInner.map((p, i) => (
          <circle key={`id-${i}`} className={styles.constDot} cx={p.x} cy={p.y} r={0.4} />
        ))}
      </svg>

      {/* 중앙 허브 */}
      <div className={styles.hub}>
        <div>
          <span className={styles.hubIcon}>
            <IconPulse size={30} />
          </span>
          <div className={styles.hubTitle}>BUSINESS</div>
          <div className={styles.hubTitle}>OVERVIEW</div>
          <div className={styles.hubLive}>
            <span className={styles.pulseDot} /> 실시간 업데이트
          </div>
          <RealtimeClock serverTime={data.serverTime} />
        </div>
      </div>

      {/* 회원가입수 (상단) */}
      <MetricNode
        className={styles.nodeTop}
        icon={<IconUser size={20} />}
        label="회원가입수"
        value={formatNumber(data.members.total)}
        changeRate={data.members.changeRate}
        color="#4a9eff"
        glow="rgba(74,158,255,0.35)"
      />

      {/* 결제건수 (좌하) */}
      <MetricNode
        className={styles.nodeLeft}
        icon={<IconCart size={20} />}
        label="결제건수"
        value={formatNumber(data.payments.total)}
        changeRate={data.payments.changeRate}
        color="#22c55e"
        glow="rgba(34,197,94,0.35)"
      />

      {/* 총수익 (우하) */}
      <MetricNode
        className={styles.nodeRight}
        icon={<IconMoney size={20} />}
        label="총수익"
        value={formatCurrency(data.revenue.total, data.currency)}
        changeRate={data.revenue.changeRate}
        color="#f59e0b"
        glow="rgba(245,158,11,0.35)"
      />

      {/* 회원가입수 상세 (노드 우측 플로팅) */}
      <div className={styles.floatInfo}>
        <Card>
          <InfoPanel data={data.members} color="#4a9eff" unit="명" format={formatNumber} />
        </Card>
      </div>
    </div>
  );
}
