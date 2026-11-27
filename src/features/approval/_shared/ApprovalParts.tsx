import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { TableColumnsType } from 'antd';
import ActionButton from '@/components/common/actions/ActionButton';
import StatusBadge from '@/components/common/badge/StatusBadge';
import type { StatusBadgeColor } from '@/components/common/badge/StatusBadge';
import DataTable from '@/components/common/table/DataTable';
import AppSelect from '@/components/inputs/AppSelect';
import type { ApprovalStep } from '@/api/common/approval-api';
import { codeLabel } from '@/lib/i18n/code-label';
import { formatDateTime } from '@/utils/date-format';
import EmployeeSearchPopup from './EmployeeSearchPopup';
import type { EmployeeSearchSource, PickedEmployee } from './EmployeeSearchPopup';
import { useApprovalCandidates, useEmployeeDirectory } from './use-approval';
import styles from './approval-popups.module.scss';

// Building blocks shared by the approval popups and the screens that call them.

/** One row of the business detail block (request code, member, NPL, value, …) supplied by the calling screen. */
export interface ApprovalDetailRow {
  label: string;
  value: ReactNode;
}

export function ApprovalSummary({ rows }: { rows: ApprovalDetailRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className={styles.summary}>
      {rows.map((row) => (
        <SummaryCells key={row.label} row={row} />
      ))}
    </div>
  );
}

function SummaryCells({ row }: { row: ApprovalDetailRow }) {
  return (
    <>
      <div className={styles.summaryLabel}>{row.label}</div>
      <div className={styles.summaryValue}>{row.value ?? '-'}</div>
    </>
  );
}

const SESSION_COLORS: Record<string, StatusBadgeColor> = { INPROGRESS: 'blue', COMPLETED: 'green', REJECTED: 'red' };

const STEP_COLORS: Record<string, StatusBadgeColor> = { WAITING: 'gray', INPROGRESS: 'blue', APPROVED: 'green', REJECTED: 'red' };

export function SessionStatusBadge({ status }: { status?: string }) {
  useTranslation();
  return <StatusBadge color={(status && SESSION_COLORS[status]) || 'gray'}>{codeLabel('approval.sessionStatus', status)}</StatusBadge>;
}

const stepColumns = (t: TFunction): TableColumnsType<ApprovalStep> => [
  { title: t('approval.fields.rowNo'), dataIndex: 'stpNo', width: 50, align: 'center' },
  { title: t('approval.fields.step'), dataIndex: 'stpNm', width: 140, render: (v: string) => codeLabel('approval.steps', v, v) },
  { title: t('approval.fields.employee'), dataIndex: 'empNm', width: 180, render: (v?: string, r?: ApprovalStep) => v || r?.empNo || '-' },
  {
    title: t('approval.fields.status'),
    dataIndex: 'status',
    width: 110,
    align: 'center',
    render: (v: string) => <StatusBadge color={STEP_COLORS[v] ?? 'gray'}>{codeLabel('approval.stepStatus', v, v)}</StatusBadge>,
  },
  { title: t('approval.fields.processedAt'), dataIndex: 'processedAt', width: 140, align: 'center', render: (v?: string) => formatDateTime(v) },
  {
    title: t('approval.fields.comment'),
    dataIndex: 'comment',
    render: (v?: string) => <span className={styles.stepComment}>{v || '-'}</span>,
  },
];

/** Steps timeline of a session (who, when, comment). */
export function ApprovalStepsTable({ steps }: { steps: ApprovalStep[] }) {
  const { t } = useTranslation();
  return (
    <div className={styles.steps}>
      <DataTable<ApprovalStep> rowKey="stpNo" columns={stepColumns(t)} dataSource={steps} pagination={false} />
    </div>
  );
}

const NO_CANDIDATES: PickedEmployee[] = [];
/** Options listed in the select of an `employees` source (first page; [Search] pages through the rest). */
const EMPLOYEE_OPTIONS_QUERY = { page: 1, size: 100 };

export interface EmployeePickFieldProps {
  /** Selected employee number ('' = none). */
  value: string;
  onChange: (empNo: string) => void;
  source: EmployeeSearchSource;
  placeholder?: string;
  searchTitle?: string;
  excludeEmpNos?: string[];
  disabled?: boolean;
}

/**
 * Employee select + [Search] button that opens the Employee Search popup (VPA020500P01). The select lists the
 * step's candidates (`candidates`) or the first employees of the role (`employees`); [Search] filters by number /
 * name.
 */
export function EmployeePickField({
  value,
  onChange,
  source,
  placeholder,
  searchTitle,
  excludeEmpNos,
  disabled,
}: EmployeePickFieldProps) {
  const { t } = useTranslation();
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<PickedEmployee | null>(null);
  const { data: candidates = NO_CANDIDATES } = useApprovalCandidates(
    source.type === 'candidates'
      ? { atrzProcCd: source.atrzProcCd, stpNo: source.stpNo, atrzHstryId: source.atrzHstryId }
      : null,
  );
  const { data: employees } = useEmployeeDirectory(
    { roleId: source.type === 'employees' ? source.roleId : undefined },
    EMPLOYEE_OPTIONS_QUERY,
    source.type === 'employees',
  );
  const listed = (source.type === 'employees' ? (employees?.content ?? NO_CANDIDATES) : candidates).filter(
    (c) => !excludeEmpNos?.includes(c.empNo),
  );
  const all = picked && !listed.some((c) => c.empNo === picked.empNo) ? [...listed, picked] : listed;
  const options = all.map((c) => ({ value: c.empNo, label: c.jbpsNm ? `${c.empNm} (${c.empNo} · ${c.jbpsNm})` : `${c.empNm} (${c.empNo})` }));

  return (
    <div className={styles.pickRow}>
      <AppSelect
        className={styles.pickSelect}
        placeholder={placeholder ?? t('approval.picker.selectEmployee')}
        value={value || undefined}
        options={options}
        disabled={disabled}
        allowClear
        showSearch={{ optionFilterProp: 'label' }}
        onChange={(v) => onChange(v ? String(v) : '')}
      />
      <ActionButton action="search" intent="quaternary" appearance="outlined" disabled={disabled} onClick={() => setSearching(true)}>
        {t('approval.picker.search')}
      </ActionButton>
      {searching && (
        <EmployeeSearchPopup
          source={source}
          title={searchTitle}
          excludeEmpNos={excludeEmpNos}
          onClose={() => setSearching(false)}
          onSelect={(employee) => {
            setPicked(employee);
            onChange(employee.empNo);
            setSearching(false);
          }}
        />
      )}
    </div>
  );
}
