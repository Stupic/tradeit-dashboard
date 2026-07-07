import styles from "./dashboard.module.css";
import ChangeBadge from "./ChangeBadge";

// 중앙 오비탈의 원형 지표 노드 (회원가입수 / 결제건수 / 총수익)
export default function MetricNode({
  className,
  icon,
  label,
  value,
  changeRate,
  color,
  glow,
}: {
  className?: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  changeRate: number;
  color: string;
  glow: string;
}) {
  return (
    <div
      className={`${styles.node} ${className ?? ""}`}
      style={{ boxShadow: `0 0 40px ${glow}, 0 0 0 1px ${color}55 inset` }}
    >
      <div className={styles.nodeInner}>
        <span className={styles.nodeIcon} style={{ background: `${color}22`, color }}>
          {icon}
        </span>
        <span className={styles.nodeLabel}>{label}</span>
        <span className={styles.nodeValue}>{value}</span>
        <ChangeBadge rate={changeRate} />
      </div>
    </div>
  );
}
