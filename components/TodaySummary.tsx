import styles from "./dashboard.module.css";
import ChangeBadge from "./ChangeBadge";
import { IconUser, IconCart, IconMoney, IconChart } from "./icons";
import { formatNumber, formatCurrency } from "@/lib/format";
import type { DashboardOverview } from "@/lib/types";

export default function TodaySummary({ data }: { data: DashboardOverview }) {
  const items = [
    { icon: <IconUser size={16} />, color: "var(--blue)", label: "신규 회원", value: formatNumber(data.members.today), rate: data.members.changeRate },
    { icon: <IconCart size={16} />, color: "var(--green)", label: "결제 건수", value: formatNumber(data.payments.today), rate: data.payments.changeRate },
    { icon: <IconMoney size={16} />, color: "var(--orange)", label: "매출", value: formatCurrency(data.revenue.today, data.currency), rate: data.revenue.changeRate },
    { icon: <IconChart size={16} />, color: "var(--cyan)", label: "접속자 수", value: formatNumber(data.activeUsers.today), rate: data.activeUsers.changeRate },
  ];
  return (
    <div className={styles.summary}>
      {items.map((it) => (
        <div className={styles.sumItem} key={it.label}>
          <div className={styles.sumTop}>
            <span className={styles.sumIcon} style={{ background: `${it.color}22`, color: it.color }}>
              {it.icon}
            </span>
            <span className={styles.sumLabel}>{it.label}</span>
          </div>
          <span className={styles.sumValue}>{it.value}</span>
          <ChangeBadge rate={it.rate} />
        </div>
      ))}
    </div>
  );
}
