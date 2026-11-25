import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
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
} from '@/components/common/sys-ui/SysListUi';
import { SYS_PAGE_SIZE, USE_YN_FILTER_OPTIONS } from '@/config/sys-constants';
import { usePagedList } from '@/hooks/use-paged-list';
import { PROGRAM_TYPE_FILTER_OPTIONS, programTypeLabel } from './program-constants';
import { ProgramModal } from './ProgramModal';
import { useDownloadProgramsExcel, usePrograms } from './use-programs';
import styles from './program-management.module.scss';

// VPA09040101 Program Management (no delete: unused programs are set Inactive).

const INITIAL_FILTER: ProgramSearch = {
  useYn: '',
  prgrmSeCd: '',
  prgrmCd: '',
  prgrmNm: '',
};

export default function ProgramManagement() {
  const { canWrite } = useMenuPermission();
  const list = usePagedList<ProgramSearch>(INITIAL_FILTER);
  const [modalItem, setModalItem] = useState<ProgramItem | null | undefined>(undefined);
  const { data, isFetching } = usePrograms(list.applied, list.pageQuery);
  const excel = useDownloadProgramsExcel();

  const columns: TableColumnsType<ProgramItem> = [
    {
      title: 'Use',
      dataIndex: 'useYn',
      sorter: true,
      align: 'center',
      width: 80,
      render: (v: string) => <UseBadge value={v} />,
    },
    { title: 'Menu Code', dataIndex: 'menuCd', sorter: true, width: 200 },
    { title: 'Program Code', dataIndex: 'prgrmCd', sorter: true, width: 200 },
    {
      title: 'Type',
      dataIndex: 'prgrmSeCd',
      sorter: true,
      width: 90,
      render: (v: string) => programTypeLabel(v),
    },
    { title: 'Order', dataIndex: 'prgrmSeq', sorter: true, width: 80 },
    { title: 'Program Name', dataIndex: 'prgrmNm', sorter: true, width: 240 },
    {
      title: 'Program Description',
      dataIndex: 'prgrmExpln',
      sorter: true,
      render: (v?: string) => <span className={styles.ellipsis}>{v || '-'}</span>,
    },
  ];

  return (
    <SysPage fill>
      <SysTitleBar
        title="Program Management"
        breadcrumb={['System Operation Management', 'System Management', 'Program Management']}
      />
      <SysFilterPanel>
        <SysFilterItem label="Use">
          <AppSelect
            options={USE_YN_FILTER_OPTIONS}
            value={list.draft.useYn}
            onChange={(useYn) => list.setDraft({ useYn: (useYn ?? '') as ProgramSearch['useYn'] })}
          />
        </SysFilterItem>
        <SysFilterItem label="Type">
          <AppSelect
            options={PROGRAM_TYPE_FILTER_OPTIONS}
            value={list.draft.prgrmSeCd}
            onChange={(prgrmSeCd) =>
              list.setDraft({
                prgrmSeCd: (prgrmSeCd ?? '') as ProgramSearch['prgrmSeCd'],
              })
            }
          />
        </SysFilterItem>
        <SysFilterItem label="Program Code">
          <TextInput
            value={list.draft.prgrmCd}
            allowClear
            onChange={(e) => list.setDraft({ prgrmCd: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Program Name">
          <TextInput
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
      <div className={styles.listBody}>
        <SysTable<ProgramItem>
          fill
          rowKey="prgrmCd"
          columns={columns}
          dataSource={data?.content}
          loading={isFetching}
          onRowClick={setModalItem}
          sort={list.sort}
          onSortChange={list.setSort}
        />
        <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={data?.totalElements ?? 0} onChange={list.setPage} />
      </div>

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
