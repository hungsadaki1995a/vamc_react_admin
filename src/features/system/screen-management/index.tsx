import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { ScreenItem, ScreenSearch, ScreenType } from '@/api/system/program-screen-api';
import {
  StatusBadge,
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
} from '@/features/system/_shared/SysListUi';
import { ALL, SYS_PAGE_SIZE } from '@/features/system/_shared/sys-constants';
import { usePagedList } from '@/features/system/_shared/use-paged-list';
import { businessName, SCREEN_TYPE_FILTER_OPTIONS } from './screen-constants';
import { ScreenModal } from './ScreenModal';
import { useBusinessOptions, useDownloadScreensExcel, useScreens } from './use-screens';
import styles from './screen-management.module.scss';

// VPA09040201 Screen Management.

const INITIAL_FILTER: ScreenSearch = {
  sysSeCd: ALL,
  menuCd: ALL,
  scrnId: '',
  scrnNm: '',
};
const EMPTY = '-';

export default function ScreenManagement() {
  const { canWrite } = useMenuPermission();
  const list = usePagedList<ScreenSearch>(INITIAL_FILTER);
  const [modalItem, setModalItem] = useState<ScreenItem | null | undefined>(undefined);
  const { data, isFetching } = useScreens(list.applied, list.pageQuery);
  const excel = useDownloadScreensExcel();
  const businessOptions = useBusinessOptions((list.draft.sysSeCd ?? ALL) as ScreenType | '');

  // Widths follow the design proportions; the fixed layout lets long text ellipsize instead of widening the table.
  const columns: TableColumnsType<ScreenItem> = [
    {
      title: 'Type',
      dataIndex: 'sysSeCd',
      sorter: true,
      align: 'center',
      width: 80,
      render: (type?: ScreenType) =>
        type ? (
          <StatusBadge tone={type === 'W' ? 'blue' : 'gray'}>{type === 'W' ? 'Web' : 'Admin'}</StatusBadge>
        ) : (
          EMPTY
        ),
    },
    {
      title: 'Business',
      dataIndex: 'menuCd',
      sorter: true,
      width: 170,
      ellipsis: true,
      render: (_v, row) => businessName(row) ?? EMPTY,
    },
    {
      title: 'Screen ID',
      dataIndex: 'scrnId',
      sorter: true,
      width: 130,
      ellipsis: true,
    },
    {
      title: 'Screen Name',
      dataIndex: 'scrnNm',
      sorter: true,
      width: 200,
      ellipsis: true,
      render: (v?: string) => v || EMPTY,
    },
    {
      title: 'Component Path',
      dataIndex: 'cmpntPathNm',
      sorter: true,
      width: 220,
      ellipsis: true,
      render: (v?: string) => v || EMPTY,
    },
    {
      title: 'Label Key',
      dataIndex: 'lblCd',
      sorter: true,
      width: 170,
      ellipsis: true,
      render: (v?: string) => v || EMPTY,
    },
    {
      title: 'Popup',
      dataIndex: 'popupYn',
      sorter: true,
      width: 80,
      render: (v?: string) => (v === 'Y' ? 'Yes' : 'No'),
    },
    {
      title: 'Remarks',
      dataIndex: 'scrnExpln',
      sorter: true,
      ellipsis: true,
      render: (v?: string) => v || EMPTY,
    },
  ];

  return (
    <SysPage fill>
      <SysTitleBar
        title="Screen Management"
        breadcrumb={['System Operation Management', 'System Management', 'Screen Management']}
      />
      <SysFilterPanel>
        <SysFilterItem label="Type">
          <AppSelect
            options={SCREEN_TYPE_FILTER_OPTIONS}
            value={list.draft.sysSeCd ?? ALL}
            // Business options depend on the type: a new type clears the business.
            onChange={(v) =>
              list.setDraft({
                sysSeCd: (v ?? ALL) as ScreenType | '',
                menuCd: ALL,
              })
            }
          />
        </SysFilterItem>
        <SysFilterItem label="Business">
          <AppSelect
            showSearch
            optionFilterProp="label"
            options={[{ value: ALL, label: 'All' }, ...businessOptions]}
            value={list.draft.menuCd ?? ALL}
            onChange={(v) => list.setDraft({ menuCd: String(v ?? ALL) })}
          />
        </SysFilterItem>
        <SysFilterItem label="Screen ID">
          <TextInput
            value={list.draft.scrnId}
            maxLength={20}
            allowClear
            onChange={(e) => list.setDraft({ scrnId: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Screen Name">
          <TextInput
            value={list.draft.scrnNm}
            maxLength={200}
            allowClear
            onChange={(e) => list.setDraft({ scrnNm: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />

      <SysSectionHeader
        total={data?.totalElements ?? 0}
        actions={
          <SysExcelButton
            loading={excel.isPending}
            onClick={() =>
              excel.mutate({
                search: list.applied,
                sort: {
                  sortBy: list.sort?.sortBy,
                  sortDirection: list.sort?.sortDirection,
                },
              })
            }
          />
        }
        primaryActions={
          canWrite && (
            <SysButton look="navy" onClick={() => setModalItem(null)}>
              New
            </SysButton>
          )
        }
      />
      <div className={styles.listBody}>
        <SysTable<ScreenItem>
          fill
          tableLayout="fixed"
          rowKey="scrnId"
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
