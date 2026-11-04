import { useState } from 'react';
import { DatePicker, Checkbox, Table } from 'antd';
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
import type { InquiryItem } from './inquiry.types';
import { useInquiries } from './useInquiries';
import InquiryDetailModal from './InquiryDetailModal';
import styles from './InquiryManagement.module.css';

const { RangePicker } = DatePicker;

// Default filter values as required:
// 1. answerStatus is ALL
// 2. category is ALL
// 3. fromDate: 30 days from today
// 4. toDay: current day
// 5. keyword empty
const getDefaultFromDate = () => dayjs().subtract(30, 'day');
const getDefaultToDate = () => dayjs();

function formatDateTime(val?: string | null): { date: string; time?: string } {
  if (!val || val === '-') return { date: '-' };
  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(val)) {
    const [d, t] = val.split(' ');
    return { date: d, time: t };
  }
  const d = dayjs(val);
  if (d.isValid()) {
    return {
      date: d.format('DD/MM/YYYY'),
      time: d.format('HH:mm:ss'),
    };
  }
  return { date: val };
}

export default function InquiryManagement() {
  // ── Filter UI State ────────────────────────────────────────────────────────
  // 1. answerStatus ALL: All, Completed, Incomplete all checked
  const [responseStatusAll, setResponseStatusAll] = useState(true);
  const [statusCompleted, setStatusCompleted] = useState(true);
  const [statusIncomplete, setStatusIncomplete] = useState(true);

  // 2. category ALL: All, Consulting, General all checked
  const [inquiryTypeAll, setInquiryTypeAll] = useState(true);
  const [typeConsulting, setTypeConsulting] = useState(true);
  const [typeGeneral, setTypeGeneral] = useState(true);

  // 3 & 4. fromDate: 30 days from today, toDay: current day
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([
    getDefaultFromDate(),
    getDefaultToDate(),
  ]);

  // 5. keyword empty
  const [keyword] = useState('');

  // Filter Collapse state
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  // ── Applied Filters (passed to getInquiries API) ───────────────────────────
  const [appliedFilters, setAppliedFilters] = useState({
    answerStatus: 'ALL', // 1. answerStatus is ALL
    category: '',     // 2. category is ALL
    fromDate: getDefaultFromDate().format('DD/MM/YYYY'), // 3. fromDate: 30 days from today
    toDate: getDefaultToDate().format('DD/MM/YYYY'),     // 4. toDay: current day
    keyword: '',      // 5. keyword empty
  });

  // ── Pagination State ───────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // ── API Query Hook: getInquiries (/api/v1/contents/inquiries) ───────────────
  const {
    items: inquiryItems,
    total,
    isLoading,
    isFetching,
    refetch,
  } = useInquiries({
    page,
    pageSize,
    answerStatus: appliedFilters.answerStatus,
    category: appliedFilters.category,
    fromDate: appliedFilters.fromDate,
    toDate: appliedFilters.toDate,
    keyword: appliedFilters.keyword,
  });

  // ── Pagination Calculation (Centered 10-page block below table) ────────────
  const blockSize = 10;
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
  const currentBlock = Math.floor((page - 1) / blockSize);
  const startPage = currentBlock * blockSize + 1;
  const endPage = Math.min(startPage + blockSize - 1, totalPages);

  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  // ── Detail Modal State ─────────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);

  // ── Response Status Checkbox Handlers ──────────────────────────────────────
  const handleResponseStatusAllChange = (e: { target: { checked: boolean } }) => {
    const checked = e.target.checked;
    setResponseStatusAll(checked);
    setStatusCompleted(checked);
    setStatusIncomplete(checked);
  };

  const handleStatusCompletedChange = (e: { target: { checked: boolean } }) => {
    const checked = e.target.checked;
    setStatusCompleted(checked);
    setResponseStatusAll(checked && statusIncomplete);
  };

  const handleStatusIncompleteChange = (e: { target: { checked: boolean } }) => {
    const checked = e.target.checked;
    setStatusIncomplete(checked);
    setResponseStatusAll(checked && statusCompleted);
  };

  // ── Inquiry Type Checkbox Handlers ─────────────────────────────────────────
  const handleInquiryTypeAllChange = (e: { target: { checked: boolean } }) => {
    const checked = e.target.checked;
    setInquiryTypeAll(checked);
    setTypeConsulting(checked);
    setTypeGeneral(checked);
  };

  const handleTypeConsultingChange = (e: { target: { checked: boolean } }) => {
    const checked = e.target.checked;
    setTypeConsulting(checked);
    setInquiryTypeAll(checked && typeGeneral);
  };

  const handleTypeGeneralChange = (e: { target: { checked: boolean } }) => {
    const checked = e.target.checked;
    setTypeGeneral(checked);
    setInquiryTypeAll(checked && typeConsulting);
  };

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleView = () => {
    // Determine answerStatus: 'ALL' for All
    let answerStatus = 'ALL';
    if (statusCompleted && !statusIncomplete) {
      answerStatus = 'ANSWERED';
    } else if (statusIncomplete && !statusCompleted) {
      answerStatus = 'UNANSWERED';
    }

    // Determine category: 'ALL' for All
    let category = 'ALL';
    if (typeConsulting && !typeGeneral) {
      category = 'CST';
    } else if (typeGeneral && !typeConsulting) {
      category = 'ETC';
    }

    const fromDate = dateRange?.[0] ? dateRange[0].format('DD/MM/YYYY') : '';
    const toDate = dateRange?.[1] ? dateRange[1].format('DD/MM/YYYY') : '';

    setAppliedFilters({
      answerStatus,
      category,
      fromDate,
      toDate,
      keyword: keyword.trim(),
    });
    setPage(1);
  };

  const handleReset = () => {
    // Reset to requirements:
    // 1. answerStatus is ALL
    // 2. category is ALL
    // 3. fromDate: 30 days from today
    // 4. toDay: current day
    // 5. keyword empty
    setResponseStatusAll(true);
    setStatusCompleted(true);
    setStatusIncomplete(true);

    setInquiryTypeAll(true);
    setTypeConsulting(true);
    setTypeGeneral(true);

    const defaultFrom = getDefaultFromDate();
    const defaultTo = getDefaultToDate();
    setDateRange([defaultFrom, defaultTo]);

    setAppliedFilters({
      answerStatus: 'ALL',
      category: 'ALL',
      fromDate: defaultFrom.format('DD/MM/YYYY'),
      toDate: defaultTo.format('DD/MM/YYYY'),
      keyword: '',
    });
    setPage(1);
  };

  const handleOpenDetail = (item: InquiryItem) => {
    setSelectedInquiry(item);
    setModalVisible(true);
  };

  const handleResponseSubmit = (inquiryId: string, responseText: string, responderName: string) => {
    if (selectedInquiry && selectedInquiry.id === inquiryId) {
      setSelectedInquiry((prev) =>
        prev
          ? {
            ...prev,
            answerStatus: 'ANSWERED',
            status: 'Completed',
            responder: responderName,
            ansEmpNm: responderName,
            responseDate: dayjs().format('DD/MM/YYYY HH:mm:ss'),
            answeredAt: dayjs().format('DD/MM/YYYY HH:mm:ss'),
            responseContent: responseText,
          }
          : null
      );
    }
  };

  // ── Table Columns ──────────────────────────────────────────────────────────
  // Required:
  // 1. No is the order number of rows
  // 2. Status using field answerStatus
  // 3. Inquiry Type using field categoryNm
  // 4. Inquiry Title using field title
  const columns: TableColumnsType<InquiryItem> = [
    {
      title: 'No',
      key: 'no',
      width: 70,
      align: 'center',
      render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: 'Status',
      dataIndex: 'answerStatus',
      key: 'answerStatus',
      width: 120,
      align: 'center',
      render: (answerStatus: string, record: InquiryItem) => {
        const val = record.answerStatus || answerStatus || 'UNANSWERED';
        const isUnanswered = val === 'UNANSWERED' || val === 'Unanswered';
        return (
          <span className={isUnanswered ? styles.statusUnanswered : styles.statusCompleted}>
            {val}
          </span>
        );
      },
    },
    {
      title: 'Inquiry Type',
      dataIndex: 'categoryNm',
      key: 'categoryNm',
      width: 140,
      align: 'center',
      render: (categoryNm: string, record: InquiryItem) => (
        <span>{record.categoryNm || categoryNm || record.category || '-'}</span>
      ),
    },
    {
      title: 'Inquiry Title',
      dataIndex: 'title',
      key: 'title',
      align: 'left',
      render: (title: string, record: InquiryItem) => (
        <a
          className={styles.inquiryTitleLink}
          onClick={(e) => {
            e.preventDefault();
            handleOpenDetail(record);
          }}
        >
          {record.title || title || "The user's inquiry will be displayed."}
        </a>
      ),
    },
    {
      title: 'Registration Date',
      dataIndex: 'crtDt',
      key: 'crtDt',
      width: 140,
      align: 'center',
      render: (crtDt: string, record: InquiryItem) => {
        const dt = formatDateTime(record.crtDt || record.registrationDate || crtDt);
        return (
          <div className={styles.dateTimeCell}>
            <span>{dt.date}</span>
            {dt.time && <span className={styles.timeText}>{dt.time}</span>}
          </div>
        );
      },
    },
    {
      title: 'Registered Customer',
      dataIndex: 'registeredCustomer',
      key: 'registeredCustomer',
      width: 150,
      align: 'center',
      render: (customer: string, record: InquiryItem) => (
        <span>{record.inquirerNm || record.mbrNo || record.registeredCustomer || customer || 'Member ID'}</span>
      ),
    },
    {
      title: 'Response Date',
      dataIndex: 'answeredAt',
      key: 'answeredAt',
      width: 140,
      align: 'center',
      render: (answeredAt: string | null, record: InquiryItem) => {
        const dt = formatDateTime(record.answeredAt || record.responseDate || answeredAt);
        if (dt.date === '-') return <span>-</span>;
        return (
          <div className={styles.dateTimeCell}>
            <span>{dt.date}</span>
            {dt.time && <span className={styles.timeText}>{dt.time}</span>}
          </div>
        );
      },
    },
    {
      title: 'Responder',
      dataIndex: 'ansEmpNm',
      key: 'ansEmpNm',
      width: 130,
      align: 'center',
      render: (ansEmpNm: string | null, record: InquiryItem) => (
        <span>{record.ansEmpNm || record.ansEmpNo || record.responder || ansEmpNm || '-'}</span>
      ),
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
        <span className={styles.breadcrumbCurrent}>1:1 Inquiry Management</span>
      </div>

      {/* ── Title & Header Actions ──────────────────────────────────────────── */}
      <div className={styles.titleRow}>
        <h1 className={styles.pageTitle}>1:1 Inquiry List</h1>
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

      {/* ── Filter Card ─────────────────────────────────────────────────────── */}
      {!filterCollapsed && (
        <div className={styles.filterCard}>
          {/* Response Status (1. answerStatus ALL = All) */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Response Status</span>
            <div className={styles.filterCheckboxes}>
              <Checkbox checked={responseStatusAll} onChange={handleResponseStatusAllChange}>
                All
              </Checkbox>
              <Checkbox checked={statusCompleted} onChange={handleStatusCompletedChange}>
                Completed
              </Checkbox>
              <Checkbox checked={statusIncomplete} onChange={handleStatusIncompleteChange}>
                Incomplete
              </Checkbox>
            </div>
          </div>

          {/* Inquiry Type (2. category ALL = All) */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Inquiry Type</span>
            <div className={styles.filterCheckboxes}>
              <Checkbox checked={inquiryTypeAll} onChange={handleInquiryTypeAllChange}>
                All
              </Checkbox>
              <Checkbox checked={typeConsulting} onChange={handleTypeConsultingChange}>
                Consulting Inquiry
              </Checkbox>
              <Checkbox checked={typeGeneral} onChange={handleTypeGeneralChange}>
                General Inquiry
              </Checkbox>
            </div>
          </div>

          {/* Registration Period (3. fromDate 30 days from today, 4. toDay current day) */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Registration Period</span>
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={['dd/mm/yyyy', 'dd/mm/yyyy']}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
              style={{ width: 260 }}
            />
          </div>
        </div>
      )}

      {/* ── Summary Count ───────────────────────────────────────────────────── */}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
      </div>

      {/* ── Data Table ──────────────────────────────────────────────────────── */}
      <div className={styles.tableWrapper}>
        <Table<InquiryItem>
          rowKey="id"
          columns={columns}
          dataSource={inquiryItems}
          loading={isLoading || isFetching}
          pagination={false}
          size="middle"
          scroll={{ x: 1000 }}
        />
      </div>

      {/* ── Centered Pagination (Matching Design) ────────────────────────────── */}
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

      {/* ── Detail / Reply Modal ────────────────────────────────────────────── */}
      <InquiryDetailModal
        visible={modalVisible}
        inquiry={selectedInquiry}
        onClose={() => setModalVisible(false)}
        onRefresh={refetch}
        onResponseSubmit={handleResponseSubmit}
      />
    </div>
  );
}
