import { useMemo, useState } from 'react';
import { Checkbox, Input, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import type { ExchangeRateItem } from '@/api/system/system-operations-api';
import { DateTimeCell, SysPageHeader } from '@/features/system/_shared/system-ui';
import { errorMessage } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import { useExchangeRates, useSyncExchangeRates } from './use-exchange-rates';

/** Exchange Rate Management (menu A06010500). */
export default function ExchangeRateManagement() {
  const { toast } = useNotify();
  const [displayedOnly, setDisplayedOnly] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const { data, isFetching, refetch } = useExchangeRates(displayedOnly);
  const syncRates = useSyncExchangeRates();
  const syncing = syncRates.isPending;

  const rows = useMemo(() => {
    const list = data ?? [];
    const kw = appliedKeyword.trim().toLowerCase();
    if (!kw) return list;
    return list.filter(
      (r) =>
        r.currencyCode.toLowerCase().includes(kw) ||
        r.currencyName.toLowerCase().includes(kw),
    );
  }, [data, appliedKeyword]);

  const handleSearch = () => {
    setAppliedKeyword(keyword);
    void refetch();
  };

  const handleReset = () => {
    setDisplayedOnly(false);
    setKeyword('');
    setAppliedKeyword('');
  };

  const handleSync = async () => {
    try {
      const res = await syncRates.mutateAsync();
      const count = res.data?.success ?? 0;
      toast.success(`Synced ${count} exchange rates from Vietcombank.`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const columns: TableColumnsType<ExchangeRateItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => i + 1 },
    { title: 'Currency Code', dataIndex: 'currencyCode', width: 120, align: 'center' },
    { title: 'Currency Name', dataIndex: 'currencyName', width: 220 },
    {
      title: 'Cash Buy',
      dataIndex: 'cashBuy',
      width: 130,
      align: 'right',
      render: (v?: number | string | null) => (v != null && v !== '' ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'),
    },
    {
      title: 'Transfer Buy',
      dataIndex: 'transferBuy',
      width: 130,
      align: 'right',
      render: (v?: number | string | null) => (v != null && v !== '' ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'),
    },
    {
      title: 'Sell',
      dataIndex: 'sell',
      width: 130,
      align: 'right',
      render: (v?: number | string | null) => (v != null && v !== '' ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'),
    },
    {
      title: 'Displayed',
      dataIndex: 'displayed',
      width: 100,
      align: 'center',
      render: (v: string | boolean) => {
        const isYes = v === 'Y' || v === true;
        return <span className={isYes ? styles.useY : styles.useN}>{isYes ? 'Yes' : 'No'}</span>;
      },
    },
    {
      title: 'Reference Time',
      dataIndex: 'referenceDateTime',
      width: 150,
      align: 'center',
      render: (v?: string) => <DateTimeCell value={v} />,
    },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['System Operation Management', 'NPL Platform Management', 'Exchange Rate Management']}
        title="Exchange Rate Management"
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />

      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Currency</span>
            <Input
              className={styles.filterInput}
              placeholder="USD, EUR, VND..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
          <div className={styles.filterGroup}>
            <Checkbox checked={displayedOnly} onChange={(e) => setDisplayedOnly(e.target.checked)}>
              Displayed Only
            </Checkbox>
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({rows.length})</span>
        <button
          type="button"
          className={styles.btnDark}
          disabled={syncing}
          onClick={() => void handleSync()}
        >
          {syncing ? 'Syncing...' : 'Sync Vietcombank'}
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <Table<ExchangeRateItem>
          rowKey="currencyCode"
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
}
