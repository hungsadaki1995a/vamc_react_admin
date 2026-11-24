import { useMemo, useState } from 'react';
import type { TableColumnsType } from 'antd';
import { AppRangePicker } from '@/components/inputs/AppDatePicker';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useCommonCodes } from '@/hooks/use-common-codes';
import type { LegalOptions, Post, PostSearch, YesNo } from '@/api/contents/post-api';
import {
  DateTimeText,
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
import { ALL, API_DATE_DMY, SYS_DATE_FORMAT } from '@/features/system/_shared/sys-constants';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { useSysDialogs } from '@/features/system/_shared/use-sys-dialogs';
import type { BoardConfig, CategoryOption } from './board-config';
import PostModal from './PostModal';
import { useDownloadPostExcel, useLegalOptions, usePosts } from './use-posts';
import styles from './post.module.scss';

dayjs.extend(customParseFormat);

// List screen of a content board (v0.8 VPA07010001 – VPA07080001):
// title bar · filter panel · [Reset][Search] · "Search Results | Total n" [Excel Download][New]
// · table (row click opens the edit popup) · pager.

/** Design: 16 rows per page. */
const PAGE_SIZE = 16;

type DateRange = [Dayjs | null, Dayjs | null] | null;
/** The list response also carries the numeric post id shown in the ID column. */
type PostRow = Post & { postSn?: number };

interface FilterState {
  published: YesNo | '';
  category: string;
  period: DateRange;
  keyword: string;
  // Legal documents
  lawGroup: string;
  lawField: string;
  issuePeriod: DateRange;
}

const EMPTY_FILTER: FilterState = {
  published: ALL,
  category: ALL,
  period: null,
  keyword: '',
  lawGroup: ALL,
  lawField: ALL,
  issuePeriod: null,
};

const PUBLISH_FILTER_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'Y', label: 'Published' },
  { value: 'N', label: 'Unpublished' },
];

const withAll = (options: CategoryOption[]) => [{ value: ALL, label: 'All' }, ...options];
const halfRange = (range: DateRange) => !!range && !range[0] !== !range[1];
const text = (value?: string | null) => value || '-';

