import { useState, useMemo } from 'react';
import {
  Table,
  Checkbox,
  Input,
  Select,
  DatePicker,
  Button,
  message,
} from 'antd';
import type { TableProps, TableColumnsType } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import {
  SearchOutlined,
  UndoOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import type {
  MemberItem,
  MemberGrade,
  MemberType,
  MemberStatus,
  MembershipType,
  MemberSearchField,
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

const MEMBER_GRADE_OPTIONS: { label: string; value: MemberGrade }[] = [
  { label: 'Temporary Member', value: 'Temporary' },
  { label: 'General Member', value: 'General' },
  { label: 'Full Member', value: 'Full' },
  { label: 'Deleted Members', value: 'Deleted' },
];

const DEFAULT_MEMBER_GRADES: MemberGrade[] = ['Temporary', 'General', 'Full'];

const MEMBER_TYPE_OPTIONS: { label: string; value: MemberType }[] = [
  { label: 'Individual', value: 'General' },
  { label: 'Foreigner', value: 'Foreigner' },
  { label: 'Organization', value: 'Organization' },
];

const STATUS_OPTIONS: { label: string; value: MemberStatus }[] = [
  { label: 'Pending Approval', value: 'Pending Approval' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'Active', value: 'Active' },
  { label: 'Locked', value: 'Locked' },
];

const MEMBERSHIP_OPTIONS: { label: string; value: MembershipType }[] = [
  { label: 'Paid', value: 'Paid' },
  { label: 'Exempt', value: 'Exempt' },
  { label: 'None', value: 'None' },
];

const SEARCH_FIELD_OPTIONS: { label: string; value: MemberSearchField }[] = [
  { label: 'Member Code', value: 'MBR_NO' },
  { label: 'SGDN Member Code', value: 'SGDN_MBR_NO' },
  { label: 'Login ID', value: 'LGN_ID' },
  { label: 'Member Name', value: 'MBR_NM' },
  { label: 'Phone Number', value: 'TELNO' },
  { label: 'Email Address', value: 'EML_ADDR' },
  { label: 'Company Name', value: 'ORGNZ_NM' },
  { label: 'Enterprise Code', value: 'MST_NO' },
];

function deriveMemberGrade(item: MemberItem): MemberGrade {
  if (item.memberGrade) return item.memberGrade;
  if (item.memberClassification === 'Verified') return 'General';
  return 'Temporary';
}

function deriveMemberStatus(item: MemberItem): MemberStatus {
  if (item.status) return item.status;
  if (item.accountStatus === 'Locked') return 'Locked';
  if (item.memberClassification === 'Pending (Approval)') return 'Pending Approval';
  if (item.memberClassification === 'Rejected') return 'Rejected';
  return 'Active';
}

function formatDisplayDate(val?: string): string {
  if (!val || val === '-') return '-';
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) return val;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val.replace(/\//g, '-');
  const d = dayjs(val);
  return d.isValid() ? d.format('DD-MM-YYYY') : val;
}

function formatPaymentDeadline(val?: string): { text: string; isDanger: boolean } {
  const formatted = formatDisplayDate(val);
  if (formatted === '-') return { text: '-', isDanger: false };

  const [d, m, y] = formatted.split('-');
  const target = dayjs(`${y}-${m}-${d}`);
  if (!target.isValid()) return { text: formatted, isDanger: true };

  const diffDays = target.startOf('day').diff(dayjs().startOf('day'), 'day');
  const dDayLabel = diffDays >= 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
  return { text: `${formatted} (${dDayLabel})`, isDanger: true };
}

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

  // ── Filter State (matches Figma 3412:17631) ────────────────────────────────
  // Approval Period
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Member Grade (default: Temporary, General, Full checked; Deleted unchecked)
  const [memberGradeAll, setMemberGradeAll] = useState(false);
  const [selectedMemberGrades, setSelectedMemberGrades] = useState<MemberGrade[]>(DEFAULT_MEMBER_GRADES);

  // Member Type (default: All checked)
  const [memberTypeAll, setMemberTypeAll] = useState(true);
  const [selectedMemberTypes, setSelectedMemberTypes] = useState<MemberType[]>([]);

  // Search Select + Input
  const [searchField, setSearchField] = useState<MemberSearchField>('MBR_NO');
  const [searchText, setSearchText] = useState('');

  // Status (default: All checked)
  const [statusAll, setStatusAll] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<MemberStatus[]>([]);

  // Membership (default: All checked)
  const [membershipAll, setMembershipAll] = useState(true);
  const [selectedMemberships, setSelectedMemberships] = useState<MembershipType[]>([]);

  // Applied Filter Snapshot (triggers actual filter on Search button click)
  const [appliedFilters, setAppliedFilters] = useState({
    dateRange: null as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    memberGradeAll: false,
    selectedMemberGrades: DEFAULT_MEMBER_GRADES,
    memberTypeAll: true,
    selectedMemberTypes: [] as MemberType[],
    searchField: 'MBR_NO' as MemberSearchField,
    searchText: '',
    statusAll: true,
    selectedStatuses: [] as MemberStatus[],
    membershipAll: true,
    selectedMemberships: [] as MembershipType[],
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
  const handleMemberGradeAllChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    setMemberGradeAll(checked);
    setSelectedMemberGrades(checked ? MEMBER_GRADE_OPTIONS.map((o) => o.value) : []);
  };

  const handleMemberGradeChange = (values: MemberGrade[]) => {
    setSelectedMemberGrades(values);
    setMemberGradeAll(values.length === MEMBER_GRADE_OPTIONS.length);
  };

  const handleMemberTypeAllChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    setMemberTypeAll(checked);
    if (checked) setSelectedMemberTypes([]);
  };

  const handleMemberTypeChange = (values: MemberType[]) => {
    setSelectedMemberTypes(values);
    setMemberTypeAll(values.length === 0 || values.length === MEMBER_TYPE_OPTIONS.length);
  };

  const handleStatusAllChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    setStatusAll(checked);
    if (checked) setSelectedStatuses([]);
  };

  const handleStatusChange = (values: MemberStatus[]) => {
    setSelectedStatuses(values);
    setStatusAll(values.length === 0 || values.length === STATUS_OPTIONS.length);
  };

  const handleMembershipAllChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    setMembershipAll(checked);
    if (checked) setSelectedMemberships([]);
  };

  const handleMembershipChange = (values: MembershipType[]) => {
    setSelectedMemberships(values);
    setMembershipAll(values.length === 0 || values.length === MEMBERSHIP_OPTIONS.length);
  };

  // ── Search & Reset ─────────────────────────────────────────────────────────
  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({
      dateRange,
      memberGradeAll,
      selectedMemberGrades,
      memberTypeAll,
      selectedMemberTypes,
      searchField,
      searchText: searchText.trim(),
      statusAll,
      selectedStatuses,
      membershipAll,
      selectedMemberships,
    });
    message.info('Filter applied');
  };

  const handleReset = () => {
    setDateRange(null);
    setMemberGradeAll(false);
    setSelectedMemberGrades(DEFAULT_MEMBER_GRADES);
    setMemberTypeAll(true);
    setSelectedMemberTypes([]);
    setSearchField('MBR_NO');
    setSearchText('');
    setStatusAll(true);
    setSelectedStatuses([]);
    setMembershipAll(true);
    setSelectedMemberships([]);
    setPage(1);

    setAppliedFilters({
      dateRange: null,
      memberGradeAll: false,
      selectedMemberGrades: DEFAULT_MEMBER_GRADES,
      memberTypeAll: true,
      selectedMemberTypes: [],
      searchField: 'MBR_NO',
      searchText: '',
      statusAll: true,
      selectedStatuses: [],
      membershipAll: true,
      selectedMemberships: [],
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

  // ── Filtered Data Memo (fallback for mock data when API is unavailable) ────
  const filteredData = useMemo(() => {
    if (memberResult) {
      return allMembers;
    }

    return allMembers.filter((item) => {
      // 1. Member Grade
      if (
        !appliedFilters.memberGradeAll &&
        appliedFilters.selectedMemberGrades.length > 0 &&
        !appliedFilters.selectedMemberGrades.includes(deriveMemberGrade(item))
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

      // 3. Status
      if (
        !appliedFilters.statusAll &&
        appliedFilters.selectedStatuses.length > 0 &&
        !appliedFilters.selectedStatuses.includes(deriveMemberStatus(item))
      ) {
        return false;
      }

      // 4. Membership
      if (!appliedFilters.membershipAll && appliedFilters.selectedMemberships.length > 0) {
        const membership = item.membership && item.membership !== '-' ? item.membership : 'None';
        if (!appliedFilters.selectedMemberships.includes(membership)) return false;
      }

      // 5. Search field + text
      if (appliedFilters.searchText) {
        const q = appliedFilters.searchText.toLowerCase();
        const fieldValueMap: Record<MemberSearchField, string> = {
          MBR_NO: item.memberCode,
          SGDN_MBR_NO: item.sgdnMemberCode || '-',
          LGN_ID: item.loginId || item.applicationId,
          MBR_NM: item.memberName,
          TELNO: item.phone,
          EML_ADDR: item.email,
          ORGNZ_NM: item.companyName,
          MST_NO: item.companyName,
        };
        const targetVal = (fieldValueMap[appliedFilters.searchField] || '').toLowerCase();
        if (!targetVal.includes(q)) return false;
      }

      // 6. Approval Period
      if (appliedFilters.dateRange && appliedFilters.dateRange[0] && appliedFilters.dateRange[1]) {
        const formatted = formatDisplayDate(item.approvalDate);
        if (formatted === '-') return false;
        const [d, m, y] = formatted.split('-');
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
    const mappedStatus: MemberStatus = newAccountStatus === 'Locked' ? 'Locked' : 'Active';
    setMemberOverrides((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], accountStatus: newAccountStatus, status: mappedStatus },
    }));
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember({ ...selectedMember, accountStatus: newAccountStatus, status: mappedStatus });
    }
  };

  const handleUpdateApprovalStatus = (
    memberId: string,
    newApprovalStatus: ApprovalStatus,
    newAssignee?: string,
    _note?: string
  ) => {
    const mappedStatus: MemberStatus | undefined =
      newApprovalStatus === 'Approved'
        ? 'Active'
        : newApprovalStatus === 'Rejected'
          ? 'Rejected'
          : undefined;

    setMemberOverrides((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        approvalStatus: newApprovalStatus,
        ...(mappedStatus ? { status: mappedStatus } : {}),
        ...(newAssignee !== undefined ? { assignee: newAssignee } : {}),
      },
    }));
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember({
        ...selectedMember,
        approvalStatus: newApprovalStatus,
        ...(mappedStatus ? { status: mappedStatus } : {}),
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
      memberGrade: 'Temporary',
      status: 'Pending Approval',
      loginId: newMemberData.applicationId,
      signUpChannel: 'Offline',
      membership: 'None',
    };
    setAddedMembers((prev) => [newEntry, ...prev]);
  };

  // ── Excel Export ───────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    try {
      const exportRows = filteredData.map((row) => ({
        'No': row.no,
        'Member Grade': deriveMemberGrade(row),
        'Status': deriveMemberStatus(row),
        'Member Code': row.memberCode,
        'SGDN Member Code': row.sgdnMemberCode || '-',
        'Login ID': row.loginId || row.applicationId,
        'Member Name': row.memberName,
        'Member Type': row.memberType === 'General' ? 'Individual' : row.memberType,
        'Company Name': row.companyName,
        'Sign-up Channel': row.signUpChannel || '-',
        'Membership': row.membership || '-',
        'Membership Expiry Date': formatDisplayDate(row.membershipExpiryDate),
        'Approval Date': formatDisplayDate(row.approvalDate),
        'Payment Deadline': formatPaymentDeadline(row.paymentDeadline).text,
        'Phone Number': row.phone,
        'Email Address': row.email,
        'Staff in Charge': row.assignee,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
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

  // ── Table Column Definitions (17 columns matching Figma 3412:17631) ───────
  const columns: TableColumnsType<MemberItem> = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.no - b.no,
    },
    {
      title: 'Member Grade',
      key: 'memberGrade',
      width: 130,
      align: 'center',
      sorter: (a, b) => deriveMemberGrade(a).localeCompare(deriveMemberGrade(b)),
      render: (_: unknown, record: MemberItem) => {
        const grade = deriveMemberGrade(record);
        let gradeClass = styles.gradeTemporary;
        if (grade === 'General') gradeClass = styles.gradeGeneral;
        else if (grade === 'Full') gradeClass = styles.gradeFull;
        else if (grade === 'Deleted') gradeClass = styles.gradeDeleted;

        return <span className={`${styles.gradeBadge} ${gradeClass}`}>{grade}</span>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      align: 'center',
      sorter: (a, b) => deriveMemberStatus(a).localeCompare(deriveMemberStatus(b)),
      render: (_: unknown, record: MemberItem) => {
        const status = deriveMemberStatus(record);
        let statusClass = styles.statusActive;
        if (status === 'Pending Approval' || status === 'Supplement Requested') {
          statusClass = styles.statusPendingApproval;
        } else if (status === 'Rejected') {
          statusClass = styles.statusRejected;
        } else if (status === 'Locked' || status === 'Deleted' || status === 'Cancelled') {
          statusClass = styles.statusLocked;
        }

        return (
          <button
            type="button"
            className={`${styles.statusBadge} ${statusClass}`}
            onClick={(e) => handleOpenApproval(record, e)}
            title="Click to update status"
          >
            {status}
          </button>
        );
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
      title: 'SGDN Member Code',
      dataIndex: 'sgdnMemberCode',
      key: 'sgdnMemberCode',
      width: 180,
      sorter: (a, b) => (a.sgdnMemberCode || '-').localeCompare(b.sgdnMemberCode || '-'),
      render: (val?: string) => <span>{val || '-'}</span>,
    },
    {
      title: 'Login ID',
      key: 'loginId',
      width: 140,
      sorter: (a, b) => (a.loginId || a.applicationId).localeCompare(b.loginId || b.applicationId),
      render: (_: unknown, record: MemberItem) => (
        <span>{record.loginId || record.applicationId || '-'}</span>
      ),
    },
    {
      title: 'Member Name',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 150,
      sorter: (a, b) => a.memberName.localeCompare(b.memberName),
    },
    {
      title: 'Member Type',
      dataIndex: 'memberType',
      key: 'memberType',
      width: 140,
      sorter: (a, b) => a.memberType.localeCompare(b.memberType),
      render: (val: MemberType) => <span>{val === 'General' ? 'Individual' : val}</span>,
    },
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 170,
      sorter: (a, b) => a.companyName.localeCompare(b.companyName),
      render: (val: string) => <span>{val || '-'}</span>,
    },
    {
      title: 'Sign-up Channel',
      dataIndex: 'signUpChannel',
      key: 'signUpChannel',
      width: 150,
      sorter: (a, b) => (a.signUpChannel || '-').localeCompare(b.signUpChannel || '-'),
      render: (val?: string) => <span>{val || '-'}</span>,
    },
    {
      title: 'Membership',
      dataIndex: 'membership',
      key: 'membership',
      width: 130,
      sorter: (a, b) => (a.membership || '-').localeCompare(b.membership || '-'),
      render: (val?: string) => <span>{val || '-'}</span>,
    },
    {
      title: 'Membership Expiry Date',
      dataIndex: 'membershipExpiryDate',
      key: 'membershipExpiryDate',
      width: 200,
      align: 'center',
      sorter: (a, b) => (a.membershipExpiryDate || '-').localeCompare(b.membershipExpiryDate || '-'),
      render: (val?: string) => <span>{formatDisplayDate(val)}</span>,
    },
    {
      title: 'Approval Date',
      dataIndex: 'approvalDate',
      key: 'approvalDate',
      width: 140,
      align: 'center',
      sorter: (a, b) => a.approvalDate.localeCompare(b.approvalDate),
      render: (val: string) => <span>{formatDisplayDate(val)}</span>,
    },
    {
      title: 'Payment Deadline',
      dataIndex: 'paymentDeadline',
      key: 'paymentDeadline',
      width: 170,
      align: 'center',
      sorter: (a, b) => (a.paymentDeadline || '-').localeCompare(b.paymentDeadline || '-'),
      render: (val?: string) => {
        const { text, isDanger } = formatPaymentDeadline(val);
        return <span className={isDanger ? styles.paymentDeadlineDanger : undefined}>{text}</span>;
      },
    },
    {
      title: 'Phone Number',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      sorter: (a, b) => a.phone.localeCompare(b.phone),
    },
    {
      title: 'Email Address',
      dataIndex: 'email',
      key: 'email',
      width: 160,
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'Staff in Charge',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 150,
      sorter: (a, b) => a.assignee.localeCompare(b.assignee),
      render: (val: string) => <span>{val || '-'}</span>,
    },
  ];

  // ── Row Selection ──────────────────────────────────────────────────────────
  const rowSelection: TableProps<MemberItem>['rowSelection'] = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const totalCount = memberResult ? memberResult.total : filteredData.length;

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
        <div className={styles.filterTable}>
          {/* Row 1: Approval Period | Member Grade | Member Type */}
          <div className={styles.filterRow}>
            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Approval Period</span>
              <div className={styles.filterControl}>
                <RangePicker
                  format="DD-MM-YYYY"
                  placeholder={['DD-MM-YYYY', 'DD-MM-YYYY']}
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Member Grade</span>
              <div className={styles.filterControl}>
                <div className={styles.filterCheckboxGroup}>
                  <Checkbox checked={memberGradeAll} onChange={handleMemberGradeAllChange}>
                    All
                  </Checkbox>
                  <Checkbox.Group
                    options={MEMBER_GRADE_OPTIONS}
                    value={selectedMemberGrades}
                    onChange={handleMemberGradeChange}
                  />
                </div>
              </div>
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Member Type</span>
              <div className={styles.filterControl}>
                <div className={styles.filterCheckboxGroup}>
                  <Checkbox checked={memberTypeAll} onChange={handleMemberTypeAllChange}>
                    All
                  </Checkbox>
                  <Checkbox.Group
                    options={MEMBER_TYPE_OPTIONS}
                    value={selectedMemberTypes}
                    onChange={handleMemberTypeChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Search | Status | Membership */}
          <div className={styles.filterRow}>
            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Search</span>
              <div className={styles.filterControl}>
                <div className={styles.filterSearchGroup}>
                  <Select
                    className={styles.filterSearchSelect}
                    value={searchField}
                    options={SEARCH_FIELD_OPTIONS}
                    onChange={(val) => setSearchField(val)}
                  />
                  <Input
                    placeholder="Enter keyword"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onPressEnter={handleSearch}
                    allowClear
                  />
                </div>
              </div>
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Status</span>
              <div className={styles.filterControl}>
                <div className={styles.filterCheckboxGroup}>
                  <Checkbox checked={statusAll} onChange={handleStatusAllChange}>
                    All
                  </Checkbox>
                  <Checkbox.Group
                    options={STATUS_OPTIONS}
                    value={selectedStatuses}
                    onChange={handleStatusChange}
                  />
                </div>
              </div>
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Membership</span>
              <div className={styles.filterControl}>
                <div className={styles.filterCheckboxGroup}>
                  <Checkbox checked={membershipAll} onChange={handleMembershipAllChange}>
                    All
                  </Checkbox>
                  <Checkbox.Group
                    options={MEMBERSHIP_OPTIONS}
                    value={selectedMemberships}
                    onChange={handleMembershipChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Action Buttons */}
        <div className={styles.filterActionRow}>
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
          <span className={styles.resultsDivider} />
          <span className={styles.resultsCount}>
            Total <span className={styles.resultsCountNum}>{totalCount}</span>
          </span>
        </div>

        <div className={styles.resultsActions}>
          <Button className={styles.btnExcel} onClick={handleExportExcel}>
            <span className={styles.excelIconWrapper}>X</span>
            <span>Excel Download</span>
          </Button>
          <span className={styles.toolbarActionDivider} />
          <Button
            type="primary"
            className={styles.btnNew}
            onClick={() => setNewMemberModalVisible(true)}
          >
            New
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
            total: totalCount,
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
