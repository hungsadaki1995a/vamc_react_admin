import { useState } from 'react';
import { Input, Table, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useScreenLabel } from '@/hooks/use-screen-label';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { deleteEmployee, getEmployees } from '@/api/system/employee-api';
import type { Employee, EmployeeSearch, EmpStatus } from '@/api/system/employee-api';
import type { PageResponse } from '@/api/common/api-utils';
import { DateTimeCell, SysPageHeader, SysPagination } from '../_shared/SystemUi';
import { errorMessage } from '../_shared/system-utils';
import styles from '../_shared/system-page.module.css';
import UserModal from './UserModal';
import { EMP_STATUS_FALLBACK, LOCK_FAIL_COUNT } from './user-constants';

// User Management - List (VPA004501), menu A06020200.

const PAGE_SIZE = 15;
const EMPTY_FILTER = { empNo: '', empNm: '' };

export default function SYS030102SC() {
  const { toast, dialog } = useNotify();
  const { tvt, tvb, tvh, tsg, tsm } = useScreenLabel();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [applied, setApplied] = useState<EmployeeSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  /** undefined = closed, null = register, string = view/edit that employee. */
  const [modalEmpNo, setModalEmpNo] = useState<string | null | undefined>(undefined);

  const { data, isFetching } = useApiQuery<PageResponse<Employee>>(
    ['sys', 'employees', applied, page],
    () => getEmployees(applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData },
  );
  const employees = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const statusName = (code: EmpStatus) => tvt(`status${code}`, EMP_STATUS_FALLBACK[code] ?? code);

  const refresh = () => {
    setSelectedKeys([]);
    void queryClient.invalidateQueries({ queryKey: ['sys', 'employees'] });
  };

  const handleSearch = () => {
    setApplied({
      empNo: filter.empNo.trim() || undefined,
      empNm: filter.empNm.trim() || undefined,
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
      toast.warning(tsm('selectToDelete', 'Select at least one user to delete.'));
      return;
    }
    dialog.warning({
      okCancel: true,
      content: tsm('confirmDelete', 'Delete the selected user(s)? This cannot be undone.'),
      onOk: async () => {
        // The API deletes one employee per call; report the ones that were rejected.
        const failed: string[] = [];
        for (const empNo of selectedKeys) {
          try {
            await deleteEmployee(empNo);
          } catch (error) {
            failed.push(`${empNo}: ${errorMessage(error)}`);
          }
        }
        if (failed.length === 0) toast.success(tsm('deleted', 'Deleted.'));
        else toast.error(failed.join('\n'));
        refresh();
      },
    });
  };

  const columns: TableColumnsType<Employee> = [
    {
      title: tsg('status', 'Status'),
      dataIndex: 'empSttsCd',
      width: 90,
      align: 'center',
      render: (value: EmpStatus) => statusName(value),
    },
    {
      title: tsg('empNo', 'Employee Number'),
      dataIndex: 'empNo',
      width: 120,
      align: 'center',
      render: (value: string) => (
        <a className={styles.cellLink} onClick={() => setModalEmpNo(value)}>
          {value}
        </a>
      ),
    },
    { title: tsg('empNm', 'Name'), dataIndex: 'empNm', width: 180, align: 'center' },
    {
      title: tsg('email', 'Email'),
      dataIndex: 'empEmlAddr',
      width: 200,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: tsg('telno', 'Phone Number'),
      dataIndex: 'empTelno',
      width: 130,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: tsg('mobile', 'Mobile'),
      dataIndex: 'empMoblTelno',
      width: 130,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: tsg('position', 'Position'),
      dataIndex: 'jbpsNm',
      width: 130,
      align: 'center',
      render: (value?: string) => value || '-',
    },
    {
      title: tsg('pwFail', 'P/W Fail'),
      dataIndex: 'pswdFailNmtm',
      width: 80,
      align: 'center',
      render: (value: number | undefined, row) =>
        row.empSttsCd === 'L' || (value ?? 0) >= LOCK_FAIL_COUNT ? (
          <span className={styles.textDanger}>{tvt('lock', 'Lock')}</span>
        ) : (
          (value ?? 0)
        ),
    },
    {
      title: tsg('updatedAt', 'Modification Date'),
      dataIndex: 'updatedAt',
      width: 110,
      align: 'center',
      render: (value?: string) => <DateTimeCell value={value} />,
    },
  ];

  const title = tvh('page', 'User Management');

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={[
          tvt('bcSystem', 'System Management'),
          tvt('bcAdmin', 'Admin Management'),
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

      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('empNo', 'Employee Number')}</span>
            <Input
              className={styles.filterInput}
              placeholder={tvt('phEmpNo', 'Enter the employee number')}
              value={filter.empNo}
              maxLength={10}
              onChange={(e) => setFilter((f) => ({ ...f, empNo: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('empNm', 'Employee Name')}</span>
            <Input
              className={styles.filterInput}
              placeholder={tvt('phEmpNm', 'Enter the employee name')}
              value={filter.empNm}
              maxLength={100}
              onChange={(e) => setFilter((f) => ({ ...f, empNm: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        {/* GET /api/v1/employees/excel does not exist in the backend yet. */}
        <Tooltip title={tvt('excelPending', 'Excel export is not provided by the API yet.')}>
          <button type="button" className={`${styles.btn} ${styles.btnSmall}`} disabled>
            {tvb('excel', 'Excel Download')}
          </button>
        </Tooltip>
      </div>

      <div className={styles.tableWrapper}>
        <Table<Employee>
          rowKey="empNo"
          columns={columns}
          dataSource={employees}
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
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={() => setModalEmpNo(null)}>
          {tvb('addNew', 'Add New')}
        </button>
      </div>

      {modalEmpNo !== undefined && (
        <UserModal
          empNo={modalEmpNo}
          canWrite={canWrite}
          onClose={() => setModalEmpNo(undefined)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
