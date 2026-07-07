import styles from "./dashboard.module.css";
import { formatPercent } from "@/lib/format";

export default function ChangeBadge({ rate }: { rate: number }) {
  const up = rate >= 0;
  return (
    <span className={`${styles.badge} ${up ? styles.badgeUp : styles.badgeDown}`}>
      {up ? "▲" : "▼"} {formatPercent(rate).replace("+", "").replace("-", "")}
    </span>
  );
}
