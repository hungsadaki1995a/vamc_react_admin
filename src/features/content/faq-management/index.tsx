import { useState } from 'react';
import { DatePicker, Checkbox, Table, Select } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { deleteFaqs } from '@/api/contents/faq-api';
import { ApiError } from '@/lib/api/error';
import { useNotify } from '@/hooks/use-notify';
import { DateTimeCell, SysPagination } from '@/features/system/_shared/system-ui';
import type { FaqItem } from './faq.types';
import {
  useFaqs,
} from './use-faqs';
import FaqDetailModal from './faq-detail-modal';
import { useFaqCategories } from './use-faq-categories';
import styles from './faq-management.module.scss';

const { RangePicker } = DatePicker;

// "All" sends no category; the options come from COM_CD FAQ_CTGRY_CD.
const CATEGORY_ALL = 'ALL';


export default function FaqManagement() {
  const { toast, dialog } = useNotify();
  // ── Filter UI State ────────────────────────────────────────────────────────
  const [category, setCategory] = useState<string>(CATEGORY_ALL);
  const faqCategories = useFaqCategories();
  const categoryOptions = [{ label: 'All', value: CATEGORY_ALL }, ...faqCategories];

  const [statusAll, setStatusAll] = useState(true);
  const [statusPost, setStatusPost] = useState(true);
  const [statusStop, setStatusStop] = useState(true);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const [filterCollapsed, setFilterCollapsed] = useState(false);

  // ── Applied Filters (passed to getFaqs API) ────────────────────────────────
  const [appliedFilters, setAppliedFilters] = useState({
    category: CATEGORY_ALL,
    fromDate: '',
    toDate: '',
    published: '',
  });

  // ── Pagination & Selection State ───────────────────────────────────────────
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // ── API Query Hook: getFaqs (/api/v1/contents/faqs) ────────────────────────
  const {
    items: faqItems,
    total,
    isLoading,
    isFetching,
    refetch,
  } = useFaqs({
    page,
    pageSize,
    category: appliedFilters.category,
    fromDate: appliedFilters.fromDate,
    toDate: appliedFilters.toDate,
    published: appliedFilters.published,
  });

  // ── Modal State ────────────────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'detail'>('detail');
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);

  // ── Status Checkbox Handlers ───────────────────────────────────────────────
  const handleStatusAllChange = (e: { target: { checked: boolean } }) => {
    const checked = e.target.checked;
    setStatusAll(checked);
    setStatusPost(checked);
    setStatusStop(checked);
  };

  const handleStatusPostChange = (e: { target: { checked: boolean } }) => {
    const checked = e.target.checked;
    setStatusPost(checked);
    setStatusAll(checked && statusStop);
  };

  const handleStatusStopChange = (e: { target: { checked: boolean } }) => {
    const checked = e.target.checked;
    setStatusStop(checked);
    setStatusAll(checked && statusPost);
  };

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleView = () => {
    let published = '';
    if (statusPost && !statusStop) published = 'Y';
    else if (statusStop && !statusPost) published = 'N';

    setAppliedFilters({
      category,
      fromDate: dateRange?.[0] ? dateRange[0].format('DD/MM/YYYY') : '',
      toDate: dateRange?.[1] ? dateRange[1].format('DD/MM/YYYY') : '',
      published,
    });
    setSelectedRowKeys([]);
    setPage(1);
  };

  const handleReset = () => {
    setCategory(CATEGORY_ALL);
    setStatusAll(true);
    setStatusPost(true);
    setStatusStop(true);
    setDateRange(null);
    setSelectedRowKeys([]);
    setAppliedFilters({
      category: CATEGORY_ALL,
      fromDate: '',
      toDate: '',
      published: '',
    });
    setPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedFaq(null);
    setModalMode('create');
    setModalVisible(true);
  };

  const handleOpenDetail = (item: FaqItem) => {
    setSelectedFaq(item);
    setModalMode('detail');
    setModalVisible(true);
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      toast.warning('Please select at least one FAQ item to delete.');
      return;
    }
    dialog.confirm({
      title: 'Delete FAQs',
      content: `Are you sure you want to delete ${selectedRowKeys.length} selected FAQ(s)?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteFaqs({
            body: { pstNos: selectedRowKeys.map(String) },
            throwOnError: true,
          });
          toast.success('Selected FAQs have been deleted.');
          setSelectedRowKeys([]);
          refetch();
        } catch (err) {
          toast.error(ApiError.from(err).message);
        }
      },
    });
  };

  // ── Table Columns (wireframe order) ────────────────────────────────────────
  // No | Status | Order | Category | Questions and Answers |
  // Registration Date | Registrant | Modification Date | Modifier
  const columns: TableColumnsType<FaqItem> = [
    {
      title: 'No',
      key: 'no',
      width: 70,
      align: 'center',
      render: (_v, record) => record.no,
    },
    {
      title: 'Status',
      dataIndex: 'published',
      key: 'published',
      width: 100,
      align: 'center',
      render: (published: string) =>
        published === 'Y' ? (
          <span className={styles.statusPosted}>Post</span>
        ) : (
          <span className={styles.statusUnposted}>Post Stop</span>
        ),
    },
    {
      title: 'Order',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 80,
      align: 'center',
      render: (order?: number) => <span>{order ?? '-'}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'categoryNm',
      key: 'categoryNm',
      width: 120,
      align: 'center',
      render: (_v, record) => <span>{record.categoryNm || record.category || '-'}</span>,
    },
    {
      title: 'Questions and Answers',
      dataIndex: 'title',
      key: 'title',
      align: 'left',
      width: 420,
      render: (title: string, record: FaqItem) => (
        <a
          className={styles.faqTitleLink}
          onClick={(e) => {
            e.preventDefault();
            handleOpenDetail(record);
          }}
        >
          {record.title || title || '-'}
        </a>
      ),
    },
    {
      title: 'Registration Date',
      dataIndex: 'crtDt',
      key: 'crtDt',
      width: 130,
      align: 'center',
      render: (crtDt: string) => <DateTimeCell value={crtDt} />,
    },
    {
      title: 'Registrant',
      dataIndex: 'crtByNm',
      key: 'crtByNm',
      width: 120,
      align: 'center',
      render: (_v, record) => <span>{record.crtByNm || record.crtBy || '-'}</span>,
    },
    {
      title: 'Modification Date',
      dataIndex: 'mdfcnDt',
      key: 'mdfcnDt',
      width: 130,
      align: 'center',
      render: (mdfcnDt: string | null) => <DateTimeCell value={mdfcnDt} />,
    },
    {
      title: 'Modifier',
      dataIndex: 'mdfcnByNm',
      key: 'mdfcnByNm',
      width: 120,
      align: 'center',
      render: (_v, record) => <span>{record.mdfcnByNm || record.mdfcnBy || '-'}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbLink}>Home</span>
        <span className={styles.breadcrumbSeparator}>&gt;</span>
        <span className={styles.breadcrumbLink}>Content Management</span>
        <span className={styles.breadcrumbSeparator}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>FAQ Management</span>
      </div>

      {/* ── Title & Header Actions ──────────────────────────────────────────── */}
      <div className={styles.titleRow}>
        <h1 className={styles.pageTitle}>FAQ Management</h1>
        <div className={styles.headerActions}>
          <button className={styles.btnReset} onClick={handleReset}>
            Reset
          </button>
          <button className={styles.btnView} onClick={handleView}>
            <SearchOutlined style={{ fontSize: 13 }} />
            View
          </button>
          <button
            className={styles.btnCollapse}
            onClick={() => setFilterCollapsed(!filterCollapsed)}
            title={filterCollapsed ? 'Expand Filters' : 'Collapse Filters'}
          >
            {filterCollapsed ? <DownOutlined /> : <UpOutlined />}
          </button>
        </div>
      </div>

      {/* ── Filter Card: Status | Category | Registration Period ────────────── */}
      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            <div className={styles.filterCheckboxes}>
              <Checkbox checked={statusAll} onChange={handleStatusAllChange}>
                All
              </Checkbox>
              <Checkbox checked={statusPost} onChange={handleStatusPostChange}>
                Post
              </Checkbox>
              <Checkbox checked={statusStop} onChange={handleStatusStopChange}>
                Stop Posting
              </Checkbox>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Category</span>
            <Select
              value={category}
              onChange={(val) => setCategory(val)}
              style={{ width: 220 }}
              options={categoryOptions}
            />
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Registration Period</span>
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={['dd/mm/yyyy', 'dd/mm/yyyy']}
              value={dateRange}
              onChange={(dates) =>
                setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)
              }
              style={{ width: 250 }}
            />
          </div>
        </div>
      )}

      {/* ── Total ───────────────────────────────────────────────────────────── */}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
      </div>

      {/* ── Data Table ──────────────────────────────────────────────────────── */}
      <div className={styles.tableWrapper}>
        <Table<FaqItem>
          rowKey={(record) => record.pstNo || record.id}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          columns={columns}
          dataSource={faqItems}
          loading={isLoading || isFetching}
          pagination={false}
          size="middle"
          scroll={{ x: 'max-content', y: 480 }}
        />
      </div>

      {/* ── Centered Pagination ─────────────────────────────────────────────── */}
      {total > 0 && (
        <SysPagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
      )}

      {/* ── Bottom actions: Delete | Add New ────────────────────────────────── */}
      <div className={styles.bottomActions}>
        <button type="button" className={styles.btnSecondary} onClick={handleDelete}>
          Delete
        </button>
        <button type="button" className={styles.btnPrimary} onClick={handleOpenCreate}>
          Add New
        </button>
      </div>

      {/* ── Detail / Create Modal ───────────────────────────────────────────── */}
      <FaqDetailModal
        visible={modalVisible}
        mode={modalMode}
        faq={selectedFaq}
        onClose={() => setModalVisible(false)}
        onRefresh={refetch}
      />
    </div>
  );
}
