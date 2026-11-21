import { useState } from 'react';
import { Alert } from 'antd';
import type { TableColumnsType } from 'antd';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { Employee, EmployeeSearch } from '@/api/system/employee-api';
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
} from '../_shared/SysListUi';
import { SYS_PAGE_SIZE } from '../_shared/sys-constants';
import { usePagedList } from '../_shared/use-paged-list';
import UserModal from './UserModal';
import { ACCOUNT_STATUS_LABEL, EMP_STATUS_LABEL } from './user-constants';
import { useEmployee, useEmployees, useEmployeesExcel } from './use-employees';

// User Management - List (VPA09020201), menu A06020200.

const INITIAL_FILTER: EmployeeSearch = { empNo: '', empNm: '' };

/** undefined = closed, null = register, string = edit that employee. */
type ModalTarget = string | null | undefined;

const trimSearch = (search: EmployeeSearch): EmployeeSearch => ({
  empNo: search.empNo?.trim(),
  empNm: search.empNm?.trim(),
});

export default function UserManagement() {
  const { canWrite } = useMenuPermission();
  const list = usePagedList<EmployeeSearch>(INITIAL_FILTER);
  const search = trimSearch(list.applied);
  const { data, isFetching } = useEmployees(search, list.pageQuery);
  const excel = useEmployeesExcel();

  const [target, setTarget] = useState<ModalTarget>(undefined);
  const editEmpNo = typeof target === 'string' ? target : null;
  const detail = useEmployee(editEmpNo);

  const columns: TableColumnsType<Employee> = [
    {
      title: 'Status',
      dataIndex: 'empSttsCd',
      width: 110,
      align: 'center',
      render: (code: Employee['empSttsCd']) => EMP_STATUS_LABEL[code] ?? code,
    },
    {
      title: 'Account Status',
      dataIndex: 'acntSttsCd',
      width: 130,
      align: 'center',
      render: (code: Employee['acntSttsCd']) =>
        code ? (
          <StatusBadge tone={code === 'LOCKED' ? 'gray' : 'green'}>{ACCOUNT_STATUS_LABEL[code] ?? code}</StatusBadge>
        ) : (
          '-'
        ),
    },
    { title: 'Employee No.', dataIndex: 'empNo', width: 130, align: 'center' },
    { title: 'Name', dataIndex: 'empNm', ellipsis: true },
    { title: 'Email', dataIndex: 'empEmlAddr', ellipsis: true, render: (v?: string) => v || '-' },
    { title: 'Office Phone', dataIndex: 'empTelno', width: 130, align: 'center', render: (v?: string) => v || '-' },
    {
      title: 'Mobile Number',
      dataIndex: 'empMoblTelno',
      width: 150,
      align: 'center',
      render: (v?: string) => v || '-',
    },
    {
      title: 'P/W Fail',
      dataIndex: 'pswdFailNmtm',
      width: 90,
      align: 'center',
      render: (v?: number) => v ?? 0,
    },
    {
      title: 'Registered Date',
      dataIndex: 'createdAt',
      width: 150,
      align: 'center',
      render: (v?: string) => <DateTimeText value={v} />,
    },
  ];

  const total = data?.totalElements ?? 0;
  const modalOpen = target === null || (editEmpNo !== null && detail.data !== undefined);

  return (
    <SysPage>
      <SysTitleBar title="User Management" breadcrumb={['System Operation Management', 'Admin Management', 'User Management']} />

      <SysFilterPanel columns={2}>
        <SysFilterItem label="Employee No.">
          <TextInput
            value={list.draft.empNo}
            maxLength={10}
            allowClear
            onChange={(e) => list.setDraft({ empNo: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label="Staff Name">
          <TextInput
            value={list.draft.empNm}
            maxLength={100}
            allowClear
            onChange={(e) => list.setDraft({ empNm: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />

      {detail.error && (
        <Alert type="error" showIcon closable title="The user could not be loaded." description={detail.error.message} />
      )}

      <SysSectionHeader
        total={total}
        actions={<SysExcelButton loading={excel.isPending} onClick={() => excel.mutate(search)} />}
        primaryActions={
          canWrite && (
            <SysButton look="navy" onClick={() => setTarget(null)}>
              New
            </SysButton>
          )
        }
      />
      <SysTable<Employee>
        rowKey="empNo"
        columns={columns}
        dataSource={data?.content ?? []}
        loading={isFetching || detail.isFetching}
        onRowClick={(row) => (row.empNo === editEmpNo ? void detail.refetch() : setTarget(row.empNo))}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />

      {modalOpen && (
        <UserModal
          key={editEmpNo ?? '__new'}
          detail={editEmpNo !== null ? detail.data : undefined}
          canWrite={canWrite}
          onClose={() => setTarget(undefined)}
        />
      )}
    </SysPage>
  );
}