export default function PostBoard({ config }: { config: BoardConfig }) {
  const { toast } = useNotify();
  const dialogs = useSysDialogs();
  const { canWrite } = useMenuPermission();
  const { category } = config;

  // ── Category options ──────────────────────────────────────────────────────
  const codeOptions = useCommonCodes(category.kind === 'codes' ? category.groupCd : null);
  const { data: legalOptions } = useLegalOptions(!!config.legal);
  const categoryOptions = useMemo<CategoryOption[]>(() => {
    if (config.legal) return (legalOptions?.docTypes ?? []).map((o) => ({ value: o.code, label: o.name }));
    if (category.kind === 'codes') return codeOptions;
    if (category.kind === 'options') return category.options;
    return [];
  }, [config.legal, legalOptions, category, codeOptions]);
  const categoryLabel = config.legal
    ? 'Document Type'
    : category.kind === 'codes' || category.kind === 'options'
      ? category.label
      : '';
  const hasCategoryFilter = category.kind === 'codes' || category.kind === 'options' || !!config.legal;
  const showPin = !!config.pin && !config.hidePin;

  // A menu that covers only some sections of a board (Leadership, Service Guide) has no
  // "All": the API filters by a single category, so one section is always selected.
  const sectionOnly = category.kind === 'options';
  const defaultCategory = sectionOnly ? category.options[0].value : ALL;

  const scopedCategory = (picked: string): string | undefined => {
    if (category.kind === 'fixed') return category.value;
    return picked || defaultCategory || undefined;
  };
  const initialFilter: FilterState = { ...EMPTY_FILTER, category: defaultCategory };

  // ── Filter / paging ───────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterState>(initialFilter);
  const [applied, setApplied] = useState<PostSearch>({ category: scopedCategory('') });
  const [filtered, setFiltered] = useState(false);
  const [page, setPage] = useState(1);
  /** undefined = closed, null = register, string = edit that post. */
  const [modalPstNo, setModalPstNo] = useState<string | null | undefined>(undefined);

  const { data, isFetching } = usePosts(config, applied, page, PAGE_SIZE);
  const downloadExcel = useDownloadPostExcel(config);
  const rows = (data?.content ?? []) as PostRow[];
  const total = data?.totalElements ?? 0;

  const setDraft = (values: Partial<FilterState>) => setFilter((f) => ({ ...f, ...values }));

  const handleSearch = () => {
    // E02: a period needs both its start and end date.
    if (halfRange(filter.period) || halfRange(filter.issuePeriod)) {
      dialogs.alert('Please set both the start date and end date.');
      return;
    }
    const search: PostSearch = {
      published: filter.published || undefined,
      category: scopedCategory(filter.category),
      fromDate: filter.period?.[0]?.format(API_DATE_DMY),
      toDate: filter.period?.[1]?.format(API_DATE_DMY),
      keyword: filter.keyword.trim() || undefined,
      lawGroup: filter.lawGroup || undefined,
      lawField: filter.lawField || undefined,
      issueFromDate: filter.issuePeriod?.[0]?.format(API_DATE_DMY),
      issueToDate: filter.issuePeriod?.[1]?.format(API_DATE_DMY),
    };
    setApplied(search);
    setFiltered(Object.entries(search).some(([key, value]) => value !== undefined && !(key === 'category' && value === scopedCategory(''))));
    setPage(1);
  };

  const handleReset = () => {
    setFilter(initialFilter);
    setApplied({ category: scopedCategory('') });
    setFiltered(false);
    setPage(1);
  };

  const handleExcel = () => downloadExcel.mutate(applied, { onError: (e) => toast.error(errorMessage(e)) });

  // ── Grid ──────────────────────────────────────────────────────────────────
  const categoryName = (row: Post) =>
    categoryOptions.find((o) => o.value === row.category)?.label ?? row.categoryNm ?? row.category ?? '-';

  const idColumn: TableColumnsType<PostRow>[number] = {
    title: 'ID',
    key: 'id',
    width: 76,
    align: 'center',
    render: (_v, row) => <span className={styles.idLink}>{row.postSn ?? row.pstNo}</span>,
  };
  const statusColumn: TableColumnsType<PostRow>[number] = {
    title: 'Publish Status',
    dataIndex: 'published',
    width: 116,
    align: 'center',
    render: (value: string) =>
      value === 'Y' ? <StatusBadge tone="blue">Published</StatusBadge> : <StatusBadge>Unpublished</StatusBadge>,
  };
  const attachmentsColumn: TableColumnsType<PostRow>[number] = {
    title: 'Attachments',
    dataIndex: 'attachmentCount',
    width: 104,
    align: 'center',
    render: (value?: number) => value ?? 0,
  };
  const createdColumns: TableColumnsType<PostRow> = [
    { title: 'Created Date', dataIndex: 'crtDt', width: 140, align: 'center', render: (v?: string) => <DateTimeText value={v} /> },
    { title: 'Created By', key: 'crtBy', width: 116, ellipsis: true, render: (_v, row) => text(row.crtBy) },
  ];
  const modifiedColumns: TableColumnsType<PostRow> = [
    { title: 'Modified Date', dataIndex: 'mdfcnDt', width: 140, align: 'center', render: (v?: string) => <DateTimeText value={v} /> },
    { title: 'Modified By', key: 'mdfcnBy', width: 116, ellipsis: true, render: (_v, row) => text(row.mdfcnBy) },
  ];
  const viewsColumn: TableColumnsType<PostRow>[number] = {
    title: 'Views',
    dataIndex: 'viewCount',
    width: 80,
    align: 'center',
    render: (value?: number) => value ?? 0,
  };

  const columns: TableColumnsType<PostRow> = config.legal
    ? [
        idColumn,
        statusColumn,
        { title: 'Document Type', key: 'category', width: 140, ellipsis: true, render: (_v, row) => categoryName(row) },
        { title: 'Number/Symbol', dataIndex: 'docNumber', width: 140, ellipsis: true, render: text },
        { title: 'Document Name', dataIndex: 'title', width: 260, ellipsis: true, render: text },
        { title: 'Group', dataIndex: 'lawGroupNm', width: 130, ellipsis: true, render: text },
        { title: 'Field', dataIndex: 'lawFieldNm', width: 140, ellipsis: true, render: text },
        { title: 'Issuing Agency', dataIndex: 'issuingAuthorityNm', width: 150, ellipsis: true, render: text },
        {
          title: 'Issue Date',
          dataIndex: 'issueDate',
          width: 110,
          align: 'center',
          render: (v?: string) => (v ? dayjs(v, 'DDMMYYYY').format(SYS_DATE_FORMAT) : '-'),
        },
        attachmentsColumn,
        createdColumns[1],
        ...modifiedColumns,
        viewsColumn,
      ]
    : [
        idColumn,
        statusColumn,
        ...(showPin
          ? ([
              {
                title: 'Pin to Top',
                dataIndex: 'pinned',
                width: 96,
                align: 'center',
                render: (value?: string) => (value === 'Y' ? 'Y' : 'N'),
              },
            ] as TableColumnsType<PostRow>)
          : []),
        // Boards without a design for these (Leadership, Service Guide…) keep their category / tag column.
        ...(hasCategoryFilter && !showPin
          ? ([
              { title: categoryLabel, key: 'category', width: 160, ellipsis: true, render: (_v, row) => categoryName(row) },
            ] as TableColumnsType<PostRow>)
          : []),
        ...(config.tag && config.tag.requestKey !== 'docNumber'
          ? ([{ title: config.tag.label, dataIndex: 'tag', width: 150, ellipsis: true, render: text }] as TableColumnsType<PostRow>)
          : []),
        { title: 'Title', dataIndex: 'title', ellipsis: true, render: text },
        ...(config.tag?.requestKey === 'docNumber'
          ? ([
              { title: 'Document No.', dataIndex: 'tag', width: 130, align: 'center', ellipsis: true, render: text },
            ] as TableColumnsType<PostRow>)
          : []),
        attachmentsColumn,
        ...createdColumns,
        ...modifiedColumns,
        viewsColumn,
      ];

  const legalSelect = (label: string, key: 'lawGroup' | 'lawField', options: LegalOptions['groups'] | undefined) => (
    <SysFilterItem label={label}>
      <AppSelect
        value={filter[key]}
        onChange={(value) => setDraft({ [key]: String(value ?? '') })}
        options={withAll((options ?? []).map((o) => ({ value: o.code, label: o.name })))}
      />
    </SysFilterItem>
  );

  const rangePicker = (value: DateRange, onChange: (range: DateRange) => void) => (
    <AppRangePicker
      className={styles.rangePicker}
      format={SYS_DATE_FORMAT}
      placeholder={['DD-MM-YYYY', 'DD-MM-YYYY']}
      allowEmpty={[true, true]}
      value={value}
      onChange={(dates) => onChange(dates as DateRange)}
    />
  );

  return (
    <SysPage>
      <SysTitleBar breadcrumb={['Content Management', ...(config.parents ?? []), config.title]} title={config.title} />

      <SysFilterPanel>
        <SysFilterItem label="Publish Status">
          <AppSelect
            value={filter.published}
            options={PUBLISH_FILTER_OPTIONS}
            onChange={(value) => setDraft({ published: String(value ?? '') as YesNo | '' })}
          />
        </SysFilterItem>
        {hasCategoryFilter && (
          <SysFilterItem label={categoryLabel}>
            <AppSelect
              value={filter.category}
              onChange={(value) => setDraft({ category: String(value ?? '') })}
              options={sectionOnly ? categoryOptions : withAll(categoryOptions)}
            />
          </SysFilterItem>
        )}
        {config.legal && legalSelect('Group', 'lawGroup', legalOptions?.groups)}
        {config.legal && legalSelect('Field', 'lawField', legalOptions?.fields)}
        {config.legal ? (
          <SysFilterItem label="Issue Date">
            {rangePicker(filter.issuePeriod, (issuePeriod) => setDraft({ issuePeriod }))}
          </SysFilterItem>
        ) : (
          <SysFilterItem label="Creation Period">
            {rangePicker(filter.period, (period) => setDraft({ period }))}
          </SysFilterItem>
        )}
        <SysFilterItem label={config.legal ? 'Keyword' : 'Title'}>
          <TextInput
            placeholder={config.legal ? 'Enter number/symbol or document name' : 'Enter title'}
            value={filter.keyword}
            onChange={(e) => setDraft({ keyword: e.target.value })}
            onPressEnter={handleSearch}
            allowClear
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={handleReset} onSearch={handleSearch} loading={isFetching} />

      <SysSectionHeader
        total={total}
        actions={
          config.excel ? (
            <SysExcelButton onClick={handleExcel} loading={downloadExcel.isPending} disabled={total === 0} />
          ) : undefined
        }
        primaryActions={
          canWrite ? (
            <SysButton look="navy" onClick={() => setModalPstNo(null)}>
              New
            </SysButton>
          ) : undefined
        }
      />

      <SysTable<PostRow>
        rowKey="pstNo"
        className={styles.listTable}
        fill
        tableLayout="fixed"
        // Legal documents scroll sideways like the design; the other boards fit the frame.
        scroll={config.legal ? { x: 1900 } : undefined}
        columns={columns}
        dataSource={rows}
        loading={isFetching}
        locale={{ emptyText: filtered ? 'No search results found.' : 'There are no posts.' }}
        onRowClick={(row) => setModalPstNo(row.pstNo)}
      />

      <SysPager page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      {modalPstNo !== undefined && (
        <PostModal
          key={modalPstNo ?? 'new'}
          config={config}
          pstNo={modalPstNo}
          canWrite={canWrite}
          categoryOptions={categoryOptions}
          categoryLabel={categoryLabel}
          legalOptions={legalOptions}
          onClose={() => setModalPstNo(undefined)}
        />
      )}
    </SysPage>
  );
}
