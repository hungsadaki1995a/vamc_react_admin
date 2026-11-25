import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { AppRangePicker } from '@/components/inputs/AppDatePicker';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
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
} from '@/components/common/sys-ui/SysListUi';
import { ALL, API_DATE_DMY, SYS_DATE_FORMAT, SYS_PAGE_SIZE, USE_YN_FILTER_OPTIONS } from '@/config/sys-constants';
import { usePagedList } from '@/hooks/use-paged-list';
import {
  FEE_CATEGORY_FILTER_OPTIONS,
  FEE_METHOD_LABELS,
  feeCategoryLabel,
  feeValueText,
  formatFeeNumber,
} from './fee-constants';
import FeeModal from './FeeModal';
import FeeScheduleModal from './FeeScheduleModal';
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

// Column order of the v0.8 frame: Fee Code, Use, Type, Order, Item Name, Fee Item Content, Method, Currency, Fee, Minimum Amount, Registered Date.
const columns: TableColumnsType<Fee> = [
  { title: 'Fee Code', dataIndex: 'feeId', sorter: true, align: 'center', width: 130 },
  { title: 'Use', dataIndex: 'useYn', sorter: true, align: 'center', width: 80, render: (v: YesNo) => <UseBadge value={v} /> },
  { title: 'Type', dataIndex: 'category', sorter: true, width: 150, ellipsis: true, render: (_: string, row) => feeCategoryLabel(row) },
  { title: 'Order', dataIndex: 'order', sorter: true, align: 'center', width: 76 },
  { title: 'Item Name', dataIndex: 'name', sorter: true, width: 180, ellipsis: true },
  // Takes the remaining width (fixed layout) and is ellipsized, as in the frame.
  { title: 'Fee Item Content', dataIndex: 'description', sorter: true, ellipsis: true, render: (v?: string) => v || '-' },
  {
    title: 'Method',
    dataIndex: 'method',
    sorter: true,
    width: 90,
    render: (v: Fee['method'], row) => FEE_METHOD_LABELS[v] ?? row.methodNm ?? v,
  },
  { title: 'Currency', dataIndex: 'currency', sorter: true, width: 96 },
  {
    title: 'Fee',
    key: 'fee',
    sorter: true,
    align: 'right',
    width: 110,
    render: (_: unknown, row) => <span className={styles.numberCell}>{feeValueText(row)}</span>,
  },
  {
    title: 'Minimum Amount',
    dataIndex: 'minAmount',
    sorter: true,
    align: 'right',
    width: 140,
    render: (v?: number) => <span className={styles.numberCell}>{formatFeeNumber(v)}</span>,
  },
  { title: 'Registered Date', dataIndex: 'crtDt', sorter: true, align: 'center', width: 150, render: (v?: string) => <DateTimeText value={v} /> },
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
      <SysFilterPanel>
        <SysFilterItem label="Use">
          <AppSelect value={list.draft.useYn} options={USE_YN_FILTER_OPTIONS} onChange={(useYn) => list.setDraft({ useYn: String(useYn ?? '') as YesNo | '' })} />
        </SysFilterItem>
        <SysFilterItem label="Type">
          <AppSelect
            value={list.draft.category}
            options={FEE_CATEGORY_FILTER_OPTIONS}
            onChange={(category) => list.setDraft({ category: String(category ?? '') as FeeCategory | '' })}
          />
        </SysFilterItem>
        <SysFilterItem label="Registration Period">
          <AppRangePicker
            className={styles.rangePicker}
            value={list.draft.period}
            format={SYS_DATE_FORMAT}
            placeholder={['DD-MM-YYYY', 'DD-MM-YYYY']}
            allowEmpty={[true, true]}
            onChange={(period) => list.setDraft({ period })}
          />
        </SysFilterItem>
        <SysFilterItem label="Item/Content">
          <TextInput
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
        actions={<SysExcelButton onClick={() => excel.mutate(search)} loading={excel.isPending} />}
        primaryActions={
          // Frame: [Excel Download] | [Fee Schedule] [New]
          <>
            <SysButton onClick={() => setScheduleOpen(true)}>Fee Schedule</SysButton>
            {canWrite && (
              <SysButton look="navy" onClick={() => setModal({ feeId: null })}>
                New
              </SysButton>
            )}
          </>
        }
      />
      <SysTable<Fee>
        rowKey="feeId"
        className={styles.listTable}
        fill
        // Fixed columns + at least 240px of Fee Item Content; fits without scrolling from a 1920px screen.
        tableLayout="fixed"
        scroll={{ x: 1440 }}
        columns={columns}
        dataSource={data?.content ?? []}
        loading={isFetching}
        onRowClick={(fee) => setModal({ feeId: fee.feeId })}
        sort={list.sort}
        onSortChange={list.setSort}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
      {modal && (
        <FeeModal key={modal.feeId ?? 'new'} feeId={modal.feeId} canWrite={canWrite} onClose={() => setModal(null)} />
      )}
      {scheduleOpen && <FeeScheduleModal canWrite={canWrite} onClose={() => setScheduleOpen(false)} />}
    </SysPage>
  );
}
