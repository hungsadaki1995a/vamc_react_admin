import { useState } from 'react';
import { DatePicker, Input, Select } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { Fee, FeeCategory, FeeSearch, YesNo } from '@/api/system/fee-api';
import {
  DateTimeText,
  SysButton,
  SysExcelButton,
  SysFilterItem,
  SysFilterPanel,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
  UseBadge,
} from '../_shared/sys-list-ui';
import { ALL, API_DATE_DMY, SYS_DATE_FORMAT, SYS_PAGE_SIZE, USE_YN_FILTER_OPTIONS } from '../_shared/sys-constants';
import { formatAmount } from '../_shared/system-utils';
import { usePagedList } from '../_shared/use-paged-list';
import { FEE_CATEGORY_FILTER_OPTIONS, FEE_METHOD_LABELS, feeCategoryLabel, feeValueText } from './fee-constants';
import FeeModal from './fee-modal';
import FeeScheduleModal from './fee-schedule-modal';
import { useDownloadFeeExcel, useFees } from './use-fees';
import styles from './fee-management.module.scss';

// Fee Management - List (VPA09010301). Saved items apply to the user Fee Guide immediately.

interface FeeFilter {
  useYn: YesNo | '';
  category: FeeCategory | '';
  period: [Dayjs | null, Dayjs | null] | null;
  keyword: string;
}

const INITIAL_FILTER: FeeFilter = { useYn: ALL, category: ALL, period: null, keyword: '' };

function toSearch(filter: FeeFilter): FeeSearch {
  return {
    useYn: filter.useYn,
    category: filter.category,
    fromDate: filter.period?.[0]?.format(API_DATE_DMY),
    toDate: filter.period?.[1]?.format(API_DATE_DMY),
    keyword: filter.keyword.trim(),
  };
}

const columns: TableColumnsType<Fee> = [
  { title: 'Use', dataIndex: 'useYn', align: 'center', width: 100, render: (v: YesNo) => <UseBadge value={v} /> },
  { title: 'Fee Code', dataIndex: 'feeId', align: 'center', width: 130 },
  { title: 'Type', dataIndex: 'category', align: 'center', width: 160, render: (_: string, row) => feeCategoryLabel(row) },
  { title: 'Order', dataIndex: 'order', align: 'center', width: 70 },
  { title: 'Item Name', dataIndex: 'name' },
  { title: 'Fee Item Content', dataIndex: 'description', render: (v?: string) => v || '-' },
  {
    title: 'Method',
    dataIndex: 'method',
    align: 'center',
    width: 90,
    render: (v: Fee['method'], row) => FEE_METHOD_LABELS[v] ?? row.methodNm ?? v,
  },
  { title: 'Currency', dataIndex: 'currency', align: 'center', width: 90 },
  {
    title: 'Fee',
    key: 'fee',
    align: 'right',
    width: 130,
    render: (_: unknown, row) => <span className={styles.numberCell}>{feeValueText(row)}</span>,
  },
  {
    title: 'Minimum Amount',
    dataIndex: 'minAmount',
    align: 'right',
    width: 140,
    render: (v?: number) => <span className={styles.numberCell}>{formatAmount(v)}</span>,
  },
  { title: 'Registered Date', dataIndex: 'crtDt', align: 'center', width: 160, render: (v?: string) => <DateTimeText value={v} /> },
];

/** Popup state: closed, register (null) or edit (fee id). */
type ModalState = { feeId: string | null } | null;

export default function FeeManagement() {
  const { canWrite } = useMenuPermission();
  const list = usePagedList<FeeFilter>(INITIAL_FILTER);
  const search = toSearch(list.applied);
  const { data, isFetching } = useFees(search, list.pageQuery);
  const excel = useDownloadFeeExcel();
  const [modal, setModal] = useState<ModalState>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const total = data?.totalElements ?? 0;

  return (
    <SysPage>
      <SysTitleBar title="Fee Management" breadcrumb={['System Operation Management', 'NPL Platform Management', 'Fee Management']} />
      <SysFilterPanel columns={4}>
        <SysFilterItem label="Use">
          <Select value={list.draft.useYn} options={USE_YN_FILTER_OPTIONS} onChange={(useYn) => list.setDraft({ useYn })} />
        </SysFilterItem>
        <SysFilterItem label="Type">
          <Select
            value={list.draft.category}
            options={FEE_CATEGORY_FILTER_OPTIONS}
            onChange={(category) => list.setDraft({ category })}
          />
        </SysFilterItem>
        <SysFilterItem label="Registration Period">
          <DatePicker.RangePicker
            className={styles.rangePicker}
            value={list.draft.period}
            format={SYS_DATE_FORMAT}
            placeholder={['DD-MM-YYYY', 'DD-MM-YYYY']}
            allowEmpty={[true, true]}
            onChange={(period) => list.setDraft({ period })}
          />
        </SysFilterItem>
        <SysFilterItem label="Item/Content">
          <Input
            value={list.draft.keyword}
            allowClear
            onChange={(e) => list.setDraft({ keyword: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />
      <SysSectionHeader
        total={total}
        actions={
          <>
            <SysButton onClick={() => setScheduleOpen(true)}>Fee Schedule</SysButton>
            <SysExcelButton onClick={() => excel.mutate(search)} loading={excel.isPending} />
          </>
        }
        primaryActions={
          canWrite && (
            <SysButton look="navy" onClick={() => setModal({ feeId: null })}>
              New
            </SysButton>
          )
        }
      />
      <SysTable<Fee>
        rowKey="feeId"
        columns={columns}
        dataSource={data?.content ?? []}
        loading={isFetching}
        onRowClick={(fee) => setModal({ feeId: fee.feeId })}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
      {modal && (
        <FeeModal key={modal.feeId ?? 'new'} feeId={modal.feeId} canWrite={canWrite} onClose={() => setModal(null)} />
      )}
      {scheduleOpen && <FeeScheduleModal canWrite={canWrite} onClose={() => setScheduleOpen(false)} />}
    </SysPage>
  );
}
