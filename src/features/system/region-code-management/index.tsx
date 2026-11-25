import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { ProvinceItem, ProvinceSearch } from '@/api/system/location-api';
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
  SysSplit,
  SysTable,
  SysTitleBar,
  UseBadge,
} from '@/components/common/sys-ui/SysListUi';
import { SYS_PAGE_SIZE } from '@/config/sys-constants';
import { usePagedList } from '@/hooks/use-paged-list';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { apiErrorCode } from '@/utils/system-utils';
import { ApiError } from '@/lib/api/error';
import { CodeDetailGrid } from '@/features/system/common-code-management/CodeDetailGrid';
import type { GridChanges, GridColumn, GridRecord } from '@/features/system/common-code-management/CodeDetailGrid';
import styles from '@/features/system/common-code-management/common-code-management.module.scss';
import { ProvinceModal } from './ProvinceModal';
import { useBatchSaveDistricts, useDistricts, useDownloadProvincesExcel, useProvinces } from './use-regions';

// VPA09030201 Region Code Management: provinces / cities (left) + editable district codes (right).

// Code Name takes the rest of the panel (frame VPA09030201).
const DISTRICT_COLUMNS: GridColumn[] = [
  { field: 'useYn', title: 'Use', kind: 'use', required: true, width: 92, sortable: true },
  { field: 'distCd', title: 'District Code', kind: 'text', required: true, isKey: true, maxLength: 5, width: '20%', sortable: true },
  { field: 'distNm', title: 'Code Name', kind: 'text', required: true, maxLength: 40, sortable: true },
  { field: 'crtDt', title: 'Registered Date', kind: 'date', width: 140, sortable: true },
];

const INITIAL_FILTER: ProvinceSearch = { mctpvCd: '', mctpvNm: '' };

/** Already registered (COD006) or used by another province (409 without code). */
const isDuplicateDistrict = (e: unknown) =>
  apiErrorCode(e) === 'COD006' || (e instanceof ApiError && e.statusCode === 409);

