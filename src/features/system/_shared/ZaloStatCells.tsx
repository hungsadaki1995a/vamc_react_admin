import type { CSSProperties, ReactNode } from 'react';
import styles from './zalo-shared.module.scss';

// Header cells of the Zalo screens: "Linked | 12", "Invitations Today | 3 / 50"…

export interface ZaloStatItem {
  key: string;
  label: ReactNode;
  value: ReactNode;
}

export default function ZaloStatCells({ items }: { items: ZaloStatItem[] }) {
  return (
    <div className={styles.statCells} style={{ '--stat-count': items.length } as CSSProperties}>
      {items.map((item) => (
        <div key={item.key} className={styles.statCell}>
          <span className={styles.statLabel}>{item.label}</span>
          <span className={styles.statValue}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
