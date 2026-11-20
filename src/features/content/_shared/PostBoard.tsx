import { useMemo, useState } from 'react';
import { DatePicker, Input, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useCommonCodes } from '@/hooks/use-common-codes';
import { deletePosts, downloadPostExcel, getLegalOptions, getPosts, publishPosts } from '@/api/contents/post-api';
import type { LegalOptions, Post, PostSearch, YesNo } from '@/api/contents/post-api';
import type { PageResponse } from '@/api/common/api-utils';
import {
  DateTimeCell,
  SysPageHeader,
  SysPagination,
  UseYnChecks,
} from '@/features/system/_shared/SystemUi';
import { errorMessage, toUseYnFilter } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';
import type { BoardConfig, CategoryOption } from './board-config';
import PostModal from './PostModal';

dayjs.extend(customParseFormat);

// Generic list screen of a content board (wireframes VPA0023xx – VPA0034xx):
// filter card · Total · grid with Post / Stop posting · pagination · Delete / Add New.

const PAGE_SIZE = 15;
const DATE_FORMAT = 'DD/MM/YYYY';

type DateRange = [Dayjs | null, Dayjs | null] | null;

type FilterState = {
  posted: boolean;
  stopped: boolean;
  category: string;
  period: DateRange;
  keyword: string;
  // Legal documents
  lawGroup: string;
  lawField: string;
  issuePeriod: DateRange;
};

const EMPTY_FILTER: FilterState = {
  posted: true,
  stopped: true,
  category: '',
  period: null,
  keyword: '',
  lawGroup: '',
  lawField: '',
  issuePeriod: null,
};

const withAll = (options: CategoryOption[]) => [{ value: '', label: 'All' }, ...options];

