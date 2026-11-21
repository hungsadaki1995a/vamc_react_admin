import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { ScreenItem, ScreenSearch } from '@/api/system/program-screen-api';
import {
  StatusBadge,
  SysButton,
  SysExcelButton,
  SysFilterItem,
  SysFilterPanel,
  SysNotAvailable,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
} from '@/features/system/_shared/SysListUi';
import { ALL, SYS_PAGE_SIZE } from '@/features/system/_shared/sys-constants';
import { usePagedList } from '@/features/system/_shared/use-paged-list';
import { NOT_AVAILABLE_REASON, SCREEN_TYPE_FILTER_OPTIONS, screenTypeOf } from './screen-constants';
import { ScreenModal } from './ScreenModal';
import { useDownloadScreensExcel, useScreens } from './use-screens';
import styles from './screen-management.module.scss';

// VPA09040201 Screen Management.
// Type / Business / Screen Name / Component Path / Label Key / Popup wait for the SCRN_MNG
// schema change: filters are disabled, columns show "-" (Type is guessed from the ID prefix).

const INITIAL_FILTER: ScreenSearch = { scrnId: '', keyword: '' };
const EMPTY = '-';

export default function ScreenManagement() {
  const { canWrite } = useMenuPermission();
  const list = usePagedList<ScreenSearch>(INITIAL_FILTER);
  const [modalItem, setModalItem] = useState<ScreenItem | null | undefined>(undefined);
  const { data, isFetching } = useScreens(list.applied, list.pageQuery);
  const excel = useDownloadScreensExcel();

  const columns: TableColumnsType<ScreenItem> = [
    {
      title: 'Type',
      key: 'type',
      align: 'center',
      width: 90,
      render: (_v, row) => {
        const type = screenTypeOf(row.scrnId);
        if (!type) return EMPTY;
        return <StatusBadge tone={type === 'W' ? 'blue' : 'gray'}>{type === 'W' ? 'Web' : 'Admin'}</StatusBadge>;
      },
    },
    { title: 'Business', key: 'business', align: 'center', width: 120, render: () => EMPTY },
    {
      title: 'Screen ID',
      dataIndex: 'scrnId',
      width: 150,
      render: (value: string, row) => (
        <button
          type="button"
          className={styles.codeLink}
          onClick={(e) => {
            e.stopPropagation();
            setModalItem(row);
          }}
        >
          {value}
        </button>
      ),
    },
    { title: 'Screen Name', key: 'scrnNm', width: 160, render: () => EMPTY },
    { title: 'Component Path', key: 'componentPath', width: 180, render: () => EMPTY },
    { title: 'Label Key', key: 'lblKey', width: 140, render: () => EMPTY },
    { title: 'Popup', key: 'popup', align: 'center', width: 80, render: () => EMPTY },
    {
      title: 'Remarks',
      dataIndex: 'scrnExpln',
      render: (v?: string) => <span className={styles.ellipsis}>{v || EMPTY}</span>,
    },
  ];

  return (
    <SysPage>
      <SysTitleBar
        title="Screen Management"
        breadcrumb={['System Operation Management', 'System Management', 'Screen Management']}
      />
      <SysFilterPanel columns={4}>
        <SysFilterItem label="Type" hint={<SysNotAvailable variant="inline" />}>
          <AppSelect options={SCREEN_TYPE_FILTER_OPTIONS} value={ALL} disabled title={NOT_AVAILABLE_REASON} />
        </SysFilterItem>
        <SysFilterItem label="Business" hint={<SysNotAvailable variant="inline" />}>
          <AppSelect options={[{ value: ALL, label: 'All' }]} value={ALL} disabled title={NOT_AVAILABLE_REASON} />
        </SysFilterItem>
        <SysFilterItem label="Screen ID">
          <TextInput
            value={list.draft.scrnId}
            allowClear
            onChange={(e) => list.setDraft({ scrnId: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Screen Name">
          {/* TODO(schema): search the screen name column; matches remarks / program name for now. */}
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
      <SysTable<ScreenItem>
        rowKey="scrnId"
        columns={columns}
        dataSource={data?.content}
        loading={isFetching}
        onRowClick={setModalItem}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={data?.totalElements ?? 0} onChange={list.setPage} />

      {modalItem !== undefined && (
        <ScreenModal
          key={modalItem?.scrnId ?? 'new'}
          item={modalItem}
          canWrite={canWrite}
          onClose={() => setModalItem(undefined)}
        />
      )}
    </SysPage>
  );
}
