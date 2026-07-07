import styles from "./dashboard.module.css";
import type { MetricBlock } from "@/lib/types";

// 누적 / 이번 달 / 오늘 리스트 (색 점 + 값 + 단위)
export default function InfoPanel({
  data,
  color,
  unit,
  format,
}: {
  data: MetricBlock;
  color: string;
  unit?: string;
  format: (n: number) => string;
}) {
  const rows: [string, number][] = [
    ["누적", data.total],
    ["이번 달", data.thisMonth],
    ["오늘", data.today],
  ];
  return (
    <div className={styles.infoPanel}>
      {rows.map(([label, value]) => (
        <div className={styles.infoRow} key={label}>
          <span className={styles.infoLabel}>
            <span className={styles.infoDot} style={{ background: color }} />
            {label}
          </span>
          <span className={styles.infoValue}>
            {format(value)}
            {unit && <span className={styles.infoUnit}>{unit}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
