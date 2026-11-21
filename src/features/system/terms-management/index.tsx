import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { TermsPolicyItem, TermsPolicySearch, TermsStatus } from '@/api/system/terms-api';
import {
  DateTimeText,
  StatusBadge,
  SysButton,
  SysFilterItem,
  SysFilterPanel,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
} from '@/features/system/_shared/SysListUi';
import { SYS_PAGE_SIZE } from '@/features/system/_shared/sys-constants';
import { usePagedList } from '@/features/system/_shared/use-paged-list';
import { TERMS_STATUS, TERMS_STATUS_FILTER_OPTIONS, TERMS_TYPE_FILTER_OPTIONS, termsTypeLabel } from './terms-constants';
import { TermsModal } from './TermsModal';
import { useTermsPolicies } from './use-terms-policies';

// VPA09010701 Terms Management: versions of Terms of Use / Privacy Policy by effective date.

const INITIAL_FILTER: TermsPolicySearch = { type: '', status: '' };

export default function TermsManagement() {
  const { canWrite } = useMenuPermission();
  const list = usePagedList<TermsPolicySearch>(INITIAL_FILTER);
  // undefined = closed, null = register, string = row opened.
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);
  const { data, isFetching } = useTermsPolicies(list.applied, list.pageQuery);

  const columns: TableColumnsType<TermsPolicyItem> = [
    {
      title: 'Effective Date',
      dataIndex: 'effectiveDate',
      align: 'center',
      render: (v?: string) => <DateTimeText value={v} dateOnly />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (v: TermsStatus) =>
        TERMS_STATUS[v] ? <StatusBadge tone={TERMS_STATUS[v].tone}>{TERMS_STATUS[v].label}</StatusBadge> : (v ?? '-'),
    },
    { title: 'Terms Type', dataIndex: 'type', align: 'center', render: (v: string) => termsTypeLabel(v) },
    {
      title: 'Language',
      dataIndex: 'languages',
      align: 'center',
      render: (v?: string[]) => (v?.length ? v.join(', ') : '-'),
    },
    { title: 'Registered By', dataIndex: 'crtByNm', align: 'center', render: (v: string | undefined, row) => v || row.crtBy || '-' },
    { title: 'Registered Date', dataIndex: 'crtDt', align: 'center', render: (v?: string) => <DateTimeText value={v} dateOnly /> },
  ];

  return (
    <SysPage>
      <SysTitleBar title="Terms Management" breadcrumb={['System Operation Management', 'NPL Platform Management', 'Terms Management']} />
      <SysFilterPanel>
        <SysFilterItem label="Terms Type">
          <AppSelect options={TERMS_TYPE_FILTER_OPTIONS} value={list.draft.type} onChange={(type) => list.setDraft({ type })} />
        </SysFilterItem>
        <SysFilterItem label="Status">
          <AppSelect
            options={TERMS_STATUS_FILTER_OPTIONS}
            value={list.draft.status}
            onChange={(status) => list.setDraft({ status })}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />

      <SysSectionHeader
        total={data?.totalElements ?? 0}
        primaryActions={
          canWrite && (
            <SysButton look="navy" onClick={() => setOpenId(null)}>
              New
            </SysButton>
          )
        }
      />
      <SysTable<TermsPolicyItem>
        rowKey="termsId"
        columns={columns}
        dataSource={data?.content}
        loading={isFetching}
        onRowClick={(row) => setOpenId(row.termsId)}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={data?.totalElements ?? 0} onChange={list.setPage} />

      {openId !== undefined && (
        <TermsModal key={openId ?? 'new'} termsId={openId} canWrite={canWrite} onClose={() => setOpenId(undefined)} />
      )}
    </SysPage>
  );
}