export default function PostBoard({ config }: { config: BoardConfig }) {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();
  const { category } = config;

  // ── Category options ──────────────────────────────────────────────────────
  const codeOptions = useCommonCodes(category.kind === 'codes' ? category.groupCd : null);
  const { data: legalOptions } = useApiQuery<LegalOptions>(['contents', 'legal-options'], getLegalOptions, {
    enabled: !!config.legal,
    staleTime: 5 * 60 * 1000,
  });
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
  const hasCategoryFilter = categoryOptions.length > 0 || !!config.legal;

  // A menu that covers only some sections of a board (Leadership, Service Guide) has no
  // "All": the API filters by a single category, so one section is always selected.
  const sectionOnly = category.kind === 'options';
  const defaultCategory = sectionOnly ? category.options[0].value : '';

  const scopedCategory = (picked: string): string | undefined => {
    if (category.kind === 'fixed') return category.value;
    return picked || defaultCategory || undefined;
  };
  const initialFilter: FilterState = { ...EMPTY_FILTER, category: defaultCategory };

  // ── Filter / paging ───────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterState>(initialFilter);
  const [applied, setApplied] = useState<PostSearch>({ category: scopedCategory('') });
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  /** undefined = closed, null = register, string = view/edit that post. */
  const [modalPstNo, setModalPstNo] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const { data, isFetching, error } = useApiQuery<PageResponse<Post>>(
    ['contents', 'posts', config.id, applied, page],
    () => getPosts(config.board, applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData },
  );
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const refresh = () => {
    setSelectedKeys([]);
    void queryClient.invalidateQueries({ queryKey: ['contents', 'posts', config.id] });
  };

  const handleSearch = () => {
    setApplied({
      published: toUseYnFilter(filter.posted, filter.stopped),
      category: scopedCategory(filter.category),
      fromDate: filter.period?.[0]?.format(DATE_FORMAT),
      toDate: filter.period?.[1]?.format(DATE_FORMAT),
      keyword: filter.keyword.trim() || undefined,
      lawGroup: filter.lawGroup || undefined,
      lawField: filter.lawField || undefined,
      issueFromDate: filter.issuePeriod?.[0]?.format(DATE_FORMAT),
      issueToDate: filter.issuePeriod?.[1]?.format(DATE_FORMAT),
    });
    setPage(1);
    setSelectedKeys([]);
  };

  const handleReset = () => {
    setFilter(initialFilter);
    setApplied({ category: scopedCategory('') });
    setPage(1);
    setSelectedKeys([]);
  };

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const requireSelection = (): boolean => {
    if (selectedKeys.length > 0) return true;
    toast.warning('Select at least one item.');
    return false;
  };

  const runBulk = async (action: () => Promise<{ message: string }>, fallback: string) => {
    setBusy(true);
    try {
      const response = await action();
      toast.success(response.message || fallback);
      refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = (published: YesNo) => {
    if (!requireSelection()) return;
    dialog.confirm({
      content:
        published === 'Y'
          ? `Post the ${selectedKeys.length} selected item(s) on the platform?`
          : `Stop posting the ${selectedKeys.length} selected item(s)?`,
      onOk: () => runBulk(() => publishPosts(config.board, selectedKeys, published), 'Saved.'),
    });
  };

  const handleDelete = () => {
    if (!requireSelection()) return;
    dialog.warning({
      okCancel: true,
      content: `Delete the ${selectedKeys.length} selected item(s)?`,
      onOk: () => runBulk(() => deletePosts(config.board, selectedKeys), 'Deleted.'),
    });
  };

  const handleExcel = async () => {
    setBusy(true);
    try {
      await downloadPostExcel(config.board, applied);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // ── Grid ──────────────────────────────────────────────────────────────────
  const categoryName = (row: Post) =>
    categoryOptions.find((o) => o.value === row.category)?.label ?? row.categoryNm ?? row.category ?? '-';

  const columns: TableColumnsType<Post> = [
    { title: 'ID', dataIndex: 'pstNo', width: 150, align: 'center' },
    {
      title: 'Status',
      dataIndex: 'published',
      width: 90,
      align: 'center',
      render: (value: string) =>
        value === 'Y' ? <span className={styles.useY}>Post</span> : <span className={styles.useN}>Stop</span>,
    },
    ...(config.pin
      ? ([
          {
            title: 'Top Display',
            key: 'pinned',
            width: 80,
            align: 'center',
            render: (_v, row) => (row.pinned === 'Y' ? `Y${row.pinOrder ? ` (${row.pinOrder})` : ''}` : 'N'),
          },
        ] as TableColumnsType<Post>)
      : []),
    ...(hasCategoryFilter
      ? ([
          {
            title: categoryLabel,
            key: 'category',
            width: 150,
            align: 'center',
            render: (_v, row) => categoryName(row),
          },
        ] as TableColumnsType<Post>)
      : []),
    ...(config.legal
      ? ([{ title: 'Number/Symbol', dataIndex: 'docNumber', width: 140, align: 'center' }] as TableColumnsType<Post>)
      : []),
    ...(config.tag && !config.legal
      ? ([
          {
            title: config.tag.label,
            dataIndex: 'tag',
            width: 150,
            align: 'center',
            render: (value?: string) => value || '-',
          },
        ] as TableColumnsType<Post>)
      : []),
    {
      title: 'Title',
      dataIndex: 'title',
      width: 380,
      render: (value: string, row) => (
        <a className={styles.cellLink} onClick={() => setModalPstNo(row.pstNo)}>
          {value || '-'}
        </a>
      ),
    },
    ...(config.legal
      ? ([
          { title: 'Group', dataIndex: 'lawGroupNm', width: 130, align: 'center', render: (v?: string) => v || '-' },
          { title: 'Field', dataIndex: 'lawFieldNm', width: 150, align: 'center', render: (v?: string) => v || '-' },
          {
            title: 'Issuing Authority',
            dataIndex: 'issuingAuthorityNm',
            width: 150,
            align: 'center',
            render: (v?: string) => v || '-',
          },
          {
            title: 'Issue Date',
            dataIndex: 'issueDate',
            width: 100,
            align: 'center',
            render: (v?: string) => (v ? dayjs(v, 'DDMMYYYY').format(DATE_FORMAT) : '-'),
          },
        ] as TableColumnsType<Post>)
      : []),
    {
      title: 'File',
      dataIndex: 'attachmentCount',
      width: 60,
      align: 'center',
      render: (value?: number) =>
        value ? (
          <span>
            <PaperClipOutlined /> {value}
          </span>
        ) : (
          ''
        ),
    },
    {
      title: 'Registration Date',
      dataIndex: 'crtDt',
      width: 110,
      align: 'center',
      render: (value?: string) => <DateTimeCell value={value} />,
    },
    {
      title: 'Registrant',
      key: 'crtBy',
      width: 110,
      align: 'center',
      render: (_v, row) => row.crtByNm || row.crtBy || '-',
    },
    {
      title: 'Modification Date',
      dataIndex: 'mdfcnDt',
      width: 110,
      align: 'center',
      render: (value?: string) => <DateTimeCell value={value} />,
    },
    {
      title: 'Modifier',
      key: 'mdfcnBy',
      width: 110,
      align: 'center',
      render: (_v, row) => row.mdfcnByNm || row.mdfcnBy || '-',
    },
    ...(config.legal
      ? ([{ title: 'View Count', dataIndex: 'viewCount', width: 80, align: 'center' }] as TableColumnsType<Post>)
      : []),
  ];

  const legalSelect = (
    label: string,
    key: 'lawGroup' | 'lawField',
    options: LegalOptions['groups'] | undefined,
  ) => (
    <div className={styles.filterGroup}>
      <span className={styles.filterLabel}>{label}</span>
      <Select
        className="w-[180px]"
        value={filter[key]}
        onChange={(value) => setFilter((f) => ({ ...f, [key]: value }))}
        options={withAll((options ?? []).map((o) => ({ value: o.code, label: o.name })))}
      />
    </div>
  );

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['Content Management', ...(config.parents ?? []), config.title]}
        title={config.title}
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />

      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            <UseYnChecks
              yes={filter.posted}
              no={filter.stopped}
              onChange={(posted, stopped) => setFilter((f) => ({ ...f, posted, stopped }))}
              allLabel="All"
              yesLabel="Post"
              noLabel="Suspend Posting"
            />
          </div>
          {hasCategoryFilter && (
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>{categoryLabel}</span>
              <Select
                className="w-[220px]"
                value={filter.category}
                onChange={(value) => setFilter((f) => ({ ...f, category: value }))}
                options={sectionOnly ? categoryOptions : withAll(categoryOptions)}
              />
            </div>
          )}
          {config.legal && legalSelect('Group', 'lawGroup', legalOptions?.groups)}
          {config.legal && legalSelect('Field', 'lawField', legalOptions?.fields)}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Registration Period</span>
            <DatePicker.RangePicker
              format={DATE_FORMAT}
              placeholder={['dd/mm/yyyy', 'dd/mm/yyyy']}
              value={filter.period}
              onChange={(dates) => setFilter((f) => ({ ...f, period: dates as DateRange }))}
              className="w-[250px]"
            />
          </div>
          {config.legal && (
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Issue Date</span>
              <DatePicker.RangePicker
                format={DATE_FORMAT}
                placeholder={['dd/mm/yyyy', 'dd/mm/yyyy']}
                value={filter.issuePeriod}
                onChange={(dates) => setFilter((f) => ({ ...f, issuePeriod: dates as DateRange }))}
                className="w-[250px]"
              />
            </div>
          )}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{config.legal ? 'Search Term' : 'ID/Title'}</span>
            <Input
              className={styles.filterInput}
              placeholder={config.legal ? 'Enter number/symbol or title' : 'Enter ID or title'}
              value={filter.keyword}
              onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>
          Total ({total}){error && <span className={styles.textDanger}> — {error.message}</span>}
        </span>
        <div className={styles.actions}>
          {config.excel && (
            <button type="button" className={`${styles.btn} ${styles.btnSmall}`} disabled={busy} onClick={handleExcel}>
              Excel Download
            </button>
          )}
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSmall}`}
            disabled={!canWrite || busy}
            onClick={() => handlePublish('N')}
          >
            Stop posting
          </button>
          <button
            type="button"
            className={`${styles.btnDark} ${styles.btnSmall}`}
            disabled={!canWrite || busy}
            onClick={() => handlePublish('Y')}
          >
            Posting
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <Table<Post>
          rowKey="pstNo"
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: (keys) => setSelectedKeys(keys.map(String)),
          }}
        />
      </div>

      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <div className={styles.bottomActions}>
        <button type="button" className={styles.btn} disabled={!canWrite || busy} onClick={handleDelete}>
          Delete
        </button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={() => setModalPstNo(null)}>
          Add New
        </button>
      </div>

      {modalPstNo !== undefined && (
        <PostModal
          config={config}
          pstNo={modalPstNo}
          canWrite={canWrite}
          categoryOptions={categoryOptions}
          categoryLabel={categoryLabel}
          legalOptions={legalOptions}
          onClose={() => setModalPstNo(undefined)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
