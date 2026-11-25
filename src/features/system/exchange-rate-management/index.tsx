import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import type { ExchangeRateItem, ExchangeRateRun } from '@/api/system/exchange-rate-api';
import { SYS_DIALOG_LABELS } from '@/config/sys-messages';
import { DateTimeText, ResultBadge, SysButton, SysTable, SysTitleBar, SysPage } from '@/components/common/sys-ui/SysListUi';
import { apiErrorCode, errorMessage } from '@/utils/system-utils';
import BatchHistoryModal from '@/features/system/batch-management/BatchHistoryModal';
import { EXCHANGE_RATE_SYNC_JOB } from '@/features/system/batch-management/batch-utils';
import { EXCHANGE_RATE_MESSAGES, formatRate, formatRunBy, formatSchedule } from './exchange-rate-utils';
import { useExchangeRateStatus, useSyncExchangeRates } from './use-exchange-rates';
import styles from './exchange-rate-management.module.scss';

/** Client-side compare for the frame's sort arrows; empty values ("-") sort as the lowest. */
function byNumber<T>(pick: (row: T) => number | null | undefined) {
  return (a: T, b: T) => {
    const x = pick(a) ?? null;
    const y = pick(b) ?? null;
    if (x === null || y === null) return (x === null ? 0 : 1) - (y === null ? 0 : 1);
    return x - y;
  };
}

function byText<T>(pick: (row: T) => string | null | undefined) {
  return (a: T, b: T) => (pick(a) ?? '').localeCompare(pick(b) ?? '');
}

const RATE_COLUMNS: TableColumnsType<ExchangeRateItem> = [
  { title: 'Currency', dataIndex: 'currencyCode', align: 'center', sorter: byText((r) => r.currencyCode) },
  {
    title: 'Buy (Cash)',
    dataIndex: 'cashBuy',
    align: 'center',
    sorter: byNumber((r) => r.cashBuy),
    render: (value?: number | null) => formatRate(value),
  },
  {
    title: 'Buy (Transfer)',
    dataIndex: 'transferBuy',
    align: 'center',
    sorter: byNumber((r) => r.transferBuy),
    render: (value?: number | null) => formatRate(value),
  },
  {
    title: 'Sell',
    dataIndex: 'sell',
    align: 'center',
    sorter: byNumber((r) => r.sell),
    render: (value?: number | null) => formatRate(value),
  },
];

const RUN_COLUMNS: TableColumnsType<ExchangeRateRun> = [
  {
    title: 'Run Date/Time',
    dataIndex: 'startedAt',
    align: 'center',
    // ISO date-time strings sort chronologically as text.
    sorter: byText((r) => r.startedAt),
    render: (value?: string) => <DateTimeText value={value} />,
  },
  {
    title: 'Result',
    dataIndex: 'result',
    align: 'center',
    sorter: byText((r) => r.result),
    render: (value?: string) => <ResultBadge value={value} />,
  },
  {
    title: 'Run By',
    dataIndex: 'runBy',
    align: 'center',
    sorter: byText((r) => formatRunBy(r.runBy)),
    render: (value?: string) => formatRunBy(value),
  },
];

/** Exchange Rate Management - List (VPA09010401, menu A09010400), incl. the Sync Failed state. */
export default function ExchangeRateManagement() {
  const { toast, dialog } = useNotify();
  const { data: status, isFetching } = useExchangeRateStatus();
  const sync = useSyncExchangeRates();
  const [historyOpen, setHistoryOpen] = useState(false);

  // Sync Failed state: only the Last Run badge turns Failed; base date/time and rates keep the last good values.
  // C01 — the design uses [Cancel] / [Sync] here (not [Close]).
  const confirmSync = () =>
    dialog.confirm({
      content: EXCHANGE_RATE_MESSAGES.confirmSync,
      okText: SYS_DIALOG_LABELS.sync,
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await sync.sync();
          toast.success(EXCHANGE_RATE_MESSAGES.synced);
        } catch (error) {
          const code = apiErrorCode(error);
          if (code === 'BAT007') toast.error(EXCHANGE_RATE_MESSAGES.syncRunning);
          else if (code === 'EXR001') dialog.error({ content: EXCHANGE_RATE_MESSAGES.syncFailed });
          else toast.error(errorMessage(error, EXCHANGE_RATE_MESSAGES.syncFailed));
        }
      },
    });

  return (
    <SysPage>
      <SysTitleBar
        title="Exchange Rate Management"
        breadcrumb={['System Operation Management', 'NPL Platform Management', 'Exchange Rate Management']}
      />

      <section className={styles.syncPanel}>
        <div className={styles.syncHeader}>
          <h2 className={styles.blockTitle}>Sync Status</h2>
          {status?.canSync && (
            <SysButton look="outline" loading={sync.isPending} onClick={confirmSync}>
              Sync Now
            </SysButton>
          )}
        </div>
        <div className={styles.syncCard}>
          <div className={styles.syncItem}>
            <span className={styles.syncLabel}>Source</span>
            <strong className={styles.syncValue}>{status?.source ?? '-'}</strong>
          </div>
          <div className={styles.syncItem}>
            <span className={styles.syncLabel}>Base Date/Time</span>
            <strong className={styles.syncValue}>
              <DateTimeText value={status?.baseDateTime} />
            </strong>
          </div>
          <div className={styles.syncItem}>
            <span className={styles.syncLabel}>Last Run</span>
            <span className={styles.syncBadge}>
              <ResultBadge value={status?.lastRun?.result} />
            </span>
          </div>
          <div className={styles.syncItem}>
            <span className={styles.syncLabel}>Run Schedule</span>
            <strong className={styles.syncValue}>{formatSchedule(status?.schedule)}</strong>
          </div>
        </div>
      </section>

      <div className={styles.columns}>
        <section className={styles.block}>
          <div className={styles.blockHeader}>
            <h2 className={styles.blockTitle}>Exchange Rates Shown to Users</h2>
          </div>
          <SysTable<ExchangeRateItem>
            rowKey="currencyCode"
            columns={RATE_COLUMNS}
            dataSource={status?.rates}
            className={styles.blockTable}
            fill
            loading={isFetching && !status}
          />
        </section>
        <section className={styles.block}>
          <div className={styles.blockHeader}>
            <h2 className={styles.blockTitle}>Recent Runs</h2>
            <SysButton onClick={() => setHistoryOpen(true)}>
              View All History
            </SysButton>
          </div>
          <SysTable<ExchangeRateRun>
            rowKey={(row) => `${row.startedAt ?? ''}-${row.triggerType ?? ''}`}
            columns={RUN_COLUMNS}
            dataSource={status?.recentRuns}
            className={styles.blockTable}
            fill
            loading={isFetching && !status}
          />
        </section>
      </div>

      {historyOpen && (
        <BatchHistoryModal jobName={EXCHANGE_RATE_SYNC_JOB} allowRerun={false} onClose={() => setHistoryOpen(false)} />
      )}
    </SysPage>
  );
}
