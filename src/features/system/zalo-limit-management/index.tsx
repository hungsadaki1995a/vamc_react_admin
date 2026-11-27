import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ContentTabs } from '@/components/common';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { SysButton, SysPage, SysTitleBar } from '@/components/common/sys-ui/SysListUi';
import ZaloStatCells from '../_shared/ZaloStatCells';
import ZaloChannelBadge from './ZaloChannelBadge';
import ZaloChannelStatusModal from './ZaloChannelStatusModal';
import ZaloCostSummary from './ZaloCostSummary';
import ZaloLimitRules from './ZaloLimitRules';
import ZaloStopModal from './ZaloStopModal';
import ZaloUnitPrices from './ZaloUnitPrices';
import { DEFAULT_WARN_RT, num, usageLevel, usagePct } from './zalo-limit-constants';
import { useZaloLimitOverview, useZaloLimitRules } from './use-zalo-limits';
import styles from './zalo-limit-management.module.scss';

// Zalo Sending Limits (menu A09050500): today's / this month's usage and cost against the system rules, the Zalo
// channel switch (stop / resume, write permission), and three pages: Limit Rules (list + Rule Details), Unit Prices
// and Cost Summary.

type PageKey = 'rules' | 'prices' | 'cost';

/** "212 / 2,000 (11%)" with the percentage coloured by the rule's warn threshold; only the figure without a rule. */
function usageValue(used: number, limit: number | null | undefined, warnRt: number, suffix = ''): ReactNode {
  if (limit === null || limit === undefined) {
    return (
      <span>
        <strong>{num(used)}</strong>
        {suffix}
      </span>
    );
  }
  const pct = usagePct(used, limit);
  return (
    <span>
      <strong>{num(used)}</strong> / {num(limit)}
      {suffix}{' '}
      <span className={styles.statPct} data-level={usageLevel(pct, warnRt)}>
        ({pct}%)
      </span>
    </span>
  );
}

export default function ZaloLimitManagement() {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const [page, setPage] = useState<PageKey>('rules');
  // Picked when opened, so the popup does not switch while the channel state refreshes.
  const [channelModal, setChannelModal] = useState<'stop' | 'status' | null>(null);
  const { data: overview } = useZaloLimitOverview();
  // Warn thresholds of the header rules (cached with the unfiltered list).
  const { data: allRules } = useZaloLimitRules({});
  const warnOf = (lmtCd?: string | null) => allRules?.find((rule) => rule.lmtCd === lmtCd)?.warnRt ?? DEFAULT_WARN_RT;
  const channel = overview?.channel;
  const stopped = channel?.stopYn === 'Y';

  const stats = [
    {
      key: 'sentToday',
      label: t('zalo.limits.summary.sentToday'),
      value: overview ? usageValue(overview.sentToday, overview.dayCountLimit, warnOf(overview.dayCountLmtCd)) : '-',
    },
    {
      key: 'costToday',
      label: t('zalo.limits.summary.costToday'),
      value: overview ? usageValue(overview.costToday, overview.costDayLimit, warnOf(overview.costDayLmtCd), ' ₫') : '-',
    },
    {
      key: 'costMonth',
      label: t('zalo.limits.summary.costMonth'),
      value: overview ? usageValue(overview.costMonth, overview.costMonthLimit, warnOf(overview.costMonthLmtCd), ' ₫') : '-',
    },
    {
      key: 'channel',
      label: t('zalo.limits.summary.channel'),
      value: (
        <span className={styles.channelCell} data-stopped={stopped || undefined}>
          <ZaloChannelBadge channel={channel} />
          {canWrite && channel && (
            <SysButton size="small" look={stopped ? 'primary' : 'danger'} onClick={() => setChannelModal(stopped ? 'status' : 'stop')}>
              {t(stopped ? 'zalo.limits.buttons.resume' : 'zalo.limits.buttons.stop')}
            </SysButton>
          )}
        </span>
      ),
    },
  ];

  const pages = [
    { key: 'rules' as const, label: t('zalo.limits.pages.rules') },
    { key: 'prices' as const, label: t('zalo.limits.pages.prices') },
    { key: 'cost' as const, label: t('zalo.limits.pages.cost') },
  ];

  return (
    <SysPage>
      <SysTitleBar
        title={t('zalo.limits.title')}
        breadcrumb={[t('zalo.breadcrumb.root'), t('zalo.breadcrumb.notification'), t('zalo.limits.title')]}
      />
      <ZaloStatCells items={stats} />
      <ContentTabs<PageKey> items={pages} activeKey={page} onChange={setPage} ariaLabel={t('zalo.limits.title')} />
      {page === 'rules' && <ZaloLimitRules canWrite={canWrite} />}
      {page === 'prices' && <ZaloUnitPrices canWrite={canWrite} />}
      {page === 'cost' && <ZaloCostSummary />}
      {channelModal === 'stop' && <ZaloStopModal onClose={() => setChannelModal(null)} />}
      {channelModal === 'status' && channel && (
        <ZaloChannelStatusModal channel={channel} canWrite={canWrite} onClose={() => setChannelModal(null)} />
      )}
    </SysPage>
  );
}
