import { useState, useMemo } from 'react';
import {
  Table,
  Checkbox,
  Input,
  DatePicker,
  Button,
  Tooltip,
  message,
} from 'antd';
import type { TableProps, TableColumnsType } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import {
  SearchOutlined,
  UndoOutlined,
  PlusOutlined,
  PaperClipOutlined,
  RightOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import type {
  MemberItem,
  MemberClassification,
  MemberType,
  ApprovalStatus,
  AccountStatus,
} from './member.types';
import { initialMemberData } from './member.mock';
import { useMembers } from './useMembers';
import MemberDetailModal from './MemberDetailModal';
import ApprovalStatusModal from './ApprovalStatusModal';
import NewMemberModal from './NewMemberModal';
import styles from './MemberList.module.css';

const { RangePicker } = DatePicker;

const ALL_CLASSIFICATIONS: MemberClassification[] = [
  'Pending (Approval)',
  'Pending (Payment)',
  'Verified',
  'Rejected',
];

const ALL_MEMBER_TYPES: MemberType[] = ['General', 'Foreigner', 'Organization'];

const ALL_ACCOUNT_STATUSES: AccountStatus[] = ['Active', 'Locked'];

const ALL_APPROVAL_STATUSES: ApprovalStatus[] = [
  'Not Received',
  'Requested',
  'In Progress',
  'Approved',
  'Rejected',
];

export default function MemberList() {
  // ── Pagination State ───────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Local State & Overrides ────────────────────────────────────────────────
  const [addedMembers, setAddedMembers] = useState<MemberItem[]>([]);
  const [memberOverrides, setMemberOverrides] = useState<Record<string, Partial<MemberItem>>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // ── Modals State ───────────────────────────────────────────────────────────
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);

  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalMember, setApprovalMember] = useState<MemberItem | null>(null);

  const [newMemberModalVisible, setNewMemberModalVisible] = useState(false);

  // ── Filter State ───────────────────────────────────────────────────────────
  // Classification
  const [classificationAll, setClassificationAll] = useState(false);
  const [selectedClassifications, setSelectedClassifications] = useState<MemberClassification[]>([
    'Pending (Approval)',
    'Pending (Payment)',
    'Verified',
    'Rejected',
  ]);

  // Member Type
  const [memberTypeAll, setMemberTypeAll] = useState(true);
  const [selectedMemberTypes, setSelectedMemberTypes] = useState<MemberType[]>([]);

  // Account Status
  const [accountStatusAll, setAccountStatusAll] = useState(true);
  const [selectedAccountStatuses, setSelectedAccountStatuses] = useState<AccountStatus[]>([]);

  // Approval Status
  const [approvalStatusAll, setApprovalStatusAll] = useState(true);
  const [selectedApprovalStatuses, setSelectedApprovalStatuses] = useState<ApprovalStatus[]>([]);

  // Text Inputs
  const [filterMemberName, setFilterMemberName] = useState('');
  const [filterCompanyName, setFilterCompanyName] = useState('');
  const [filterMemberCode, setFilterMemberCode] = useState('');
  const [filterPhoneNumber, setFilterPhoneNumber] = useState('');
  const [filterEmail, setFilterEmail] = useState('');

  // Date Range
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Applied Filter Snapshot (triggers actual filter on Search button click)
  const [appliedFilters, setAppliedFilters] = useState({
    classificationAll: false,
    selectedClassifications: ['Pending (Approval)', 'Pending (Payment)', 'Verified', 'Rejected'] as MemberClassification[],
    memberTypeAll: true,
    selectedMemberTypes: [] as MemberType[],
    accountStatusAll: true,
    selectedAccountStatuses: [] as AccountStatus[],
    approvalStatusAll: true,
    selectedApprovalStatuses: [] as ApprovalStatus[],
    memberName: '',
    companyName: '',
    memberCode: '',
    phoneNumber: '',
    email: '',
    dateRange: null as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
  });

  // ── API Member Query Hook ──────────────────────────────────────────────────
  const {
    data: memberResult,
    items: memberItems,
    isLoading,
    isFetching,
  } = useMembers({
    page,
    pageSize,
    ...appliedFilters,
  });

  // ── Filter Checkbox Handlers ───────────────────────────────────────────────
  // Classification
  const handleClassificationAllChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    setClassificationAll(checked);
    if (checked) {
      setSelectedClassifications([...ALL_CLASSIFICATIONS]);
    } else {
      setSelectedClassifications([]);
    }
  };

  const handleClassificationChange = (values: MemberClassification[]) => {
    setSelectedClassifications(values);
    setClassificationAll(values.length === ALL_CLASSIFICATIONS.length);
  };

  // Member Type
  const handleMemberTypeAllChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    setMemberTypeAll(checked);
    if (checked) {
      setSelectedMemberTypes([]);
    }
  };

  const handleMemberTypeChange = (values: MemberType[]) => {
    setSelectedMemberTypes(values);
    setMemberTypeAll(values.length === 0 || values.length === ALL_MEMBER_TYPES.length);
  };

  // Account Status
  const handleAccountStatusAllChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    setAccountStatusAll(checked);
    if (checked) {
      setSelectedAccountStatuses([]);
    }
  };

  const handleAccountStatusChange = (values: AccountStatus[]) => {
    setSelectedAccountStatuses(values);
    setAccountStatusAll(values.length === 0 || values.length === ALL_ACCOUNT_STATUSES.length);
  };

  // Approval Status
  const handleApprovalStatusAllChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    setApprovalStatusAll(checked);
    if (checked) {
      setSelectedApprovalStatuses([]);
    }
  };

  const handleApprovalStatusChange = (values: ApprovalStatus[]) => {
    setSelectedApprovalStatuses(values);
    setApprovalStatusAll(values.length === 0 || values.length === ALL_APPROVAL_STATUSES.length);
  };

  // ── Search & Reset ─────────────────────────────────────────────────────────
  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({
      classificationAll,
      selectedClassifications,
      memberTypeAll,
      selectedMemberTypes,
      accountStatusAll,
      selectedAccountStatuses,
      approvalStatusAll,
      selectedApprovalStatuses,
      memberName: filterMemberName.trim(),
      companyName: filterCompanyName.trim(),
      memberCode: filterMemberCode.trim(),
      phoneNumber: filterPhoneNumber.trim(),
      email: filterEmail.trim(),
      dateRange,
    });
    message.info('Filter applied');
  };

  const handleReset = () => {
    setClassificationAll(false);
    setSelectedClassifications(['Pending (Approval)', 'Pending (Payment)', 'Verified', 'Rejected']);
    setMemberTypeAll(true);
    setSelectedMemberTypes([]);
    setAccountStatusAll(true);
    setSelectedAccountStatuses([]);
    setApprovalStatusAll(true);
    setSelectedApprovalStatuses([]);
    setFilterMemberName('');
    setFilterCompanyName('');
    setFilterMemberCode('');
    setFilterPhoneNumber('');
    setFilterEmail('');
    setDateRange(null);
    setPage(1);

    setAppliedFilters({
      classificationAll: false,
      selectedClassifications: ['Pending (Approval)', 'Pending (Payment)', 'Verified', 'Rejected'],
      memberTypeAll: true,
      selectedMemberTypes: [],
      accountStatusAll: true,
      selectedAccountStatuses: [],
      approvalStatusAll: true,
      selectedApprovalStatuses: [],
      memberName: '',
      companyName: '',
      memberCode: '',
      phoneNumber: '',
      email: '',
      dateRange: null,
    });
    message.info('Filters reset to default');
  };

  // ── Combined Members Memo ─────────────────────────────────────────────────
  const allMembers = useMemo(() => {
    const base = memberResult ? memberItems : initialMemberData;
    return [...addedMembers, ...base].map((item) => {
      const override = memberOverrides[item.id];
      return override ? { ...item, ...override } : item;
    });
  }, [memberResult, memberItems, addedMembers, memberOverrides]);

  // ── Filtered Data Memo ─────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    // If API returned data from backend, it is already filtered and paginated on server
    if (memberResult) {
      return allMembers;
    }

    return allMembers.filter((item) => {
      // 1. Classification
      if (
        !appliedFilters.classificationAll &&
        appliedFilters.selectedClassifications.length > 0 &&
        !appliedFilters.selectedClassifications.includes(item.memberClassification)
      ) {
        return false;
      }

      // 2. Member Type
      if (
        !appliedFilters.memberTypeAll &&
        appliedFilters.selectedMemberTypes.length > 0 &&
        !appliedFilters.selectedMemberTypes.includes(item.memberType)
      ) {
        return false;
      }

      // 3. Account Status
      if (
        !appliedFilters.accountStatusAll &&
        appliedFilters.selectedAccountStatuses.length > 0 &&
        !appliedFilters.selectedAccountStatuses.includes(item.accountStatus)
      ) {
        return false;
      }

      // 4. Approval Status
      if (
        !appliedFilters.approvalStatusAll &&
        appliedFilters.selectedApprovalStatuses.length > 0 &&
        !appliedFilters.selectedApprovalStatuses.includes(item.approvalStatus)
      ) {
        return false;
      }

      // 5. Member / Assignee Name
      if (appliedFilters.memberName) {
        const query = appliedFilters.memberName.toLowerCase();
        const matchName = item.memberName.toLowerCase().includes(query);
        const matchAssignee = item.assignee.toLowerCase().includes(query);
        if (!matchName && !matchAssignee) return false;
      }

      // 6. Company Name
      if (
        appliedFilters.companyName &&
        !item.companyName.toLowerCase().includes(appliedFilters.companyName.toLowerCase())
      ) {
        return false;
      }

      // 7. Member Code
      if (
        appliedFilters.memberCode &&
        !item.memberCode.toLowerCase().includes(appliedFilters.memberCode.toLowerCase())
      ) {
        return false;
      }

      // 8. Phone Number
      if (
        appliedFilters.phoneNumber &&
        !item.phone.replace(/\s+/g, '').includes(appliedFilters.phoneNumber.replace(/\s+/g, ''))
      ) {
        return false;
      }

      // 9. Email
      if (
        appliedFilters.email &&
        !item.email.toLowerCase().includes(appliedFilters.email.toLowerCase())
      ) {
        return false;
      }

      // 10. Date Range
      if (appliedFilters.dateRange && appliedFilters.dateRange[0] && appliedFilters.dateRange[1]) {
        // format is DD/MM/YYYY
        const [d, m, y] = item.applicationDate.split('/');
        const itemDate = dayjs(`${y}-${m}-${d}`);
        if (
          itemDate.isBefore(appliedFilters.dateRange[0], 'day') ||
          itemDate.isAfter(appliedFilters.dateRange[1], 'day')
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allMembers, memberResult, appliedFilters]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleOpenDetail = (member: MemberItem) => {
    setSelectedMember(member);
    setDetailModalVisible(true);
  };

  const handleOpenApproval = (member: MemberItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setApprovalMember(member);
    setApprovalModalVisible(true);
  };

  const handleUpdateAccountStatus = (memberId: string, newAccountStatus: AccountStatus) => {
    setMemberOverrides((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], accountStatus: newAccountStatus },
    }));
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember({ ...selectedMember, accountStatus: newAccountStatus });
    }
  };

  const handleUpdateApprovalStatus = (
    memberId: string,
    newApprovalStatus: ApprovalStatus,
    newAssignee?: string,
    _note?: string
  ) => {
    setMemberOverrides((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        approvalStatus: newApprovalStatus,
        ...(newAssignee !== undefined ? { assignee: newAssignee } : {}),
      },
    }));
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember({
        ...selectedMember,
        approvalStatus: newApprovalStatus,
        assignee: newAssignee !== undefined ? newAssignee : selectedMember.assignee,
      });
    }
  };

  const handleAddMember = (newMemberData: Omit<MemberItem, 'id' | 'no'>) => {
    const nextNo = Math.max(...allMembers.map((d) => d.no), 199) + 1;
    const newEntry: MemberItem = {
      ...newMemberData,
      id: `mem-${nextNo}`,
      no: nextNo,
    };
    setAddedMembers((prev) => [newEntry, ...prev]);
  };

  // ── Excel Export ───────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    try {
      const exportRows = filteredData.map((row) => ({
        'No.': row.no,
        'Member Classification': row.memberClassification,
        'Member Code': row.memberCode,
        'Application ID': row.applicationId,
        'Member Type': row.memberType,
        'Member Name': row.memberName,
        'Approval Status': row.approvalStatus,
        'Assignee': row.assignee,
        'Application Date': row.applicationDate,
        'Received Date': row.receivedDate,
        'Attachments': row.attachments,
        'Company Name': row.companyName,
        'Approval Date': row.approvalDate,
        'Phone': row.phone,
        'Email': row.email,
        'Account Status': row.accountStatus,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      // Auto column widths
      const colWidths = Object.keys(exportRows[0] || {}).map((key) => ({
        wch: Math.max(key.length, 16),
      }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

      const fileName = `VAMC_Member_Management_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      message.success(`Exported ${filteredData.length} records to ${fileName}`);
    } catch {
      message.error('Failed to export Excel file');
    }
  };

  // ── Table Column Definitions ───────────────────────────────────────────────
  const columns: TableColumnsType<MemberItem> = [
    {
      title: 'No.',
      dataIndex: 'no',
      key: 'no',
      width: 65,
      align: 'center',
      sorter: (a, b) => a.no - b.no,
    },
    {
      title: 'Member Classification',
      dataIndex: 'memberClassification',
      key: 'memberClassification',
      width: 175,
      align: 'center',
      sorter: (a, b) => a.memberClassification.localeCompare(b.memberClassification),
      render: (val: MemberClassification) => {
        if (val === 'Pending (Approval)') {
          return <span className={styles.badgePendingApproval}>Pending (Approval)</span>;
        }
        if (val === 'Pending (Payment)') {
          return <span className={styles.badgePendingPayment}>Pending (Payment)</span>;
        }
        if (val === 'Rejected') {
          return <span className={styles.badgeRejected}>Rejected</span>;
        }
        return <span className={styles.badgeVerified}>Verified</span>;
      },
    },
    {
      title: 'Member Code',
      dataIndex: 'memberCode',
      key: 'memberCode',
      width: 155,
      sorter: (a, b) => a.memberCode.localeCompare(b.memberCode),
      render: (val: string, record: MemberItem) => (
        <span
          className={styles.memberCodeLink}
          onClick={() => handleOpenDetail(record)}
          title="Click to view member details"
        >
          {val}
        </span>
      ),
    },
    {
      title: 'Application ID',
      dataIndex: 'applicationId',
      key: 'applicationId',
      width: 135,
      sorter: (a, b) => a.applicationId.localeCompare(b.applicationId),
      render: (val: string) => <span style={{ color: '#4b5563' }}>{val}</span>,
    },
    {
      title: 'Member Type',
      dataIndex: 'memberType',
      key: 'memberType',
      width: 120,
      sorter: (a, b) => a.memberType.localeCompare(b.memberType),
      render: (val: string) => <span>{val}</span>,
    },
    {
      title: 'Member Name',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 145,
      sorter: (a, b) => a.memberName.localeCompare(b.memberName),
      render: (val: string) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      title: 'Approval Status',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 140,
      align: 'center',
      sorter: (a, b) => a.approvalStatus.localeCompare(b.approvalStatus),
      render: (val: ApprovalStatus, record: MemberItem) => {
        let pillClass = styles.statusNotReceived;
        if (val === 'Requested') pillClass = styles.statusRequested;
        if (val === 'In Progress') pillClass = styles.statusInProgress;
        if (val === 'Rejected') pillClass = styles.statusRejected;
        if (val === 'Approved') pillClass = styles.statusApproved;

        return (
          <button
            type="button"
            className={`${styles.statusPill} ${pillClass}`}
            onClick={(e) => handleOpenApproval(record, e)}
            title="Click to change status"
          >
            <span>{val}</span>
            <RightOutlined style={{ fontSize: 9 }} />
          </button>
        );
      },
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 130,
      sorter: (a, b) => a.assignee.localeCompare(b.assignee),
      render: (val: string) => (
        <span>{val === '-' ? <span style={{ color: '#9ca3af' }}>-</span> : val}</span>
      ),
    },
    {
      title: 'Application Date',
      dataIndex: 'applicationDate',
      key: 'applicationDate',
      width: 130,
      align: 'center',
      sorter: (a, b) => a.applicationDate.localeCompare(b.applicationDate),
    },
    {
      title: 'Received Date',
      dataIndex: 'receivedDate',
      key: 'receivedDate',
      width: 130,
      align: 'center',
      sorter: (a, b) => a.receivedDate.localeCompare(b.receivedDate),
    },
    {
      title: 'Attachments',
      dataIndex: 'attachments',
      key: 'attachments',
      width: 110,
      align: 'center',
      sorter: (a, b) => a.attachments - b.attachments,
      render: (val: number, record: MemberItem) => (
        <Tooltip title={`${val} attachment(s) uploaded. Click member code to view files.`}>
          <span
            onClick={() => handleOpenDetail(record)}
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: '#4b5563',
            }}
          >
            <PaperClipOutlined style={{ fontSize: 12, color: '#6b7280' }} />
            <span>{val}</span>
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 170,
      sorter: (a, b) => a.companyName.localeCompare(b.companyName),
      render: (val: string) => (
        <span>{val === '-' ? <span style={{ color: '#9ca3af' }}>-</span> : val}</span>
      ),
    },
    {
      title: 'Approval Date',
      dataIndex: 'approvalDate',
      key: 'approvalDate',
      width: 130,
      align: 'center',
      sorter: (a, b) => a.approvalDate.localeCompare(b.approvalDate),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      sorter: (a, b) => a.phone.localeCompare(b.phone),
      render: (val: string) => <span style={{ color: '#4b5563' }}>{val}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 160,
      sorter: (a, b) => a.email.localeCompare(b.email),
      render: (val: string) => <span style={{ color: '#4b5563' }}>{val}</span>,
    },
    {
      title: 'Account Status',
      dataIndex: 'accountStatus',
      key: 'accountStatus',
      width: 130,
      align: 'center',
      sorter: (a, b) => a.accountStatus.localeCompare(b.accountStatus),
      render: (val: AccountStatus) => (
        <span className={val === 'Locked' ? styles.accountLocked : styles.accountActive}>
          {val}
        </span>
      ),
    },
  ];

  // ── Row Selection ──────────────────────────────────────────────────────────
  const rowSelection: TableProps<MemberItem>['rowSelection'] = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <div className={styles.memberPageContainer}>
      {/* ── Page Header / Breadcrumb ────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Member Management</h1>
        <div className={styles.breadcrumb}>
          <HomeOutlined style={{ fontSize: 13 }} />
          <span>&gt;</span>
          <span className={styles.breadcrumbItem}>Member Management</span>
          <span>&gt;</span>
          <span className={styles.breadcrumbActive}>Active Member Management</span>
        </div>
      </div>

      {/* ── Search Filter Card ──────────────────────────────────────────────── */}
      <div className={styles.filterCard}>
        {/* Row 1 */}
        <div className={styles.filterRow}>
          {/* Member Classification */}
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Member Classification</span>
            <div className={styles.filterControl}>
              <div className={styles.filterCheckboxGroup}>
                <Checkbox checked={classificationAll} onChange={handleClassificationAllChange}>
                  All
                </Checkbox>
                <Checkbox.Group
                  options={ALL_CLASSIFICATIONS}
                  value={selectedClassifications}
                  onChange={handleClassificationChange}
                />
              </div>
            </div>
          </div>

          {/* Member Type */}
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Member Type</span>
            <div className={styles.filterControl}>
              <div className={styles.filterCheckboxGroup}>
                <Checkbox checked={memberTypeAll} onChange={handleMemberTypeAllChange}>
                  All
                </Checkbox>
                <Checkbox.Group
                  options={ALL_MEMBER_TYPES}
                  value={selectedMemberTypes}
                  onChange={handleMemberTypeChange}
                />
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Account Status</span>
            <div className={styles.filterControl}>
              <div className={styles.filterCheckboxGroup}>
                <Checkbox checked={accountStatusAll} onChange={handleAccountStatusAllChange}>
                  All
                </Checkbox>
                <Checkbox.Group
                  options={ALL_ACCOUNT_STATUSES}
                  value={selectedAccountStatuses}
                  onChange={handleAccountStatusChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className={styles.filterRow}>
          {/* Approval Status */}
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Approval Status</span>
            <div className={styles.filterControl}>
              <div className={styles.filterCheckboxGroup}>
                <Checkbox checked={approvalStatusAll} onChange={handleApprovalStatusAllChange}>
                  All
                </Checkbox>
                <Checkbox.Group
                  options={ALL_APPROVAL_STATUSES}
                  value={selectedApprovalStatuses}
                  onChange={handleApprovalStatusChange}
                />
              </div>
            </div>
          </div>

          {/* Member Name */}
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Member Name</span>
            <div className={styles.filterControl}>
              <Input
                placeholder="Enter member or assignee name"
                value={filterMemberName}
                onChange={(e) => setFilterMemberName(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
            </div>
          </div>

          {/* Company Name */}
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Company Name</span>
            <div className={styles.filterControl}>
              <Input
                placeholder="Enter company name"
                value={filterCompanyName}
                onChange={(e) => setFilterCompanyName(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div className={styles.filterRow}>
          {/* Member Code */}
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Member Code</span>
            <div className={styles.filterControl}>
              <Input
                placeholder="Enter member code"
                value={filterMemberCode}
                onChange={(e) => setFilterMemberCode(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Phone Number</span>
            <div className={styles.filterControl}>
              <Input
                placeholder="Enter phone number"
                value={filterPhoneNumber}
                onChange={(e) => setFilterPhoneNumber(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
            </div>
          </div>

          {/* Email */}
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Email</span>
            <div className={styles.filterControl}>
              <Input
                placeholder="Enter email"
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
            </div>
          </div>
        </div>

        {/* Row 4: Registration Period & Action Buttons */}
        <div className={styles.filterActionRow}>
          <div className={styles.filterField} style={{ flex: 1, maxWidth: 540 }}>
            <span className={styles.filterLabel}>Registration Period</span>
            <div className={styles.filterControl}>
              <RangePicker
                format="DD/MM/YYYY"
                placeholder={['DD/MM/YYYY', 'DD/MM/YYYY']}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className={styles.filterActionButtons}>
            <Button className={styles.btnReset} icon={<UndoOutlined />} onClick={handleReset}>
              Reset
            </Button>
            <Button
              type="primary"
              className={styles.btnSearch}
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* ── Search Results Toolbar ─────────────────────────────────────────── */}
      <div className={styles.resultsToolbar}>
        <div className={styles.resultsSummary}>
          <span className={styles.resultsTitle}>Search Results</span>
          <span className={styles.resultsCount}>
            Total {memberResult ? memberResult.total : filteredData.length} items
          </span>
        </div>

        <div className={styles.resultsActions}>
          <Button
            type="primary"
            className={styles.btnNew}
            icon={<PlusOutlined />}
            onClick={() => setNewMemberModalVisible(true)}
          >
            New
          </Button>

          <Button className={styles.btnExcel} onClick={handleExportExcel}>
            <span className={styles.excelIconWrapper}>X</span>
            <span>Excel Download</span>
          </Button>
        </div>
      </div>

      {/* ── Main Data Table ─────────────────────────────────────────────────── */}
      <div className={styles.tableCard}>
        <Table<MemberItem>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          rowSelection={rowSelection}
          loading={isLoading || isFetching}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: memberResult ? memberResult.total : filteredData.length,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
          scroll={{ x: 'max-content', y: 560 }}
          size="middle"
        />
      </div>

      {/* ── Dialog Modals ───────────────────────────────────────────────────── */}
      <MemberDetailModal
        visible={detailModalVisible}
        member={selectedMember}
        onClose={() => setDetailModalVisible(false)}
        onStatusChange={handleUpdateAccountStatus}
        onApprovalChange={(id, status) => handleUpdateApprovalStatus(id, status)}
      />

      <ApprovalStatusModal
        visible={approvalModalVisible}
        member={approvalMember}
        onClose={() => setApprovalModalVisible(false)}
        onUpdateStatus={handleUpdateApprovalStatus}
      />

      <NewMemberModal
        visible={newMemberModalVisible}
        onClose={() => setNewMemberModalVisible(false)}
        onAddMember={handleAddMember}
      />
    </div>
  );
}
