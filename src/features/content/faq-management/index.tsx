import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import { apiDownload } from '@/api/common/api-utils';
import type { PostSearchRequest } from '@/api/contents/faq-api';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useApiDownload } from '@/hooks/use-api-action';
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
} from '@/components/common/sys-ui/SysListUi';
import { usePagedList } from '@/hooks/use-paged-list';
import type { FaqItem } from './faq.types';
import { buildFaqQueryParams, useFaqs } from './use-faqs';
import FaqDetailModal from './FaqDetailModal';
import { useFaqCategories } from './use-faq-categories';
import styles from './faq-management.module.scss';

// FAQ Management - List (VPA07050001). Category (COM_CD FAQ_CTGRY_CD) is kept although the design has none.

/** Design: 16 rows per page. */
const PAGE_SIZE = 16;
const ALL = 'ALL';

const PUBLISH_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'Y', label: 'Published' },
  { value: 'N', label: 'Unpublished' },
];

const MESSAGES = {
  /** I01 */
  noPosts: 'There are no posts.',
  /** I02 */
  noResults: 'No search results found.',
} as const;

interface FaqFilter {
  published: string;
  category: string;
  keyword: string;
}

const INITIAL_FILTER: FaqFilter = { published: ALL, category: ALL, keyword: '' };

/**
 * Design column set and alignment; every column sorts on the server (`sorter: true`, key = API sort field).
 * Category is kept although the design has none.
 */
const COLUMNS: TableColumnsType<FaqItem> = [
  {
    title: 'ID',
    dataIndex: 'pstNo',
    key: 'pstNo',
    width: 80,
    align: 'center',
    sorter: true,
    render: (value?: string) => <span className={styles.idLink}>{value ?? '-'}</span>,
  },
  {
    title: 'Publish Status',
    dataIndex: 'published',
    key: 'published',
    width: 120,
    align: 'center',
    sorter: true,
    render: (value?: string) =>
      value === 'Y' ? <StatusBadge tone="blue">Published</StatusBadge> : <StatusBadge>Unpublished</StatusBadge>,
  },
  {
    title: 'Display Order',
    dataIndex: 'displayOrder',
    key: 'displayOrder',
    width: 125,
    align: 'center',
    sorter: true,
    // Unpublished posts have no display order.
    render: (value: number | undefined, row) => (row.published === 'Y' && value != null ? value : '-'),
  },
  {
    title: 'Category',
    dataIndex: 'categoryNm',
    key: 'category',
    width: 130,
    ellipsis: true,
    sorter: true,
    render: (value?: string) => value || '-',
  },
  {
    title: 'Question',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
    sorter: true,
  },
  {
    title: 'English',
    dataIndex: 'hasEnglish',
    key: 'hasEnglish',
    width: 100,
    align: 'center',
    sorter: true,
    render: (value?: string) => (value === 'Y' ? 'Y' : '-'),
  },
  {
    title: 'Created Date',
    dataIndex: 'crtDt',
    key: 'crtDt',
    width: 135,
    align: 'center',
    sorter: true,
    render: (value?: string) => <DateTimeText value={value} />,
  },
  {
    title: 'Created By',
    dataIndex: 'crtBy',
    key: 'crtBy',
    width: 120,
    ellipsis: true,
    sorter: true,
    // Design: account ID that created the post.
    render: (value?: string) => value || '-',
  },
  {
    title: 'Modified Date',
    dataIndex: 'mdfcnDt',
    key: 'mdfcnDt',
    width: 135,
    align: 'center',
    sorter: true,
    render: (value?: string | null) => <DateTimeText value={value} />,
  },
  {
    title: 'Modified By',
    dataIndex: 'mdfcnBy',
    key: 'mdfcnBy',
    width: 120,
    ellipsis: true,
    sorter: true,
    render: (value?: string | null) => value || '-',
  },
];

type ModalState = { mode: 'create' } | { mode: 'detail'; faq: FaqItem } | null;

export default function FaqManagement() {
  const list = usePagedList<FaqFilter>(INITIAL_FILTER, { pageSize: PAGE_SIZE });
  const categories = useFaqCategories();
  const categoryOptions = [{ value: ALL, label: 'All' }, ...categories];
  const params = {
    page: list.page,
    pageSize: PAGE_SIZE,
    sortBy: list.sort?.sortBy,
    sortDirection: list.sort?.sortDirection,
    ...list.applied,
  };
  const { items, total, isFetching, refetch } = useFaqs(params);
  const excel = useApiDownload((cond: PostSearchRequest) =>
    apiDownload('/api/v1/contents/faqs/excel', 'faqs.xlsx', {
      ...cond,
      sortBy: list.sort?.sortBy,
      sortDirection: list.sort?.sortDirection,
    }),
  );
  const [modal, setModal] = useState<ModalState>(null);

  const handleSearch = () => list.search({ keyword: list.draft.keyword.trim() });
  const filtered =
    list.applied.published !== ALL || list.applied.category !== ALL || Boolean(list.applied.keyword);

  return (
    <SysPage>
      <SysTitleBar title="FAQ Management" breadcrumb={['Content Management', 'FAQ Management']} />
      <SysFilterPanel>
        <SysFilterItem label="Publish Status">
          <AppSelect
            value={list.draft.published}
            options={PUBLISH_OPTIONS}
            onChange={(published) => list.setDraft({ published: String(published) })}
          />
        </SysFilterItem>
        <SysFilterItem label="Category">
          <AppSelect
            value={list.draft.category}
            options={categoryOptions}
            onChange={(category) => list.setDraft({ category: String(category) })}
          />
        </SysFilterItem>
        <SysFilterItem label="Question">
          <TextInput
            value={list.draft.keyword}
            allowClear
            maxLength={100}
            onChange={(e) => list.setDraft({ keyword: e.target.value })}
            onPressEnter={handleSearch}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={handleSearch} loading={isFetching} />
      <SysSectionHeader
        total={total}
        actions={
          <SysExcelButton
            onClick={() => excel.mutate(buildFaqQueryParams(params).cond)}
            loading={excel.isPending}
            disabled={total === 0}
          />
        }
        primaryActions={
          <SysButton look="navy" onClick={() => setModal({ mode: 'create' })}>
            New
          </SysButton>
        }
      />
      <SysTable<FaqItem>
        rowKey={(row) => row.pstNo || row.id}
        className={styles.listTable}
        fill
        tableLayout="fixed"
        columns={COLUMNS}
        dataSource={items}
        loading={isFetching}
        onRowClick={(faq) => setModal({ mode: 'detail', faq })}
        sort={list.sort}
        onSortChange={list.setSort}
        locale={{ emptyText: filtered ? MESSAGES.noResults : MESSAGES.noPosts }}
      />
      <SysPager page={list.page} pageSize={PAGE_SIZE} total={total} onChange={list.setPage} />
      <FaqDetailModal
        visible={modal !== null}
        mode={modal?.mode ?? 'create'}
        faq={modal?.mode === 'detail' ? modal.faq : null}
        onClose={() => setModal(null)}
        onRefresh={refetch}
      />
    </SysPage>
  );
}
