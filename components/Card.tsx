import styles from "./dashboard.module.css";

export default function Card({
  title,
  sub,
  children,
  style,
}: {
  title?: string;
  sub?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className={styles.card} style={style}>
      {title && (
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>{title}</span>
          {sub && <span className={styles.cardSub}>{sub}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
