import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import type { ZaloChangeHistory } from '@/api/system/zalo-api';
import { DateTimeText, SysTable } from '@/components/common/sys-ui/SysListUi';
import { actorText } from './zalo-messages';
import styles from './zalo-shared.module.scss';

// Change History tab of Zalo Templates / Sending Limits: Changed At | By | Field | Before → After.

function buildColumns(t: TFunction): TableColumnsType<ZaloChangeHistory> {
  return [
    {
      title: t('zalo.history.columns.chgDt'),
      dataIndex: 'chgDt',
      key: 'chgDt',
      align: 'center',
      width: 130,
      render: (v: string) => <DateTimeText value={v} />,
    },
    { title: t('zalo.history.columns.chgBy'), dataIndex: 'chgBy', key: 'chgBy', align: 'center', width: 90, render: (v?: string) => actorText(v) },
    { title: t('zalo.history.columns.item'), dataIndex: 'chgItemNm', key: 'chgItemNm', width: 120, ellipsis: true },
    {
      title: t('zalo.history.columns.change'),
      key: 'change',
      ellipsis: true,
      render: (_: unknown, row) => {
        if (row.bfrVal == null) return row.aftrVal ?? '-';
        return (
          <span title={`${row.bfrVal} → ${row.aftrVal ?? '-'}`}>
            {row.bfrVal}
            <span className={styles.changeArrow}>→</span>
            {row.aftrVal ?? '-'}
          </span>
        );
      },
    },
  ];
}

interface ZaloChangeHistoryTableProps {
  rows: ZaloChangeHistory[];
  loading?: boolean;
}

export default function ZaloChangeHistoryTable({ rows, loading }: ZaloChangeHistoryTableProps) {
  const { t } = useTranslation();
  return (
    <SysTable<ZaloChangeHistory>
      rowKey={(row, index) => `${row.chgDt}-${row.chgItemNm}-${index ?? 0}`}
      className={styles.historyTable}
      tableLayout="fixed"
      columns={buildColumns(t)}
      dataSource={rows}
      loading={loading}
    />
  );
}