export default function RegionCodeManagement() {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const { guardDiscard } = useSysDialogs();
  const list = usePagedList<ProvinceSearch>(INITIAL_FILTER);
  const [selected, setSelected] = useState<ProvinceItem | null>(null);
  const [modalItem, setModalItem] = useState<ProvinceItem | null | undefined>(undefined);
  const dirty = useRef(false);

  const { data, isFetching } = useProvinces(list.applied, list.pageQuery);
  const districtsQuery = useDistricts(selected?.mctpvCd ?? null);
  const saveDistricts = useBatchSaveDistricts();
  const excel = useDownloadProvincesExcel();
  const current = data?.content.find((p) => p.mctpvCd === selected?.mctpvCd) ?? selected;

  // Sorted by district code, ascending.
  const rows = useMemo<GridRecord[]>(
    () =>
      [...(districtsQuery.data ?? [])]
        .sort((a, b) => a.distCd.localeCompare(b.distCd))
        // sortSeq has no column but is sent back so the server keeps the order (it resets a missing one to 1).
        .map((d) => ({ distCd: d.distCd, distNm: d.distNm, sortSeq: d.sortSeq ?? null, useYn: d.useYn, crtDt: d.crtDt ?? null })),
    [districtsQuery.data],
  );
  const nextOrder = rows.reduce((max, r) => Math.max(max, typeof r.sortSeq === 'number' ? r.sortSeq : 0), 0) + 1;

  const selectProvince = (province: ProvinceItem) => {
    if (province.mctpvCd === selected?.mctpvCd) return;
    guardDiscard(dirty.current, () => {
      dirty.current = false;
      setSelected(province);
    });
  };

  const handleSave = async ({ toSave, deleted }: GridChanges) => {
    if (!selected) return;
    await saveDistricts.mutateAsync({
      mctpvCd: selected.mctpvCd,
      request: {
        toSave: toSave.map(({ values, isNew }) => ({
          distCd: String(values.distCd),
          distNm: String(values.distNm),
          sortSeq: typeof values.sortSeq === 'number' ? values.sortSeq : undefined,
          useYn: values.useYn === 'N' ? 'N' : 'Y',
          isNew,
        })),
        deleteDistCds: deleted.map(String),
      },
    });
  };

  // Fixed layout fits the half-width panel (frame VPA09030201); long names are cut with an ellipsis.
  const columns: TableColumnsType<ProvinceItem> = [
    { title: 'Use', dataIndex: 'useYn', sorter: true, align: 'center', width: 76, render: (v: string) => <UseBadge value={v} /> },
    {
      title: 'Province / City Code',
      dataIndex: 'mctpvCd',
      sorter: true,
      width: '21%',
      ellipsis: true,
      render: (value: string, row) => (
        <button
          type="button"
          title={value}
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
    {
      title: 'Administrative Code',
      dataIndex: 'admdstCd',
      sorter: true,
      width: '21%',
      ellipsis: true,
      // Two digits like the design (01, 08, 79).
      render: (v?: number | null) => (v === null || v === undefined ? '-' : String(v).padStart(2, '0')),
    },
    { title: 'Province / City Name', dataIndex: 'mctpvNm', sorter: true, ellipsis: { showTitle: true } },
    {
      title: 'Registered Date',
      dataIndex: 'crtDt',
      sorter: true,
      align: 'center',
      width: 140,
      ellipsis: true,
      render: (v?: string) => <DateTimeText value={v} />,
    },
  ];

  return (
    <SysPage fill>
      <SysTitleBar
        title="Region Code Management"
        breadcrumb={['System Operation Management', 'Code Management', 'Region Code Management']}
      />
      <SysFilterPanel>
        <SysFilterItem label="Province / City Code">
          <TextInput
            value={list.draft.mctpvCd}
            allowClear
            onChange={(e) => list.setDraft({ mctpvCd: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Province / City Name">
          <TextInput
            value={list.draft.mctpvNm}
            allowClear
            onChange={(e) => list.setDraft({ mctpvNm: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />

      <SysSplit
        ratio="1fr 1fr"
        left={
          <div className={styles.pane}>
            <SysSectionHeader
              title="Province / City"
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
            <SysTable<ProvinceItem>
              rowKey="mctpvCd"
              fill
              className={`${styles.paneBody} ${styles.stickyHead}`}
              columns={columns}
              dataSource={data?.content}
              tableLayout="fixed"
              loading={isFetching}
              onRowClick={selectProvince}
              selectedRowKey={selected?.mctpvCd}
              sort={list.sort}
              onSortChange={list.setSort}
            />
            <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={data?.totalElements ?? 0} onChange={list.setPage} />
          </div>
        }
        right={
          <div className={styles.pane}>
            <CodeDetailGrid
              key={`${selected?.mctpvCd ?? ''}-${districtsQuery.dataUpdatedAt}`}
              title={current ? `Districts in [${current.mctpvNm}]` : 'Districts'}
              disabled={!selected}
              emptyText={t('messages.system.regionCode.emptyDetail')}
              canWrite={canWrite}
              loading={districtsQuery.isFetching}
              columns={DISTRICT_COLUMNS}
              rows={rows}
              newRowDefaults={{ useYn: 'Y', distCd: '', distNm: '', sortSeq: nextOrder, crtDt: null }}
              saving={saveDistricts.isPending}
              onSave={handleSave}
              isDuplicateError={isDuplicateDistrict}
              onDirtyChange={(value) => (dirty.current = value)}
            />
          </div>
        }
      />

      {modalItem !== undefined && (
        <ProvinceModal
          key={modalItem?.mctpvCd ?? 'new'}
          item={modalItem}
          canWrite={canWrite}
          onClose={() => setModalItem(undefined)}
        />
      )}
    </SysPage>
  );
}
