import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import TextInput from '@/components/inputs/TextInput';
import type { EmployeeLookup, EmployeeLookupSearch } from '@/api/system/employee-api';
import {
  SysFilterItem,
  SysFilterPanel,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
} from '@/components/common/sys-ui/SysListUi';
import { SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { SYS_PAGE_SIZE } from '@/config/sys-constants';
import { usePagedList } from '@/hooks/use-paged-list';
import { useEmployeeLookup } from './use-role-groups';

// Staff Search popup (VPA020500P01) opened by [Add Staff]: every employed staff member not yet
// assigned to the role (exception to the common popup: no business-permission filter).

interface StaffSearchModalProps {
  roleGroupId: string;
  roleId: string;
  saving: boolean;
  onClose: () => void;
  /** Saves the picked staff at once. */
  onSelect: (empNos: string[]) => void;
}

interface Filter {
  empNo: string;
  empNm: string;
}

const INITIAL_FILTER: Filter = { empNo: '', empNm: '' };

export default function StaffSearchModal({ roleGroupId, roleId, saving, onClose, onSelect }: StaffSearchModalProps) {
  const list = usePagedList<Filter>(INITIAL_FILTER);
  const search: EmployeeLookupSearch = {
    empNo: list.applied.empNo.trim(),
    empNm: list.applied.empNm.trim(),
    excludeRoleGroupId: roleGroupId,
    excludeRoleId: roleId,
  };
  const { data, isFetching } = useEmployeeLookup(search, list.pageQuery);
  // Kept across pages.
  const [picked, setPicked] = useState<string[]>([]);

  const columns: TableColumnsType<EmployeeLookup> = [
    { title: 'Employee No.', dataIndex: 'empNo', width: 150, align: 'center' },
    { title: 'Name', dataIndex: 'empNm', ellipsis: true },
    { title: 'Position', dataIndex: 'jbpsNm', width: 180, ellipsis: true, render: (v?: string) => v || '-' },
  ];

  const total = data?.totalElements ?? 0;

  return (
    <SysFormModal
      open
      width={760}
      title="Staff Search"
      submitText="Select"
      submitDisabled={picked.length === 0}
      submitting={saving}
      onSubmit={() => onSelect(picked)}
      onCancel={onClose}
    >
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
        <SysFilterItem label="Name">
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
      <SysSectionHeader total={total} actions={picked.length > 0 ? <span>{picked.length} selected</span> : undefined} />
      <SysTable<EmployeeLookup>
        rowKey="empNo"
        columns={columns}
        dataSource={data?.content ?? []}
        loading={isFetching}
        scroll={{ y: 360 }}
        rowSelection={{
          preserveSelectedRowKeys: true,
          selectedRowKeys: picked,
          onChange: (keys) => setPicked(keys.map(String)),
        }}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
    </SysFormModal>
  );
}
