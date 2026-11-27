import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { apiDownload } from '@/api/common/api-utils';
import type { InquirySearchRequest } from '@/api/contents/inquiry-api';
import { AppRangePicker } from '@/components/inputs/AppDatePicker';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useApiDownload } from '@/hooks/use-api-action';
import { useCommonCodes } from '@/hooks/use-common-codes';
import {
  DateTimeText,
  StatusBadge,
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
import { API_DATE_DMY, SYS_DATE_FORMAT } from '@/config/sys-constants';
import { usePagedList } from '@/hooks/use-paged-list';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import type { InquiryItem } from './inquiry.types';
import { buildInquiryQueryParams, useInquiries } from './use-inquiries';
import InquiryDetailModal from './InquiryDetailModal';
import styles from './inquiry-management.module.scss';

// Direct Inquiry Management - List (VPA07040001).

/** Design: 16 rows per page. */
const PAGE_SIZE = 16;
const ALL = 'ALL';

const ANSWER_STATUS_OPTIONS = [
  { value: 'ANSWERED', label: 'Answered' },
  { value: 'UNANSWERED', label: 'Unanswered' },
];

type Period = [Dayjs | null, Dayjs | null] | null;

interface InquiryFilter {
  answerStatus: string;
  category: string;
  period: Period;
  keyword: string;
}

/** Design defaults: Unanswered, all types, no period, empty title. */
const INITIAL_FILTER: InquiryFilter = { answerStatus: 'UNANSWERED', category: ALL, period: null, keyword: '' };

function toParams(filter: InquiryFilter) {
  return {
    answerStatus: filter.answerStatus,
    category: filter.category,
    fromDate: filter.period?.[0]?.format(API_DATE_DMY) ?? '',
    toDate: filter.period?.[1]?.format(API_DATE_DMY) ?? '',
    keyword: filter.keyword,
  };
}

function AnswerBadge({ status }: { status?: string }) {
  return (status ?? '').toUpperCase() === 'ANSWERED' ? (
    <StatusBadge tone="blue">Answered</StatusBadge>
  ) : (
    <StatusBadge tone="red">Unanswered</StatusBadge>
  );
}

/**
 * Design column set and alignment. Every column sorts on the server (`sorter: true`, key = API sort field);
 * the encrypted customer login ID is sorted in memory by the API.
 */
const COLUMNS: TableColumnsType<InquiryItem> = [
  {
    title: 'ID',
    dataIndex: 'pstNo',
    key: 'pstNo',
    width: 90,
    align: 'center',
    sorter: true,
    render: (value?: string) => <span className={styles.idLink}>{value ?? '-'}</span>,
  },
  {
    title: 'Answer Status',
    dataIndex: 'answerStatus',
    key: 'answerStatus',
    width: 120,
    align: 'center',
    sorter: true,
    render: (value?: string) => <AnswerBadge status={value} />,
  },
  {
    title: 'Inquiry Type',
    dataIndex: 'categoryNm',
    key: 'category',
    width: 170,
    ellipsis: true,
    sorter: true,
    render: (value?: string) => value || '-',
  },
  {
    title: 'Title',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
    sorter: true,
  },
  {
    title: 'Attachments',
    dataIndex: 'attachmentCount',
    key: 'attachmentCount',
    width: 120,
    align: 'center',
    sorter: true,
    render: (value?: number) => value ?? 0,
  },
  {
    title: 'Registered Date',
    dataIndex: 'crtDt',
    key: 'crtDt',
    width: 135,
    align: 'center',
    sorter: true,
    render: (value?: string) => <DateTimeText value={value} />,
  },
  {
    title: 'Customer',
    dataIndex: 'customerLoginId',
    key: 'customer',
    width: 150,
    ellipsis: true,
    sorter: true,
    // Login ID (masked) of General / Full members; "-" for non-members and Temporary members.
    render: (value?: string) => value || '-',
  },
  {
    title: 'Answered Date',
    dataIndex: 'answeredAt',
    key: 'answeredAt',
    width: 135,
    align: 'center',
    sorter: true,
    render: (value?: string | null) => <DateTimeText value={value} />,
  },
  {
    title: 'Answered By',
    dataIndex: 'ansEmpNo',
    key: 'ansEmpNo',
    width: 130,
    ellipsis: true,
    sorter: true,
    // Design: account ID that answered.
    render: (value?: string | null) => value || '-',
  },
];

export default function InquiryManagement() {
  const { t } = useTranslation();
  const { alert } = useSysDialogs();
  const list = usePagedList<InquiryFilter>(INITIAL_FILTER, { pageSize: PAGE_SIZE });
  const typeCodes = useCommonCodes('INQRY_SE_CD');
  const typeOptions = [{ value: ALL, label: 'All' }, ...typeCodes];
  const params = toParams(list.applied);
  const { items, total, isFetching, refetch } = useInquiries({
    page: list.page,
    pageSize: PAGE_SIZE,
    sortBy: list.sort?.sortBy,
    sortDirection: list.sort?.sortDirection,
    ...params,
  });
  const excel = useApiDownload((cond: InquirySearchRequest) =>
    apiDownload('/api/v1/contents/inquiries/excel', 'inquiries.xlsx', {
      ...cond,
      sortBy: list.sort?.sortBy,
      sortDirection: list.sort?.sortDirection,
    }),
  );
  const [selected, setSelected] = useState<InquiryItem | null>(null);

  const handleSearch = () => {
    const [from, to] = list.draft.period ?? [null, null];
    if (Boolean(from) !== Boolean(to)) {
      alert(t('messages.content.inquiry.periodBoth'));
      return;
    }
    if (!list.search({ keyword: list.draft.keyword.trim(), period: from && to ? [from, to] : null })) void refetch();
  };

  const filtered =
    list.applied.answerStatus !== INITIAL_FILTER.answerStatus ||
    list.applied.category !== ALL ||
    Boolean(list.applied.period) ||
    Boolean(list.applied.keyword);

  return (
    <SysPage>
      <SysTitleBar title="Direct Inquiry Management" breadcrumb={['Content Management', 'Direct Inquiry Management']} />
      <SysFilterPanel>
        <SysFilterItem label="Answer Status">
          <AppSelect
            value={list.draft.answerStatus}
            options={ANSWER_STATUS_OPTIONS}
            onChange={(answerStatus) => list.setDraft({ answerStatus: String(answerStatus) })}
          />
        </SysFilterItem>
        <SysFilterItem label="Inquiry Type">
          <AppSelect
            value={list.draft.category}
            options={typeOptions}
            onChange={(category) => list.setDraft({ category: String(category) })}
          />
        </SysFilterItem>
        <SysFilterItem label="Inquiry Period">
          <AppRangePicker
            className={styles.period}
            value={list.draft.period}
            format={SYS_DATE_FORMAT}
            separator="~"
            allowEmpty={[true, true]}
            inputReadOnly
            placeholder={['DD-MM-YYYY', 'DD-MM-YYYY']}
            onChange={(period) => list.setDraft({ period: period as Period })}
          />
        </SysFilterItem>
        <SysFilterItem label="Title">
          <TextInput
            value={list.draft.keyword}
            allowClear
            maxLength={100}
            onChange={(e) => list.setDraft({ keyword: e.target.value })}
            onPressEnter={handleSearch}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={() => { if (!list.reset()) void refetch(); }} onSearch={handleSearch} loading={isFetching} />
      <SysSectionHeader
        total={total}
        actions={
          <SysExcelButton
            onClick={() => excel.mutate(buildInquiryQueryParams(params).cond)}
            loading={excel.isPending}
            disabled={total === 0}
          />
        }
      />
      <SysTable<InquiryItem>
        rowKey="id"
        className={styles.listTable}
        fill
        tableLayout="fixed"
        columns={COLUMNS}
        dataSource={items}
        loading={isFetching}
        onRowClick={setSelected}
        sort={list.sort}
        onSortChange={list.setSort}
        locale={{ emptyText: filtered ? t('messages.content.inquiry.noResults') : t('messages.content.inquiry.noPosts') }}
      />
      <SysPager page={list.page} pageSize={PAGE_SIZE} total={total} onChange={list.setPage} />
      <InquiryDetailModal
        visible={selected !== null}
        inquiry={selected}
        onClose={() => setSelected(null)}
        onRefresh={refetch}
      />
    </SysPage>
  );
}
