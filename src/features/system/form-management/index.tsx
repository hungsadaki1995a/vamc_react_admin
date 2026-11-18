import { useState } from 'react';
import { Alert, DatePicker, Input, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useScreenLabel } from '@/hooks/use-screen-label';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { deleteForms, getForms } from '@/api/system/form-api';
import type { FormItem, FormLang, FormSearch } from '@/api/system/form-api';
import type { PageResponse } from '@/api/common/api-utils';
import { DateTimeCell, SysPageHeader, SysPagination, UseFlag, UseYnChecks } from '../_shared/system-ui';
import { errorMessage, rowNumber, toUseYnFilter } from '../_shared/system-utils';
import styles from '../_shared/system-page.module.css';
import FormModal from './form-modal';

// Form Management - List (VPA004001), menu A06010200.
// ⚠️ The admin backend has no Form Management API yet — see `@/api/sys/form-api`.

const PAGE_SIZE = 15;
const DATE_FORMAT = 'DD/MM/YYYY';

type DateRange = [Dayjs | null, Dayjs | null] | null;

interface FilterState {
  period: DateRange;
  used: boolean;
  unused: boolean;
  langCd: FormLang | '';
  formNm: string;
}

const EMPTY_FILTER: FilterState = { period: null, used: true, unused: true, langCd: '', formNm: '' };
const rowKeyOf = (form: Pick<FormItem, 'formNo' | 'langCd'>) => `${form.formNo}|${form.langCd}`;

export default function SYS020102SC() {
  const { toast, dialog } = useNotify();
  const { tvt, tvb, tvh, tsg, tsm } = useScreenLabel();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [applied, setApplied] = useState<FormSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  /** undefined = closed, null = register, FormItem = edit. */
  const [modalForm, setModalForm] = useState<FormItem | null | undefined>(undefined);

  const { data, isFetching, error } = useApiQuery<PageResponse<FormItem>>(
    ['sys', 'forms', applied, page],
    () => getForms(applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData, retry: false },
  );
  const forms = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const refresh = () => {
    setSelectedKeys([]);
    void queryClient.invalidateQueries({ queryKey: ['sys', 'forms'] });
  };

  const handleSearch = () => {
    setApplied({
      crtDtFrom: filter.period?.[0]?.format(DATE_FORMAT),
      crtDtTo: filter.period?.[1]?.format(DATE_FORMAT),
      useYn: toUseYnFilter(filter.used, filter.unused),
      langCd: filter.langCd || undefined,
      formNm: filter.formNm.trim() || undefined,
    });
    setPage(1);
    setSelectedKeys([]);
  };

  const handleReset = () => {
    setFilter(EMPTY_FILTER);
    setApplied({});
    setPage(1);
    setSelectedKeys([]);
  };

  const handleDelete = () => {
    if (selectedKeys.length === 0) {
      toast.warning(tsm('selectToDelete', 'Select at least one form to delete.'));
      return;
    }
    dialog.warning({
      okCancel: true,
      content: tsm('confirmDelete', 'Delete the selected form(s)?'),
      onOk: async () => {
        try {
          const items = selectedKeys.map((key) => {
            const [formNo, langCd] = key.split('|');
            return { formNo, langCd: langCd as FormLang };
          });
          const response = await deleteForms(items);
          toast.success(response.message || tsm('deleted', 'Deleted.'));
          refresh();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const columns: TableColumnsType<FormItem> = [
    {
      title: tsg('no', 'No'),
      key: 'no',
      width: 60,
      align: 'center',
      render: (_v, _row, index) => rowNumber(total, page, PAGE_SIZE, index),
    },
    { title: tsg('formNo', 'Form Number'), dataIndex: 'formNo', width: 110, align: 'center' },
    {
      title: tsg('useYn', 'Use'),
      dataIndex: 'useYn',
      width: 60,
      align: 'center',
      render: (value: string) => <UseFlag value={value} />,
    },
    { title: tsg('langCd', 'Language'), dataIndex: 'langCd', width: 80, align: 'center' },
    {
      title: tsg('formNm', 'Form Name'),
      dataIndex: 'formNm',
      width: 420,
      render: (value: string, row) => (
        <a className={styles.cellLink} onClick={() => setModalForm(row)}>
          {value}
        </a>
      ),
    },
    {
      title: tsg('crtDt', 'Registration Date'),
      dataIndex: 'crtDt',
      width: 110,
      align: 'center',
      render: (value?: string) => <DateTimeCell value={value} />,
    },
    {
      title: tsg('crtBy', 'Registered By'),
      key: 'crtBy',
      width: 120,
      align: 'center',
      render: (_v, row) => row.crtByNm || row.crtBy || '-',
    },
    {
      title: tsg('mdfcnDt', 'Modification Date'),
      dataIndex: 'mdfcnDt',
      width: 110,
      align: 'center',
      render: (value?: string) => <DateTimeCell value={value} />,
    },
    {
      title: tsg('mdfcnBy', 'Modified By'),
      key: 'mdfcnBy',
      width: 120,
      align: 'center',
      render: (_v, row) => row.mdfcnByNm || row.mdfcnBy || '-',
    },
  ];

  const title = tvh('page', 'Form Management');

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={[
          tvt('bcSystem', 'System Operations Management'),
          tvt('bcPlatform', 'Platform Management'),
          title,
        ]}
        title={title}
        resetLabel={tvb('reset', 'Reset')}
        searchLabel={tvb('search', 'Search')}
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />

      {error && (
        <Alert
          type="warning"
          showIcon
          message={tvt(
            'apiPending',
            'The Form Management API (/api/v1/forms) is not available in the backend yet.',
          )}
          description={error.message}
        />
      )}

      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('period', 'Registration Period')}</span>
            <DatePicker.RangePicker
              format={DATE_FORMAT}
              placeholder={['dd/mm/yyyy', 'dd/mm/yyyy']}
              value={filter.period}
              onChange={(dates) => setFilter((f) => ({ ...f, period: dates as DateRange }))}
              style={{ width: 250 }}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('status', 'Status')}</span>
            <UseYnChecks
              yes={filter.used}
              no={filter.unused}
              onChange={(used, unused) => setFilter((f) => ({ ...f, used, unused }))}
              allLabel={tvt('all', 'ALL')}
              yesLabel={tvt('used', 'Used')}
              noLabel={tvt('unused', 'Unused')}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('language', 'Select Language')}</span>
            <Select
              style={{ width: 160 }}
              value={filter.langCd}
              onChange={(langCd) => setFilter((f) => ({ ...f, langCd }))}
              options={[
                { value: '', label: tvt('all', 'ALL') },
                { value: 'VN', label: tvt('langVn', 'Vietnamese (VN)') },
                { value: 'EN', label: tvt('langEn', 'English (EN)') },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('formNm', 'Form Name')}</span>
            <Input
              className={styles.filterInput}
              placeholder={tvt('phFormNm', 'Please enter the form name')}
              value={filter.formNm}
              onChange={(e) => setFilter((f) => ({ ...f, formNm: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
      </div>

      <div className={styles.tableWrapper}>
        <Table<FormItem>
          rowKey={rowKeyOf}
          columns={columns}
          dataSource={forms}
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
        <button type="button" className={styles.btn} disabled={!canWrite} onClick={handleDelete}>
          {tvb('delete', 'Delete')}
        </button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={() => setModalForm(null)}>
          {tvb('addNew', 'Add New')}
        </button>
      </div>

      {modalForm !== undefined && (
        <FormModal form={modalForm} canWrite={canWrite} onClose={() => setModalForm(undefined)} onSaved={refresh} />
      )}
    </div>
  );
}
