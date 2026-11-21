import { useMemo, useRef, useState } from 'react';
import type { TableColumnsType } from 'antd';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useCommonCodes } from '@/hooks/use-common-codes';
import type { InstitutionItem, InstitutionSearch } from '@/api/system/institution-api';
import {
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
} from '@/features/system/_shared/SysListUi';
import { SYS_PAGE_SIZE } from '@/features/system/_shared/sys-constants';
import { usePagedList } from '@/features/system/_shared/use-paged-list';
import { useSysDialogs } from '@/features/system/_shared/use-sys-dialogs';
import { apiErrorCode } from '@/features/system/_shared/system-utils';
import { ApiError } from '@/lib/api/error';
import { CodeDetailGrid } from '@/features/system/common-code-management/CodeDetailGrid';
import type { GridChanges, GridColumn, GridRecord } from '@/features/system/common-code-management/CodeDetailGrid';
import styles from '@/features/system/common-code-management/code-page.module.scss';
import { InstitutionModal } from './InstitutionModal';
import {
  useAdminUnitOptions,
  useBatchSaveBranches,
  useBranches,
  useDownloadInstitutionsExcel,
  useInstitutions,
} from './use-institutions';

// VPA09030301 Finance Code Management: institutions (left) + editable branch codes (right).

const INITIAL_FILTER: InstitutionSearch = { fnstCd: '', fnstNm: '' };

/** Already registered (COD007) or owned by another institution (409 without code). */
const isDuplicateBranch = (e: unknown) =>
  apiErrorCode(e) === 'COD007' || (e instanceof ApiError && e.statusCode === 409);

const text = (value: GridRecord[string]) => (typeof value === 'string' && value !== '' ? value : undefined);

