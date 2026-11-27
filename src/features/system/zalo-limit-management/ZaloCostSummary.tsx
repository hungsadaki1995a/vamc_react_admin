import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import AppDatePicker from '@/components/inputs/AppDatePicker';
import type { ZaloSenderCost, ZaloTypeCost } from '@/api/system/zalo-limit-api';
import { SysExcelButton, SysSectionHeader, SysTable } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid } from '@/components/common/sys-ui/SysFormUi';
import { actorText } from '../_shared/zalo-messages';
import { num, priceChannel, priceTypeLabel, usageLevel, usagePct } from './zalo-limit-constants';
import { useDownloadZaloCostSummaryExcel, useZaloCostSummary } from './use-zalo-limits';
import styles from './zalo-limit-management.module.scss';

// Zalo Sending Limits - Cost Summary page: monthly budget (system COST rule), spent, remaining and projection, cost by
// message type and the top 5 senders of paid messages. Internal estimate until reconciled with the Zalo statement.

const MONTH_FORMAT = 'MM-YYYY';

function buildTypeColumns(t: TFunction): TableColumnsType<ZaloTypeCost> {
  return [
    {
      title: t('zalo.limits.cost.columns.msgType'),
      dataIndex: 'zaloMsgTypeCd',
      key: 'zaloMsgTypeCd',
      ellipsis: true,
      render: (v: ZaloTypeCost['zaloMsgTypeCd']) => `${priceTypeLabel(v)} · ${priceChannel(v)}`,
    },
    { title: t('zalo.limits.cost.columns.sent'), dataIndex: 'sent', key: 'sent', align: 'right', width: 90, render: (v: number) => num(v) },
    {
      title: t('zalo.limits.cost.columns.price'),
      dataIndex: 'untprc',
      key: 'untprc',
      align: 'right',
      width: 90,
      render: (v?: number | null) => num(v),
    },
    { title: t('zalo.limits.cost.columns.amount'), dataIndex: 'amount', key: 'amount', align: 'right', width: 110, render: (v: number) => num(v) },
  ];
}

function buildSenderColumns(t: TFunction): TableColumnsType<ZaloSenderCost> {
  return [
    {
      title: t('zalo.limits.cost.columns.sender'),
      dataIndex: 'sndrId',
      key: 'sndrId',
      ellipsis: true,
      render: (v: string) => (v === 'SYSTEM' ? t('zalo.limits.cost.systemSender') : actorText(v)),
    },
    { title: t('zalo.limits.cost.columns.sent'), dataIndex: 'sent', key: 'sent', align: 'right', width: 90, render: (v: number) => num(v) },
    { title: t('zalo.limits.cost.columns.amount'), dataIndex: 'amount', key: 'amount', align: 'right', width: 110, render: (v: number) => num(v) },
    {
      title: t('zalo.limits.cost.columns.share'),
      dataIndex: 'sharePct',
      key: 'sharePct',
      align: 'right',
      width: 80,
      render: (v: number) => `${v}%`,
    },
  ];
}

export default function ZaloCostSummary() {
  const { t } = useTranslation();
  const [month, setMonth] = useState<Dayjs>(() => dayjs().startOf('month'));
  const monthParam = month.format('YYYYMM');
  const { data, isFetching } = useZaloCostSummary(monthParam);
  const excel = useDownloadZaloCostSummaryExcel();
  const budget = data?.budget ?? null;
  const spent = data?.spent ?? 0;
  const pct = usagePct(spent, budget);
  const projected = data?.projected ?? 0;
  const over = budget !== null && projected > budget;

  return (
    <div className={styles.pageBody}>
      <SysSectionHeader
        title={
          <span className={styles.headerLine}>
            <strong>{t('zalo.limits.cost.title')}</strong>
            <span className={styles.headerSep}>|</span>
            <span className={styles.mutedText}>{t('zalo.limits.cost.month')}</span>
            <AppDatePicker
              className={styles.dateInput}
              picker="month"
              value={month}
              format={MONTH_FORMAT}
              allowClear={false}
              aria-label={t('zalo.limits.cost.month')}
              disabledDate={(day) => day.isAfter(dayjs(), 'month')}
              onChange={(value) => value && setMonth(value.startOf('month'))}
            />
          </span>
        }
        actions={<SysExcelButton loading={excel.isPending} onClick={() => excel.mutate(monthParam)} />}
      />
      <SysFieldGrid columns={2} labelWidth={170}>
        <SysField label={t('zalo.limits.cost.budget', { code: data?.budgetLmtCd ?? '-' })}>
          {budget === null ? t('zalo.limits.cost.noBudget') : <span><strong>{num(budget)}</strong> ₫</span>}
        </SysField>
        <SysField label={t('zalo.limits.cost.spent')}>
          <span className={styles.spentCell} data-level={usageLevel(pct)}>
            {budget !== null && (
              <span className={styles.usageTrack}>
                <span className={styles.usageFill} style={{ '--usage-pct': `${pct}%` } as CSSProperties} />
              </span>
            )}
            <span>
              <strong>{num(spent)}</strong> ₫{budget !== null && ` (${pct}%)`}
            </span>
          </span>
        </SysField>
        <SysField label={t('zalo.limits.cost.remaining')}>
          <span>
            <strong>{num(data?.remaining)}</strong>
            {data?.remaining != null && ' ₫'}
          </span>
        </SysField>
        <SysField label={t('zalo.limits.cost.projected')}>
          <span className={styles.projected} data-over={over || undefined}>
            <strong>{num(projected)}</strong> ₫
            {budget !== null &&
              ` · ${over ? t('zalo.limits.cost.overBudget', { amount: num(projected - budget) }) : t('zalo.limits.cost.withinBudget')}`}
          </span>
        </SysField>
      </SysFieldGrid>
      <div className={styles.costTables}>
        <section className={styles.costSection}>
          <h3 className={styles.sectionTitle}>{t('zalo.limits.cost.byType')}</h3>
          <SysTable<ZaloTypeCost>
            rowKey="zaloMsgTypeCd"
            tableLayout="fixed"
            columns={buildTypeColumns(t)}
            dataSource={data?.byType ?? []}
            loading={isFetching}
          />
        </section>
        <section className={styles.costSection}>
          <h3 className={styles.sectionTitle}>{t('zalo.limits.cost.topSenders')}</h3>
          <SysTable<ZaloSenderCost>
            rowKey="sndrId"
            tableLayout="fixed"
            columns={buildSenderColumns(t)}
            dataSource={data?.topSenders ?? []}
            loading={isFetching}
            locale={{ emptyText: t('zalo.limits.cost.noSenders') }}
          />
        </section>
      </div>
      <p className={styles.note}>{t('zalo.limits.cost.note')}</p>
    </div>
  );
}
