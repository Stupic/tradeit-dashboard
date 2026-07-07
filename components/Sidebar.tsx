import styles from "./dashboard.module.css";
import { IconGrid, IconUser, IconCart, IconMoney, IconChart, IconBell, IconGear } from "./icons";

// 좌측 아이콘 레일 (장식 · 네비게이션 자리)
export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoDot} />
      <div className={`${styles.navIcon} ${styles.navIconActive}`}><IconGrid /></div>
      <div className={styles.navIcon}><IconUser /></div>
      <div className={styles.navIcon}><IconCart /></div>
      <div className={styles.navIcon}><IconMoney /></div>
      <div className={styles.navIcon}><IconChart /></div>
      <div className={styles.navIcon}>
        <IconBell />
        <span className={styles.navBadge} />
      </div>
      <div className={styles.navIcon}><IconGear /></div>
      <div className={styles.navSpacer} />
      <div className={styles.avatar}>TK</div>
    </aside>
  );
}
