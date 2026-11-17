import { useState } from 'react';
import { DatePicker, Checkbox, Table, Select, Modal, message } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined,
  UpOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { deleteFaqs } from '@/api/contents/faqApi';
import type { FaqItem } from './faq.types';
import {
  useFaqs,
  DEFAULT_FAQ_CATEGORY,
  DEFAULT_FAQ_FROM_DATE,
  getDefaultFaqToDate,
} from './useFaqs';
import FaqDetailModal from './FaqDetailModal';
import styles from './FaqManagement.module.css';

const { RangePicker } = DatePicker;

// Category filter options (wireframe: dropdown, default "All").
// "All" keeps the required default API param category=FAQS.
const CATEGORY_ALL = 'ALL';
const CATEGORY_OPTIONS = [
  { label: 'All', value: CATEGORY_ALL },
  { label: 'Auction', value: 'AUCTION' },
  { label: 'Sale', value: 'SALE' },
  { label: 'Purchase', value: 'PURCHASE' },
];

const getDefaultFromDayjs = () => dayjs('2026-10-01');
const getDefaultToDayjs = () => dayjs();

function formatDateTime(val?: string | null): { date: string; time?: string } {
  if (!val || val === '-') return { date: '-' };
  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(val)) {
    const [d, t] = val.split(' ');
    return { date: d, time: t };
  }
  const d = dayjs(val);
  if (d.isValid()) {
    return { date: d.format('DD/MM/YYYY'), time: d.format('HH:mm:ss') };
  }
  return { date: val };
}

function DateTimeCell({ value }: { value?: string | null }) {
  const dt = formatDateTime(value);
  if (dt.date === '-') return <span>-</span>;
  return (
    <div className={styles.dateTimeCell}>
      <span>{dt.date}</span>
      {dt.time && <span className={styles.timeText}>{dt.time}</span>}
    </div>
  );
}

export default function FaqManagement() {
  // ── Filter UI State ────────────────────────────────────────────────────────
  const [category, setCategory] = useState<string>(CATEGORY_ALL);

  const [statusAll, setStatusAll] = useState(true);
  const [statusPost, setStatusPost] = useState(true);
  const [statusStop, setStatusStop] = useState(true);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([
    getDefaultFromDayjs(),
    getDefaultToDayjs(),
  ]);

  const [filterCollapsed, setFilterCollapsed] = useState(false);

  // ── Applied Filters (passed to getFaqs API) ────────────────────────────────
  const [appliedFilters, setAppliedFilters] = useState({
    category: DEFAULT_FAQ_CATEGORY,
    fromDate: DEFAULT_FAQ_FROM_DATE,
    toDate: getDefaultFaqToDate(),
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

  // ── Pagination Calculation ─────────────────────────────────────────────────
  const blockSize = 10;
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
  const currentBlock = Math.floor((page - 1) / blockSize);
  const startPage = currentBlock * blockSize + 1;
  const endPage = Math.min(startPage + blockSize - 1, totalPages);
  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

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
      category: category === CATEGORY_ALL ? DEFAULT_FAQ_CATEGORY : category,
      fromDate: dateRange?.[0] ? dateRange[0].format('DD/MM/YYYY') : DEFAULT_FAQ_FROM_DATE,
      toDate: dateRange?.[1] ? dateRange[1].format('DD/MM/YYYY') : getDefaultFaqToDate(),
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
    setDateRange([getDefaultFromDayjs(), getDefaultToDayjs()]);
    setSelectedRowKeys([]);
    setAppliedFilters({
      category: DEFAULT_FAQ_CATEGORY,
      fromDate: DEFAULT_FAQ_FROM_DATE,
      toDate: getDefaultFaqToDate(),
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
      message.warning('Please select at least one FAQ item to delete.');
      return;
    }
    Modal.confirm({
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
          message.success('Selected FAQs have been deleted.');
          setSelectedRowKeys([]);
          refetch();
        } catch (err) {
          console.warn('deleteFaqs failed:', err);
          message.error('Failed to delete selected FAQs.');
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
              options={CATEGORY_OPTIONS}
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
      {totalPages > 0 && (
        <div className={styles.paginationContainer}>
          {startPage > 1 && (
            <>
              <button
                type="button"
                className={styles.pageNavBtn}
                onClick={() => setPage(1)}
                title="First Page"
              >
                <DoubleLeftOutlined style={{ fontSize: 10, color: '#ffffff' }} />
              </button>
              <button
                type="button"
                className={styles.pageNavBtn}
                onClick={() => setPage(Math.max(1, startPage - blockSize))}
                title="Previous 10 Pages"
              >
                <LeftOutlined style={{ fontSize: 10, color: '#ffffff' }} />
              </button>
            </>
          )}

          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              className={p === page ? styles.pageNumberActive : styles.pageNumber}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              <button
                type="button"
                className={styles.pageNavBtn}
                onClick={() => setPage(Math.min(totalPages, endPage + 1))}
                title="Next 10 Pages"
              >
                <RightOutlined style={{ fontSize: 10, color: '#ffffff' }} />
              </button>
              <button
                type="button"
                className={styles.pageNavBtn}
                onClick={() => setPage(totalPages)}
                title="Last Page"
              >
                <DoubleRightOutlined style={{ fontSize: 10, color: '#ffffff' }} />
              </button>
            </>
          )}
        </div>
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
