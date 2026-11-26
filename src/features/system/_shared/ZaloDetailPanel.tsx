import type { ReactNode } from 'react';
import { ContentTabs } from '@/components/common';
import type { ContentTabItem } from '@/types/content-tabs';
import styles from './zalo-shared.module.scss';

// Detail panel beside a Zalo list: "User Details | name" + badge, tabs, body and an action bar
// (left group, right group), as in the Zalo Users / Templates / Sending Limits designs.

interface ZaloDetailPanelProps<T extends string> {
  title: ReactNode;
  /** Shown after "|" (selected name / code). */
  subtitle?: ReactNode;
  /** Right side of the header, e.g. the status badge. */
  badge?: ReactNode;
  tabs?: ContentTabItem<T>[];
  activeTab?: T;
  onTabChange?: (key: T) => void;
  children: ReactNode;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
}

export default function ZaloDetailPanel<T extends string>({
  title,
  subtitle,
  badge,
  tabs,
  activeTab,
  onTabChange,
  children,
  leftActions,
  rightActions,
}: ZaloDetailPanelProps<T>) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>
          {title}
          {subtitle && (
            <>
              <span className={styles.panelSep}>|</span>
              <span className={styles.panelSubtitle}>{subtitle}</span>
            </>
          )}
        </span>
        {badge}
      </div>
      {tabs && activeTab !== undefined && onTabChange && (
        <div className={styles.panelTabs}>
          <ContentTabs<T> items={tabs} activeKey={activeTab} onChange={onTabChange} />
        </div>
      )}
      <div className={styles.panelBody}>{children}</div>
      {(leftActions || rightActions) && (
        <div className={styles.panelFooter}>
          <span className={styles.panelFooterGroup}>{leftActions}</span>
          <span className={styles.panelFooterGroup}>{rightActions}</span>
        </div>
      )}
    </div>
  );
}
