import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import AppDatePicker from '@/components/inputs/AppDatePicker';
import Spinbox from '@/components/inputs/Spinbox';
import { useNotify } from '@/hooks/use-notify';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import type { ZaloMsgType } from '@/api/system/zalo-api';
import type { ZaloUnitPrice } from '@/api/system/zalo-limit-api';
import { SysButton, SysSectionHeader, SysTable } from '@/components/common/sys-ui/SysListUi';
import { API_DATE_ISO, SYS_DATE_FORMAT } from '@/config/sys-constants';
import { apiErrorCode, errorMessage } from '@/utils/system-utils';
import { MAX_UNIT_PRICE, PRICE_TYPES, num, priceChannel, priceTypeLabel } from './zalo-limit-constants';
import { useSaveZaloPrices, useZaloPrices } from './use-zalo-limits';
import styles from './zalo-limit-management.module.scss';

// Zalo Sending Limits - Unit Prices page: VND per message (excluding VAT) by message type from an effective date.
// The price of each send is stored with the send, so a new price never rewrites past costs. OA messages stay free.

type PriceDraft = Partial<Record<ZaloMsgType, number | null>>;

/** Rows in the design order; a type the server does not list yet still gets a row. */
function toRows(prices: ZaloUnitPrice[] | undefined): ZaloUnitPrice[] {
  return PRICE_TYPES.map(
    (type) => prices?.find((row) => row.zaloMsgTypeCd === type) ?? { zaloMsgTypeCd: type, sentThisMonth: 0, amountThisMonth: 0, templates: [] },
  );
}

function buildColumns(
  t: TFunction,
  draft: PriceDraft,
  canWrite: boolean,
  onPrice: (type: ZaloMsgType, value: number | null) => void,
): TableColumnsType<ZaloUnitPrice> {
  return [
    {
      title: t('zalo.limits.prices.columns.msgType'),
      dataIndex: 'zaloMsgTypeCd',
      key: 'zaloMsgTypeCd',
      width: 150,
      render: (v: ZaloMsgType) => <strong>{priceTypeLabel(v)}</strong>,
    },
    {
      title: t('zalo.limits.prices.columns.channel'),
      key: 'channel',
      align: 'center',
      width: 80,
      render: (_: unknown, row) => priceChannel(row.zaloMsgTypeCd),
    },
    {
      title: t('zalo.limits.prices.columns.price'),
      key: 'untprc',
      align: 'right',
      width: 140,
      render: (_: unknown, row) => {
        const free = row.zaloMsgTypeCd === 'OA';
        const value = row.zaloMsgTypeCd in draft ? draft[row.zaloMsgTypeCd] : (row.untprc ?? null);
        return (
          <Spinbox
            className={styles.priceInput}
            value={free ? 0 : value}
            min={0}
            max={MAX_UNIT_PRICE}
            precision={0}
            disabled={free || !canWrite}
            aria-label={t('zalo.limits.prices.priceOf', { type: priceTypeLabel(row.zaloMsgTypeCd) })}
            onChange={(next) => onPrice(row.zaloMsgTypeCd, next ?? null)}
          />
        );
      },
    },
    {
      title: t('zalo.limits.prices.columns.sent'),
      dataIndex: 'sentThisMonth',
      key: 'sentThisMonth',
      align: 'right',
      width: 130,
      render: (v: number) => num(v),
    },
    {
      title: t('zalo.limits.prices.columns.amount'),
      dataIndex: 'amountThisMonth',
      key: 'amountThisMonth',
      align: 'right',
      width: 130,
      render: (v: number) => num(v),
    },
    {
      title: t('zalo.limits.prices.columns.templates'),
      dataIndex: 'templates',
      key: 'templates',
      ellipsis: true,
      render: (v: string[]) => (v.length ? v.join(', ') : '-'),
    },
  ];
}

/** First day of next month: a new price list usually starts with a billing month. */
const nextMonthStart = () => dayjs().add(1, 'month').startOf('month');

export default function ZaloUnitPrices({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const { data, isFetching } = useZaloPrices();
  const save = useSaveZaloPrices();
  const [draft, setDraft] = useState<PriceDraft>({});
  const [aplyBgngDt, setAplyBgngDt] = useState<Dayjs | null>(nextMonthStart);
  const rows = toRows(data);
  const changed = rows.filter((row) => row.zaloMsgTypeCd in draft && draft[row.zaloMsgTypeCd] !== (row.untprc ?? null));
  const totalSent = rows.reduce((sum, row) => sum + row.sentThisMonth, 0);
  const totalAmount = rows.reduce((sum, row) => sum + row.amountThisMonth, 0);

  const handleSave = async () => {
    if (!aplyBgngDt) {
      toast.error(t('messages.zalo.limits.priceDateRequired'));
      return;
    }
    if (changed.some((row) => draft[row.zaloMsgTypeCd] === null)) {
      toast.error(t('messages.zalo.limits.priceRequired'));
      return;
    }
    try {
      await save.mutateAsync({
        aplyBgngDt: aplyBgngDt.format(API_DATE_ISO),
        items: changed.map((row) => ({ zaloMsgTypeCd: row.zaloMsgTypeCd, untprc: draft[row.zaloMsgTypeCd] ?? 0 })),
      });
      setDraft({});
      toast.success(t('messages.zalo.limits.pricesSaved', { date: aplyBgngDt.format(SYS_DATE_FORMAT) }));
    } catch (error) {
      toast.error(apiErrorCode(error) === ZALO_ERRORS.oaPriceNotZero ? t('messages.zalo.limits.oaPriceNotZero') : errorMessage(error));
    }
  };

  return (
    <div className={styles.pageBody}>
      <SysSectionHeader
        title={
          <span className={styles.headerLine}>
            <strong>{t('zalo.limits.prices.title')}</strong>
            <span className={styles.headerSep}>|</span>
            <span className={styles.mutedText}>{t('zalo.limits.prices.subtitle')}</span>
            <AppDatePicker
              className={styles.dateInput}
              value={aplyBgngDt}
              format={SYS_DATE_FORMAT}
              placeholder="DD-MM-YYYY"
              disabled={!canWrite}
              aria-label={t('zalo.limits.prices.effective')}
              onChange={setAplyBgngDt}
            />
          </span>
        }
        primaryActions={
          canWrite && (
            <SysButton look="navy" loading={save.isPending} disabled={changed.length === 0} onClick={() => void handleSave()}>
              {t('zalo.limits.buttons.save')}
            </SysButton>
          )
        }
      />
      <SysTable<ZaloUnitPrice>
        rowKey="zaloMsgTypeCd"
        tableLayout="fixed"
        columns={buildColumns(t, draft, canWrite, (type, value) => setDraft((prev) => ({ ...prev, [type]: value })))}
        dataSource={rows}
        loading={isFetching}
        summary={() => (
          <Table.Summary.Row className={styles.totalRow}>
            <Table.Summary.Cell index={0} colSpan={3}>
              <strong>{t('zalo.limits.prices.total')}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="right">
              <strong>{num(totalSent)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right">
              <strong>{num(totalAmount)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={5} />
          </Table.Summary.Row>
        )}
      />
      <p className={styles.note}>{t('zalo.limits.prices.note')}</p>
    </div>
  );
}