export default function FinanceCodeManagement() {
  const { canWrite } = useMenuPermission();
  const { guardDiscard } = useSysDialogs();
  const list = usePagedList<InstitutionSearch>(INITIAL_FILTER);
  const [selected, setSelected] = useState<InstitutionItem | null>(null);
  const [modalItem, setModalItem] = useState<InstitutionItem | null | undefined>(undefined);
  const dirty = useRef(false);

  const { data, isFetching } = useInstitutions(list.applied, list.pageQuery);
  const branchesQuery = useBranches(selected?.fnstCd ?? null);
  const saveBranches = useBatchSaveBranches();
  const excel = useDownloadInstitutionsExcel();
  const classificationOptions = useCommonCodes('FNST_BRNCH_CLSF_CD');
  const adminUnitOptions = useAdminUnitOptions();
  const current = data?.content.find((i) => i.fnstCd === selected?.fnstCd) ?? selected;

  // Category Code (FNST_BRNCH_CLSF_CD) and Administrative Code are required by the API: editable selects.
  const branchColumns = useMemo<GridColumn[]>(
    () => [
      { field: 'useYn', title: 'Use', kind: 'use', required: true, width: 110 },
      {
        field: 'fnstBrnchClsfCd',
        title: 'Category Code',
        kind: 'select',
        required: true,
        options: classificationOptions,
        width: 170,
      },
      { field: 'fnstBrnchCd', title: 'Branch Code', kind: 'number', required: true, isKey: true, min: 1, max: 99999999, width: 130 },
      { field: 'fnstBrnchNm', title: 'Branch Name', kind: 'text', required: true, maxLength: 200, width: 200 },
      { field: 'fnstSlsbrNm', title: 'Office Name', kind: 'text', maxLength: 200, width: 200 },
      { field: 'fnstBrnchAddr', title: 'Branch Address', kind: 'text', maxLength: 320, width: 200 },
      {
        field: 'admdstCd',
        title: 'Administrative Code',
        kind: 'select',
        required: true,
        options: adminUnitOptions,
        width: 190,
      },
    ],
    [classificationOptions, adminUnitOptions],
  );

  const rows = useMemo<GridRecord[]>(
    () =>
      (branchesQuery.data ?? []).map((b) => ({
        fnstBrnchCd: b.fnstBrnchCd,
        fnstBrnchNm: b.fnstBrnchNm,
        fnstSlsbrNm: b.fnstSlsbrNm ?? null,
        fnstBrnchAddr: b.fnstBrnchAddr ?? null,
        fnstBrnchClsfCd: b.fnstBrnchClsfCd ?? null,
        admdstCd: b.admdstCd ?? null,
        useYn: b.useYn,
      })),
    [branchesQuery.data],
  );

  const selectInstitution = (institution: InstitutionItem) => {
    if (institution.fnstCd === selected?.fnstCd) return;
    guardDiscard(dirty.current, () => {
      dirty.current = false;
      setSelected(institution);
    });
  };

  const handleSave = async ({ toSave, deleted }: GridChanges) => {
    if (!selected) return;
    await saveBranches.mutateAsync({
      fnstCd: selected.fnstCd,
      request: {
        toSave: toSave.map(({ values, isNew }) => ({
          fnstBrnchCd: Number(values.fnstBrnchCd),
          fnstBrnchNm: String(values.fnstBrnchNm),
          fnstSlsbrNm: text(values.fnstSlsbrNm),
          fnstBrnchAddr: text(values.fnstBrnchAddr),
          fnstBrnchClsfCd: String(values.fnstBrnchClsfCd),
          admdstCd: Number(values.admdstCd),
          useYn: values.useYn === 'N' ? 'N' : 'Y',
          isNew,
        })),
        deleteFnstBrnchCds: deleted.map(Number),
      },
    });
  };

  const columns: TableColumnsType<InstitutionItem> = [
    { title: 'Use', dataIndex: 'useYn', align: 'center', render: (v: string) => <UseBadge value={v} /> },
    {
      title: 'Code',
      dataIndex: 'fnstCd',
      align: 'center',
      render: (value: number, row) => (
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
    { title: 'Institution Name', dataIndex: 'fnstNm', render: (v: string) => <span className={styles.ellipsis}>{v}</span> },
    { title: 'Short Name', dataIndex: 'fnstAbbrNm', render: (v?: string) => v || '-' },
  ];

  return (
    <SysPage fill>
      <SysTitleBar
        title="Finance Code Management"
        breadcrumb={['System Operation Management', 'Code Management', 'Finance Code Management']}
      />
      <SysFilterPanel>
        <SysFilterItem label="Institution Code">
          <TextInput
            value={list.draft.fnstCd}
            allowClear
            onChange={(e) => list.setDraft({ fnstCd: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Institution Name">
          <TextInput
            value={list.draft.fnstNm}
            allowClear
            onChange={(e) => list.setDraft({ fnstNm: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />

      <SysSplit
        ratio="2fr 3fr"
        left={
          <div className={styles.pane}>
            <SysSectionHeader
              title="Financial Institutions"
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
            <SysTable<InstitutionItem>
              rowKey="fnstCd"
              fill
              className={styles.paneBody}
              columns={columns}
              dataSource={data?.content}
              loading={isFetching}
              onRowClick={selectInstitution}
              selectedRowKey={selected?.fnstCd}
            />
            <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={data?.totalElements ?? 0} onChange={list.setPage} />
          </div>
        }
        right={
          <div className={styles.paneDetail}>
            <CodeDetailGrid
              key={`${selected?.fnstCd ?? ''}-${branchesQuery.dataUpdatedAt}`}
              title={current ? `Branch Codes in [${current.fnstNm}]` : 'Branch Codes'}
              disabled={!selected}
              emptyText="Select a financial institution."
              canWrite={canWrite}
              loading={branchesQuery.isFetching}
              columns={branchColumns}
              rows={rows}
              newRowDefaults={{
                fnstBrnchCd: null,
                fnstBrnchNm: '',
                fnstSlsbrNm: '',
                fnstBrnchAddr: '',
                fnstBrnchClsfCd: null,
                admdstCd: null,
                useYn: 'Y',
              }}
              saving={saveBranches.isPending}
              onSave={handleSave}
              isDuplicateError={isDuplicateBranch}
              onDirtyChange={(value) => (dirty.current = value)}
            />
          </div>
        }
      />

      {modalItem !== undefined && (
        <InstitutionModal
          key={modalItem?.fnstCd ?? 'new'}
          item={modalItem}
          canWrite={canWrite}
          onClose={() => setModalItem(undefined)}
        />
      )}
    </SysPage>
  );
}
