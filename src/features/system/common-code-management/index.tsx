import { useMemo, useRef, useState } from 'react';
import { Input } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { CodeGroupItem, CodeGroupSearch } from '@/api/system/code-group-api';
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
} from '@/features/system/_shared/sys-list-ui';
import { SYS_PAGE_SIZE } from '@/features/system/_shared/sys-constants';
import { usePagedList } from '@/features/system/_shared/use-paged-list';
import { useSysDialogs } from '@/features/system/_shared/use-sys-dialogs';
import { apiErrorCode } from '@/features/system/_shared/system-utils';
import { CodeDetailGrid } from './code-detail-grid';
import type { GridChanges, GridColumn, GridRecord } from './code-detail-grid';
import { CodeGroupModal } from './code-group-modal';
import { useBatchSaveCodes, useCodeGroups, useCodes, useDownloadCodeGroupsExcel } from './use-common-codes';
import styles from './code-page.module.scss';

// VPA09030101 Common Code Management: code groups (left) + editable code details (right).

const CODE_COLUMNS: GridColumn[] = [
  { field: 'cd', title: 'Code', kind: 'text', required: true, isKey: true, maxLength: 100, width: 150 },
  { field: 'cdNm', title: 'Code Name', kind: 'text', required: true, maxLength: 100, width: 180 },
  { field: 'sortSeq', title: 'Order', kind: 'number', min: 0, max: 999, width: 80 },
  { field: 'useYn', title: 'Use', kind: 'use', required: true, width: 110 },
  { field: 'lblCd', title: 'Label Key', kind: 'text', maxLength: 100, width: 170 },
  { field: 'cdExpln', title: 'Remarks', kind: 'text', maxLength: 4000, width: 200 },
];

const INITIAL_FILTER: CodeGroupSearch = { groupCd: '', groupNm: '' };

const text = (value: GridRecord[string]) => (typeof value === 'string' && value !== '' ? value : undefined);

export default function CommonCodeManagement() {
  const { canWrite } = useMenuPermission();
  const { guardDiscard } = useSysDialogs();
  const list = usePagedList<CodeGroupSearch>(INITIAL_FILTER);
  const [selected, setSelected] = useState<CodeGroupItem | null>(null);
  const [modalItem, setModalItem] = useState<CodeGroupItem | null | undefined>(undefined);
  const dirty = useRef(false);

  const { data, isFetching } = useCodeGroups(list.applied, list.pageQuery);
  const codesQuery = useCodes(selected?.groupCd ?? null);
  const saveCodes = useBatchSaveCodes();
  const excel = useDownloadCodeGroupsExcel();

  // Latest list values (e.g. a renamed group) win over the row stored on click.
  const current = data?.content.find((g) => g.groupCd === selected?.groupCd) ?? selected;

  const rows = useMemo<GridRecord[]>(
    () =>
      (codesQuery.data ?? []).map((c) => ({
        cd: c.cd,
        cdNm: c.cdNm,
        sortSeq: c.sortSeq ?? null,
        useYn: c.useYn,
        lblCd: c.lblCd ?? null,
        cdExpln: c.cdExpln ?? null,
      })),
    [codesQuery.data],
  );
  const nextOrder = rows.reduce((max, r) => Math.max(max, typeof r.sortSeq === 'number' ? r.sortSeq : 0), 0) + 1;

  const selectGroup = (group: CodeGroupItem) => {
    if (group.groupCd === selected?.groupCd) return;
    guardDiscard(dirty.current, () => {
      dirty.current = false;
      setSelected(group);
    });
  };

  const handleSave = async ({ toSave, deleted }: GridChanges) => {
    if (!selected) return;
    await saveCodes.mutateAsync({
      groupCd: selected.groupCd,
      request: {
        toSave: toSave.map(({ values, isNew }) => ({
          cd: String(values.cd),
          cdNm: String(values.cdNm),
          sortSeq: typeof values.sortSeq === 'number' ? values.sortSeq : undefined,
          useYn: values.useYn === 'N' ? 'N' : 'Y',
          lblCd: text(values.lblCd),
          cdExpln: text(values.cdExpln),
          isNew,
        })),
        deleteCodes: deleted.map(String),
      },
    });
  };

  const columns: TableColumnsType<CodeGroupItem> = [
    {
      title: 'Group Code',
      dataIndex: 'groupCd',
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
    { title: 'Group Name', dataIndex: 'groupNm', render: (v: string) => <span className={styles.ellipsis}>{v}</span> },
    {
      title: 'Description',
      dataIndex: 'groupExpln',
      render: (v?: string) => <span className={styles.ellipsis}>{v || '-'}</span>,
    },
    { title: 'Use', dataIndex: 'useYn', align: 'center', render: (v: string) => <UseBadge value={v} /> },
    { title: 'Registered Date', dataIndex: 'crtDt', align: 'center', render: (v?: string) => <DateTimeText value={v} /> },
  ];

  return (
    <SysPage fill>
      <SysTitleBar
        title="Common Code Management"
        breadcrumb={['System Operation Management', 'Code Management', 'Common Code Management']}
      />
      <SysFilterPanel>
        <SysFilterItem label="Group Code">
          <Input
            value={list.draft.groupCd}
            allowClear
            onChange={(e) => list.setDraft({ groupCd: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Group Name">
          <Input
            value={list.draft.groupNm}
            allowClear
            onChange={(e) => list.setDraft({ groupNm: e.target.value })}
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
              title="Code Groups"
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
            <SysTable<CodeGroupItem>
              rowKey="groupCd"
              fill
              className={styles.paneBody}
              columns={columns}
              dataSource={data?.content}
              loading={isFetching}
              onRowClick={selectGroup}
              selectedRowKey={selected?.groupCd}
            />
            <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={data?.totalElements ?? 0} onChange={list.setPage} />
          </div>
        }
        right={
          <div className={styles.paneDetail}>
            <CodeDetailGrid
              key={`${selected?.groupCd ?? ''}-${codesQuery.dataUpdatedAt}`}
              title={current ? `[${current.groupNm}] Code Details` : 'Code Details'}
              disabled={!selected}
              emptyText="Select a code group."
              canWrite={canWrite}
              loading={codesQuery.isFetching}
              columns={CODE_COLUMNS}
              rows={rows}
              newRowDefaults={{ cd: '', cdNm: '', sortSeq: nextOrder, useYn: 'Y', lblCd: '', cdExpln: '' }}
              saving={saveCodes.isPending}
              onSave={handleSave}
              isDuplicateError={(e) => apiErrorCode(e) === 'COD004'}
              onDirtyChange={(value) => (dirty.current = value)}
            />
          </div>
        }
      />

      {modalItem !== undefined && (
        <CodeGroupModal
          key={modalItem?.groupCd ?? 'new'}
          item={modalItem}
          canWrite={canWrite}
          onClose={() => setModalItem(undefined)}
        />
      )}
    </SysPage>
  );
}
