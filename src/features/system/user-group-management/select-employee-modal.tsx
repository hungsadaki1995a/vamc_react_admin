import { useState } from 'react';
import { Input, Modal, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useScreenLabel } from '@/hooks/use-screen-label';
import type { EmployeeLookup, EmployeeLookupSearch } from '@/api/system/employee-api';
import { SysPagination } from '../_shared/system-ui';
import styles from '../_shared/system-page.module.scss';
import { useEmployeeLookup } from './use-role-groups';

// User Group Management - Add Employee / "Select Person in Charge" popup (VPA0046P01).
// Lists active employees not yet assigned to the role; several can be picked at once.

interface SelectEmployeeModalProps {
  roleGroupId: string;
  roleId: string;
  /** Employees already picked in this session (not saved yet) — shown as disabled. */
  pendingEmpNos: string[];
  onClose: () => void;
  onConfirm: (employees: EmployeeLookup[]) => void;
}

const PAGE_SIZE = 10;
const EMPTY_FILTER = { empNo: '', empNm: '' };

export default function SelectEmployeeModal({
  roleGroupId,
  roleId,
  pendingEmpNos,
  onClose,
  onConfirm,
}: SelectEmployeeModalProps) {
  const { tvt, tvb, tvh, tsg } = useScreenLabel();
  const exclusion = { excludeRoleGroupId: roleGroupId, excludeRoleId: roleId };

  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [applied, setApplied] = useState<EmployeeLookupSearch>(exclusion);
  const [page, setPage] = useState(1);
  // Selection survives paging, so the picked rows are kept, not just their keys.
  const [picked, setPicked] = useState<EmployeeLookup[]>([]);

  const { data, isFetching } = useEmployeeLookup(applied, page, PAGE_SIZE);
  const employees = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    setApplied({
      ...exclusion,
      empNo: filter.empNo.trim() || undefined,
      empNm: filter.empNm.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setFilter(EMPTY_FILTER);
    setApplied(exclusion);
    setPage(1);
  };

  const columns: TableColumnsType<EmployeeLookup> = [
    { title: tsg('lookupEmpNo', 'ID/Employee Number'), dataIndex: 'empNo', width: 150, align: 'center' },
    { title: tsg('lookupEmpNm', 'Name'), dataIndex: 'empNm', align: 'center' },
    {
      title: tsg('lookupPosition', 'Position'),
      dataIndex: 'jbpsNm',
      width: 160,
      align: 'center',
      render: (value?: string) => value || '-',
    },
  ];

  return (
    <Modal
      open
      width={640}
      centered
      title={tvh('selectEmployee', 'Select Person in Charge')}
      onCancel={onClose}
      maskClosable={false}
      footer={
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btn} onClick={onClose}>
            {tvb('cancel', 'Cancel')}
          </button>
          <button
            type="button"
            className={styles.btnDark}
            disabled={picked.length === 0}
            onClick={() => onConfirm(picked)}
          >
            {tvb('confirm', 'Confirm')}
          </button>
        </div>
      }
    >
      <div className={`${styles.titleRow} ${styles.mb8}`}>
        <span className={styles.modalSectionTitle}>{tvh('searchEmployee', 'Search Employee')}</span>
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={handleReset}>
            {tvb('reset', 'Reset')}
          </button>
          <button type="button" className={`${styles.btnDark} ${styles.btnSmall}`} onClick={handleSearch}>
            {tvb('query', 'Query')}
          </button>
        </div>
      </div>

      <div className={`${styles.filterCard} ${styles.mb10}`}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>{tvt('empNo', 'Employee Number')}</span>
          <Input
            className={styles.w150}
            placeholder={tvt('empNo', 'Employee Number')}
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
            className={styles.w150}
            placeholder={tvt('empNm', 'Employee Name')}
            value={filter.empNm}
            maxLength={100}
            onChange={(e) => setFilter((f) => ({ ...f, empNm: e.target.value }))}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
      </div>

      <div className={`${styles.totalCount} ${styles.mb6}`}>
        Total ({total.toLocaleString('en-US')})
      </div>
      <div className={`${styles.tableWrapper} ${styles.mb10}`}>
        <Table<EmployeeLookup>
          rowKey="empNo"
          columns={columns}
          dataSource={employees}
          loading={isFetching}
          pagination={false}
          size="small"
          scroll={{ y: 300 }}
          rowSelection={{
            preserveSelectedRowKeys: true,
            selectedRowKeys: picked.map((e) => e.empNo),
            getCheckboxProps: (row) => ({ disabled: pendingEmpNos.includes(row.empNo) }),
            onChange: (keys, rows) => {
              // `rows` only holds rows of the current page; keep earlier picks by key.
              const known = new Map([...picked, ...rows.filter(Boolean)].map((e) => [e.empNo, e]));
              setPicked(keys.map((key) => known.get(String(key))).filter((e): e is EmployeeLookup => !!e));
            },
          }}
        />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </Modal>
  );
}
