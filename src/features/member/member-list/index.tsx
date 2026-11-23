import { useState, useMemo } from 'react';
import ActionButton from '@/components/common/actions/ActionButton';
import AppTooltip from '@/components/common/tooltip/AppTooltip';
import DataTable from '@/components/common/table/DataTable';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import AppDatePicker from '@/components/inputs/AppDatePicker';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import type { TableProps, TableColumnsType } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import {
  SearchOutlined,
  ReloadOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

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
import { useMembers, useExportMembers } from './use-members';
import { SysPagination } from '@/features/system/_shared/SystemUi';
import MemberDetailModal from './MemberDetailModal';
import MemberApprovalModal from './MemberApprovalModal';
import NewMemberModal from './NewMemberModal';
import styles from './member-list.module.scss';

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

const DEFAULT_MEMBER_TYPES: MemberType[] = MEMBER_TYPE_OPTIONS.map((o) => o.value);
const DEFAULT_STATUSES: MemberStatus[] = STATUS_OPTIONS.map((o) => o.value);
const DEFAULT_MEMBERSHIPS: MembershipType[] = MEMBERSHIP_OPTIONS.map((o) => o.value);

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

/**
 * Payment deadline (decided 2026-11-23): sign-up / re-application + 15 days. The server sends it only for
 * applications in Pending Approval; general members have no deadline.
 */
function formatPaymentDeadline(val?: string): { text: string; isDanger: boolean } {
  const formatted = formatDisplayDate(val);
  if (formatted === '-') return { text: '-', isDanger: false };

  const [d, m, y] = formatted.split('-');
  const target = dayjs(`${y}-${m}-${d}`);
  if (!target.isValid()) return { text: formatted, isDanger: false };

  const diffDays = target.startOf('day').diff(dayjs().startOf('day'), 'day');
  const dDayLabel = diffDays >= 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
  return { text: `${formatted} (${dDayLabel})`, isDanger: diffDays <= 3 };
}

export default function MemberList() {
  const { toast } = useNotify();
  const { canWrite } = useMenuPermission();
  // ── Pagination & Sort State ────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC' | undefined>(undefined);
  const [searchNonce, setSearchNonce] = useState(0);

  // ── Local State & Overrides ────────────────────────────────────────────────
  const [memberOverrides, setMemberOverrides] = useState<Record<string, Partial<MemberItem>>>({});

  // ── Modals State ───────────────────────────────────────────────────────────
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);

  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalMember, setApprovalMember] = useState<MemberItem | null>(null);

  const [newMemberModalVisible, setNewMemberModalVisible] = useState(false);
  const [memberFormMode, setMemberFormMode] = useState<'register' | 'edit'>('register');
  const [editMemberTarget, setEditMemberTarget] = useState<MemberItem | null>(null);

  // ── Filter State (matches Figma 3412:17631) ────────────────────────────────
  // Approval Period
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Member Grade (default: Temporary, General, Full checked; Deleted unchecked)
  const [memberGradeAll, setMemberGradeAll] = useState(false);
  const [selectedMemberGrades, setSelectedMemberGrades] = useState<MemberGrade[]>(DEFAULT_MEMBER_GRADES);

  // Member Type (default: All checked)
  const [memberTypeAll, setMemberTypeAll] = useState(true);
  const [selectedMemberTypes, setSelectedMemberTypes] = useState<MemberType[]>(DEFAULT_MEMBER_TYPES);

  // Search Select + Input
  const [searchField, setSearchField] = useState<MemberSearchField>('MBR_NO');
  const [searchText, setSearchText] = useState('');

  // Status (default: All checked)
  const [statusAll, setStatusAll] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<MemberStatus[]>(DEFAULT_STATUSES);

  // Membership (default: All checked)
  const [membershipAll, setMembershipAll] = useState(true);
  const [selectedMemberships, setSelectedMemberships] = useState<MembershipType[]>(DEFAULT_MEMBERSHIPS);

  // Applied Filter Snapshot (triggers actual filter on Search button click)
  const [appliedFilters, setAppliedFilters] = useState({
    dateRange: null as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    memberGradeAll: false,
    selectedMemberGrades: DEFAULT_MEMBER_GRADES,
    memberTypeAll: true,
    selectedMemberTypes: DEFAULT_MEMBER_TYPES,
    searchField: 'MBR_NO' as MemberSearchField,
    searchText: '',
    statusAll: true,
    selectedStatuses: DEFAULT_STATUSES,
    membershipAll: true,
    selectedMemberships: DEFAULT_MEMBERSHIPS,
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
    sortBy,
    sortDirection,
    searchNonce,
    ...appliedFilters,
  });

  const { mutate: exportMembers, isPending: isExporting } = useExportMembers();

  // ── Filter Checkbox Handlers (at least 1 sub-item must stay selected) ──────
  const makeCheckboxHandlers = <T extends string>(
    allValues: T[],
    setAll: (v: boolean) => void,
    setSelected: (v: T[]) => void,
  ) => ({
    onAllChange: (e: CheckboxChangeEvent) => {
      if (!e.target.checked) return;
      setAll(true);
      setSelected(allValues);
    },
    onGroupChange: (values: T[]) => {
      if (values.length === 0) return;
      setSelected(values);
      setAll(values.length === allValues.length);
    },
  });

  const memberGradeHandlers = makeCheckboxHandlers(
    MEMBER_GRADE_OPTIONS.map((o) => o.value),
    setMemberGradeAll,
    setSelectedMemberGrades,
  );
  const memberTypeHandlers = makeCheckboxHandlers(
    DEFAULT_MEMBER_TYPES,
    setMemberTypeAll,
    setSelectedMemberTypes,
  );
  const statusHandlers = makeCheckboxHandlers(
    DEFAULT_STATUSES,
    setStatusAll,
    setSelectedStatuses,
  );
  const membershipHandlers = makeCheckboxHandlers(
    DEFAULT_MEMBERSHIPS,
    setMembershipAll,
    setSelectedMemberships,
  );

  // ── Search & Reset ─────────────────────────────────────────────────────────
  const handleSearch = () => {
    if (
      dateRange?.[0] &&
      dateRange?.[1] &&
      dateRange[0].startOf('day').isAfter(dateRange[1].startOf('day'))
    ) {
      toast.error('Start date cannot be later than end date. (E07)');
      return;
    }

    setPage(1);
    setSearchNonce((n) => n + 1);
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
  };

  const handleReset = () => {
    setDateRange(null);
    setMemberGradeAll(false);
    setSelectedMemberGrades(DEFAULT_MEMBER_GRADES);
    setMemberTypeAll(true);
    setSelectedMemberTypes(DEFAULT_MEMBER_TYPES);
    setSearchField('MBR_NO');
    setSearchText('');
    setStatusAll(true);
    setSelectedStatuses(DEFAULT_STATUSES);
    setMembershipAll(true);
    setSelectedMemberships(DEFAULT_MEMBERSHIPS);
    setSortBy(undefined);
    setSortDirection(undefined);
    setPage(1);
    setSearchNonce((n) => n + 1);

    setAppliedFilters({
      dateRange: null,
      memberGradeAll: false,
      selectedMemberGrades: DEFAULT_MEMBER_GRADES,
      memberTypeAll: true,
      selectedMemberTypes: DEFAULT_MEMBER_TYPES,
      searchField: 'MBR_NO',
      searchText: '',
      statusAll: true,
      selectedStatuses: DEFAULT_STATUSES,
      membershipAll: true,
      selectedMemberships: DEFAULT_MEMBERSHIPS,
    });
  };

  // ── Combined Members Memo ─────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return memberItems.map((item) => {
      const override = memberOverrides[item.id];
      return override ? { ...item, ...override } : item;
    });
  }, [memberItems, memberOverrides]);

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

  // ── Excel Export ───────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    exportMembers(
      { ...appliedFilters, sortBy, sortDirection },
      {
        onSuccess: (fileName) => {
          toast.success(`Exported ${fileName}`);
        },
        onError: () => {
          toast.error('Failed to export Excel file');
        },
      },
    );
  };

  // ── Table Column Definitions ───────────────────────────────────────────────
  const showDeletedColumns = appliedFilters.selectedMemberGrades.includes('Deleted');

  const getSortOrder = (field: string): SortOrder =>
    sortBy === field ? (sortDirection === 'ASC' ? 'ascend' : 'descend') : null;

  const columns: TableColumnsType<MemberItem> = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 60,
      align: 'center',
    },
    {
      title: 'Member Grade',
      key: 'mbrGrdCd',
      width: 130,
      align: 'center',
      sorter: true,
      sortOrder: getSortOrder('mbrGrdCd'),
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
      key: 'sttsCd',
      width: 150,
      align: 'center',
      sorter: true,
      sortOrder: getSortOrder('sttsCd'),
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
      key: 'mbrNo',
      width: 155,
      sorter: true,
      sortOrder: getSortOrder('mbrNo'),
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
      key: 'sgdnMbrNo',
      width: 180,
      sorter: true,
      sortOrder: getSortOrder('sgdnMbrNo'),
      render: (val?: string) => <span>{val || '-'}</span>,
    },
    {
      title: 'Login ID',
      key: 'lgnId',
      width: 140,
      sorter: true,
      sortOrder: getSortOrder('lgnId'),
      render: (_: unknown, record: MemberItem) => (
        <span>{record.loginId || record.applicationId || '-'}</span>
      ),
    },
    {
      title: 'Member Name',
      dataIndex: 'memberName',
      key: 'mbrNm',
      width: 150,
      sorter: true,
      sortOrder: getSortOrder('mbrNm'),
    },
    {
      title: 'Member Type',
      dataIndex: 'memberType',
      key: 'mbrTypeCd',
      width: 140,
      sorter: true,
      sortOrder: getSortOrder('mbrTypeCd'),
      render: (val: MemberType) => <span>{val === 'General' ? 'Individual' : val}</span>,
    },
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'orgnzNm',
      width: 170,
      sorter: true,
      sortOrder: getSortOrder('orgnzNm'),
      render: (val: string, record: MemberItem) => (
        <span>{record.memberType === 'Organization' ? val || '-' : '-'}</span>
      ),
    },
    {
      title: 'Sign-up Channel',
      dataIndex: 'signUpChannel',
      key: 'mbrJoinChnlCd',
      width: 150,
      sorter: true,
      sortOrder: getSortOrder('mbrJoinChnlCd'),
      render: (val?: string) => <span>{val || '-'}</span>,
    },
    ...(showDeletedColumns
      ? [
          {
            title: 'Deleted Date',
            dataIndex: 'deletedDate',
            key: 'delDt',
            width: 140,
            align: 'center' as const,
            sorter: true,
            sortOrder: getSortOrder('delDt'),
            render: (val?: string) => <span>{formatDisplayDate(val)}</span>,
          },
          {
            title: 'Retention End Date',
            dataIndex: 'retentionEndDate',
            key: 'rtnEndDt',
            width: 160,
            align: 'center' as const,
            sorter: true,
            sortOrder: getSortOrder('rtnEndDt'),
            render: (val?: string) => <span>{formatDisplayDate(val)}</span>,
          },
        ]
      : [
          {
            title: 'Membership',
            dataIndex: 'membership',
            key: 'mbrshpPayCd',
            width: 130,
            sorter: true,
            sortOrder: getSortOrder('mbrshpPayCd'),
            render: (val?: string) => <span>{val && val !== 'None' ? val : '-'}</span>,
          },
          {
            title: 'Membership Expiry Date',
            dataIndex: 'membershipExpiryDate',
            key: 'mbrshpExprDt',
            width: 200,
            align: 'center' as const,
            sorter: true,
            sortOrder: getSortOrder('mbrshpExprDt'),
            render: (val?: string) => <span>{formatDisplayDate(val)}</span>,
          },
          {
            title: 'Approval Date',
            dataIndex: 'approvalDate',
            key: 'aprvDt',
            width: 140,
            align: 'center' as const,
            sorter: true,
            sortOrder: getSortOrder('aprvDt'),
            render: (val: string, record: MemberItem) => (
              <span>{deriveMemberGrade(record) === 'Temporary' ? '-' : formatDisplayDate(val)}</span>
            ),
          },
          {
            title: (
              <AppTooltip description="Deadline of an application in Pending Approval: sign-up or re-application date + 15 days. General members have none.">
                <span>Payment Deadline</span>
              </AppTooltip>
            ),
            dataIndex: 'paymentDeadline',
            key: 'payDdlnDt',
            width: 170,
            align: 'center' as const,
            sorter: true,
            sortOrder: getSortOrder('payDdlnDt'),
            render: (val?: string) => {
              const { text, isDanger } = formatPaymentDeadline(val);
              return <span className={isDanger ? styles.paymentDeadlineDanger : undefined}>{text}</span>;
            },
          },
        ]),
    {
      title: 'Phone Number',
      dataIndex: 'phone',
      key: 'telno',
      width: 150,
      sorter: true,
      sortOrder: getSortOrder('telno'),
    },
    {
      title: 'Email Address',
      dataIndex: 'email',
      key: 'emlAddr',
      width: 160,
      sorter: true,
      sortOrder: getSortOrder('emlAddr'),
    },
    {
      title: 'Staff in Charge',
      dataIndex: 'assignee',
      key: 'assigneeNm',
      width: 150,
      sorter: true,
      sortOrder: getSortOrder('assigneeNm'),
      render: (val: string) => <span>{val || '-'}</span>,
    },
  ];

  const handleTableChange: TableProps<MemberItem>['onChange'] = (_pagination, _filters, sorter) => {
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    if (singleSorter?.columnKey && singleSorter.order) {
      setSortBy(String(singleSorter.columnKey));
      setSortDirection(singleSorter.order === 'ascend' ? 'ASC' : 'DESC');
    } else {
      setSortBy(undefined);
      setSortDirection(undefined);
    }
    setPage(1);
  };

  const totalCount = memberResult ? memberResult.total : filteredData.length;

  return (
    <div className={styles.memberPageContainer}>
      {/* ── Page Header / Breadcrumb ────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Member Management</h1>
        <div className={styles.breadcrumb}>
          <HomeOutlined className="text-[13px]" />
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
                <div className={styles.dateRangeGroup}>
                  <AppDatePicker
                    className={styles.dateRangeInput}
                    format="DD-MM-YYYY"
                    placeholder="DD-MM-YYYY"
                    value={dateRange?.[0] ?? null}
                    onChange={(date) => setDateRange([date, dateRange?.[1] ?? null])}
                  />
                  <span className={styles.dateRangeSeparator}>~</span>
                  <AppDatePicker
                    className={styles.dateRangeInput}
                    format="DD-MM-YYYY"
                    placeholder="DD-MM-YYYY"
                    value={dateRange?.[1] ?? null}
                    onChange={(date) => setDateRange([dateRange?.[0] ?? null, date])}
                  />
                </div>
              </div>
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Member Grade</span>
              <div className={styles.filterControl}>
                <div className={styles.filterCheckboxGroup}>
                  <AppCheckbox checked={memberGradeAll} onChange={memberGradeHandlers.onAllChange}>
                    All
                  </AppCheckbox>
                  <AppCheckbox.Group
                    options={MEMBER_GRADE_OPTIONS}
                    value={selectedMemberGrades}
                    onChange={memberGradeHandlers.onGroupChange}
                  />
                </div>
              </div>
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Member Type</span>
              <div className={styles.filterControl}>
                <div className={styles.filterCheckboxGroup}>
                  <AppCheckbox checked={memberTypeAll} onChange={memberTypeHandlers.onAllChange}>
                    All
                  </AppCheckbox>
                  <AppCheckbox.Group
                    options={MEMBER_TYPE_OPTIONS}
                    value={selectedMemberTypes}
                    onChange={memberTypeHandlers.onGroupChange}
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
                  <AppSelect
                    className={styles.filterSearchSelect}
                    value={searchField}
                    options={SEARCH_FIELD_OPTIONS}
                    onChange={(val) => setSearchField(val)}
                  />
                  <TextInput
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
                  <AppCheckbox checked={statusAll} onChange={statusHandlers.onAllChange}>
                    All
                  </AppCheckbox>
                  <AppCheckbox.Group
                    options={STATUS_OPTIONS}
                    value={selectedStatuses}
                    onChange={statusHandlers.onGroupChange}
                  />
                </div>
              </div>
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Membership</span>
              <div className={styles.filterControl}>
                <div className={styles.filterCheckboxGroup}>
                  <AppCheckbox checked={membershipAll} onChange={membershipHandlers.onAllChange}>
                    All
                  </AppCheckbox>
                  <AppCheckbox.Group
                    options={MEMBERSHIP_OPTIONS}
                    value={selectedMemberships}
                    onChange={membershipHandlers.onGroupChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Action Buttons */}
        <div className={styles.filterActionRow}>
          <div className={styles.filterActionButtons}>
            <ActionButton action="reset" intent="primary" appearance="outlined" className={styles.btnReset} icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </ActionButton>
            <ActionButton
              action="search"
              intent="primary"
              appearance="filled"
              className={styles.btnSearch}
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              Search
            </ActionButton>
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
          <ActionButton action="excelDownload" className={styles.btnExcel} loading={isExporting} onClick={handleExportExcel}>
            Excel Download
          </ActionButton>
          <span className={styles.toolbarActionDivider} />
          <ActionButton
            intent="primary"
            appearance="filled"
            className={styles.btnNew}
            onClick={() => {
              setMemberFormMode('register');
              setEditMemberTarget(null);
              setNewMemberModalVisible(true);
            }}
          >
            New
          </ActionButton>
        </div>
      </div>

      {/* ── Main Data Table ─────────────────────────────────────────────────── */}
      <div className={styles.tableCard}>
        <DataTable<MemberItem>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          loading={isLoading || isFetching}
          sortDirections={['ascend', 'descend']}
          onChange={handleTableChange}
          locale={{ emptyText: 'No members found.' }}
          scroll={{ x: 'max-content', y: 560 }}
        />
      </div>
      <SysPagination
        page={page}
        pageSize={pageSize}
        total={totalCount}
        onChange={setPage}
        hideOnSinglePage
      />

      {/* ── Dialog Modals ───────────────────────────────────────────────────── */}
      <MemberDetailModal
        visible={detailModalVisible}
        member={selectedMember}
        onClose={() => setDetailModalVisible(false)}
        onStatusChange={handleUpdateAccountStatus}
        onApprovalChange={(id, status) => handleUpdateApprovalStatus(id, status)}
        onEdit={(target) => {
          setDetailModalVisible(false);
          setMemberFormMode('edit');
          setEditMemberTarget(target);
          setNewMemberModalVisible(true);
        }}
      />

      <MemberApprovalModal
        mbrNo={approvalModalVisible && approvalMember ? approvalMember.memberCode : null}
        memberName={approvalMember?.memberName}
        canWrite={canWrite}
        onClose={() => setApprovalModalVisible(false)}
      />

      <NewMemberModal
        visible={newMemberModalVisible}
        mode={memberFormMode}
        member={editMemberTarget}
        onClose={() => setNewMemberModalVisible(false)}
        onSuccess={() => setSearchNonce((n) => n + 1)}
      />
    </div>
  );
}
