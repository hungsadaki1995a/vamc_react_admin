import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import TextInput from '@/components/inputs/TextInput';
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
import { useApprovalCandidates, useEmployeeDirectory } from './use-approval';

// Employee Search popup (VPA020500P01), single pick. Two sources:
//   candidates — employees holding the role of an approval step (officer, approver);
//   employees  — employed staff (paged), optionally by role (`roleId` PRCS / RCPT), for list filters and the
//                consultant. Trade staff may read it (GET /api/v1/employees/lookup).

export type EmployeeSearchSource =
  | { type: 'candidates'; atrzProcCd: string; stpNo: number; atrzHstryId?: string }
  | { type: 'employees'; roleId?: string };

export interface PickedEmployee {
  empNo: string;
  empNm: string;
  jbpsNm?: string;
  roleNm?: string;
}

export interface EmployeeSearchPopupProps {
  source: EmployeeSearchSource;
  title?: string;
  /** Employees that cannot be picked (e.g. the officer when choosing a consultant). */
  excludeEmpNos?: string[];
  onSelect: (employee: PickedEmployee) => void;
  onClose: () => void;
}

interface Filter {
  empNo: string;
  empNm: string;
}

const INITIAL_FILTER: Filter = { empNo: '', empNm: '' };
const NO_ROWS: PickedEmployee[] = [];

const columns = (t: TFunction): TableColumnsType<PickedEmployee> => [
  { title: t('approval.picker.employeeNo'), dataIndex: 'empNo', width: 140, align: 'center' },
  { title: t('approval.picker.name'), dataIndex: 'empNm', ellipsis: true },
  { title: t('approval.picker.position'), dataIndex: 'jbpsNm', width: 170, ellipsis: true, render: (v?: string) => v || '-' },
  { title: t('approval.picker.role'), dataIndex: 'roleNm', width: 170, ellipsis: true, render: (v?: string) => v || '-' },
];

export default function EmployeeSearchPopup({
  source,
  title,
  excludeEmpNos,
  onSelect,
  onClose,
}: EmployeeSearchPopupProps) {
  const { t } = useTranslation();
  const list = usePagedList<Filter>(INITIAL_FILTER);
  const empNo = list.applied.empNo.trim();
  const empNm = list.applied.empNm.trim();
  const isCandidates = source.type === 'candidates';

  const candidates = useApprovalCandidates(
    isCandidates
      ? {
          atrzProcCd: source.atrzProcCd,
          stpNo: source.stpNo,
          keyword: empNo || undefined,
          empNm: empNm || undefined,
          atrzHstryId: source.atrzHstryId,
        }
      : null,
  );
  const directory = useEmployeeDirectory(
    { empNo: empNo || undefined, empNm: empNm || undefined, roleId: source.type === 'employees' ? source.roleId : undefined },
    list.pageQuery,
    !isCandidates,
  );
  const [picked, setPicked] = useState<PickedEmployee | null>(null);

  const sourceRows: PickedEmployee[] = isCandidates ? (candidates.data ?? NO_ROWS) : (directory.data?.content ?? NO_ROWS);
  const rows = excludeEmpNos?.length ? sourceRows.filter((row) => !excludeEmpNos.includes(row.empNo)) : sourceRows;
  const total = isCandidates ? rows.length : (directory.data?.totalElements ?? 0);
  const loading = isCandidates ? candidates.isFetching : directory.isFetching;

  return (
    <SysFormModal
      open
      width={760}
      title={title ?? t('approval.picker.employeeSearch')}
      submitText={t('approval.picker.select')}
      submitDisabled={!picked}
      onSubmit={() => picked && onSelect(picked)}
      onCancel={onClose}
    >
      <SysFilterPanel columns={2}>
        <SysFilterItem label={t('approval.picker.employeeNo')}>
          <TextInput
            value={list.draft.empNo}
            maxLength={10}
            allowClear
            onChange={(e) => list.setDraft({ empNo: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
        <SysFilterItem label={t('approval.picker.name')}>
          <TextInput
            value={list.draft.empNm}
            maxLength={100}
            allowClear
            onChange={(e) => list.setDraft({ empNm: e.target.value })}
            onPressEnter={() => list.search()}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={loading} />
      <SysSectionHeader total={total} />
      <SysTable<PickedEmployee>
        rowKey="empNo"
        columns={columns(t)}
        dataSource={rows}
        loading={loading}
        scroll={{ y: 320 }}
        onRowClick={(row) => setPicked(row)}
        rowSelection={{
          type: 'radio',
          selectedRowKeys: picked ? [picked.empNo] : [],
          onChange: (_keys, selected) => setPicked(selected[0] ?? null),
        }}
      />
      {!isCandidates && <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />}
    </SysFormModal>
  );
}
