import { useState } from 'react';
import { Input, Select } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { ProgramItem, ProgramSearch } from '@/api/system/program-screen-api';
import {
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
} from '@/features/system/_shared/SysListUi';
import { SYS_PAGE_SIZE, USE_YN_FILTER_OPTIONS } from '@/features/system/_shared/sys-constants';
import { usePagedList } from '@/features/system/_shared/use-paged-list';
import { PROGRAM_TYPE_FILTER_OPTIONS, programTypeLabel } from './program-constants';
import { ProgramModal } from './ProgramModal';
import { useDownloadProgramsExcel, usePrograms } from './use-programs';
import styles from './program-management.module.scss';

// VPA09040101 Program Management (no delete: unused programs are set Inactive).

const INITIAL_FILTER: ProgramSearch = { useYn: '', prgrmSeCd: '', prgrmCd: '', prgrmNm: '' };

export default function ProgramManagement() {
  const { canWrite } = useMenuPermission();
  const list = usePagedList<ProgramSearch>(INITIAL_FILTER);
  const [modalItem, setModalItem] = useState<ProgramItem | null | undefined>(undefined);
  const { data, isFetching } = usePrograms(list.applied, list.pageQuery);
  const excel = useDownloadProgramsExcel();

  const columns: TableColumnsType<ProgramItem> = [
    { title: 'Use', dataIndex: 'useYn', align: 'center', width: 100, render: (v: string) => <UseBadge value={v} /> },
    { title: 'Menu Code', dataIndex: 'menuCd', align: 'center', width: 130 },
    { title: 'Program Code', dataIndex: 'prgrmCd', align: 'center', width: 150 },
    { title: 'Type', dataIndex: 'prgrmSeCd', align: 'center', width: 90, render: (v: string) => programTypeLabel(v) },
    { title: 'Order', dataIndex: 'prgrmSeq', align: 'center', width: 80 },
    { title: 'Program Name', dataIndex: 'prgrmNm', width: 240 },
    {
      title: 'Program Description',
      dataIndex: 'prgrmExpln',
      render: (v?: string) => <span className={styles.ellipsis}>{v || '-'}</span>,
    },
  ];

  return (
    <SysPage>
      <SysTitleBar
        title="Program Management"
        breadcrumb={['System Operation Management', 'System Management', 'Program Management']}
      />
      <SysFilterPanel columns={4}>
        <SysFilterItem label="Use">
          <Select options={USE_YN_FILTER_OPTIONS} value={list.draft.useYn} onChange={(useYn) => list.setDraft({ useYn })} />
        </SysFilterItem>
        <SysFilterItem label="Type">
          <Select
            options={PROGRAM_TYPE_FILTER_OPTIONS}
            value={list.draft.prgrmSeCd}
            onChange={(prgrmSeCd) => list.setDraft({ prgrmSeCd })}
          />
        </SysFilterItem>
        <SysFilterItem label="Program Code">
          <Input
            value={list.draft.prgrmCd}
            allowClear
            onChange={(e) => list.setDraft({ prgrmCd: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Program Name">
          <Input
            value={list.draft.prgrmNm}
            allowClear
            onChange={(e) => list.setDraft({ prgrmNm: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />

      <SysSectionHeader
        total={data?.totalElements ?? 0}
        actions={<SysExcelButton loading={excel.isPending} onClick={() => excel.mutate(list.applied)} />}
        primaryActions={
          canWrite && (
            <SysButton look="navy" onClick={() => setModalItem(null)}>
              New
            </SysButton>
          )
        }
      />
      <SysTable<ProgramItem>
        rowKey="prgrmCd"
        columns={columns}
        dataSource={data?.content}
        loading={isFetching}
        onRowClick={setModalItem}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={data?.totalElements ?? 0} onChange={list.setPage} />

      {modalItem !== undefined && (
        <ProgramModal
          key={modalItem?.prgrmCd ?? 'new'}
          item={modalItem}
          canWrite={canWrite}
          onClose={() => setModalItem(undefined)}
        />
      )}
    </SysPage>
  );
}
