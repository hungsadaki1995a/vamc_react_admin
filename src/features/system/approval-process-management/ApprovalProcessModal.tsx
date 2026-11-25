import { useState } from 'react';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { APPROVAL_PROCESS_ERRORS } from '@/api/system/approval-process-api';
import type { ApprovalProcessDetail, ApprovalProcessStepRequest, YesNo } from '@/api/system/approval-process-api';
import { SysField, SysFieldGrid, SysFormModal, SysFormSection } from '@/components/common/sys-ui/SysFormUi';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { USE_YN_RADIO_OPTIONS } from '@/config/sys-constants';
import { SYS_DIALOG_LABELS, SYS_MESSAGES } from '@/config/sys-messages';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { apiErrorCode, errorMessage } from '@/utils/system-utils';
import {
  APPROVAL_PROCESS_MESSAGES,
  MAX_STEPS,
  PROCESS_CODE_MAX,
  PROCESS_CODE_PATTERN,
  PROCESS_NAME_MAX,
  STEP_NAME_MAX,
} from './approval-process-constants';
import {
  useActiveRoleGroups,
  useActiveRoles,
  useApprovalProcess,
  useCreateApprovalProcess,
  useDeleteApprovalProcess,
  useUpdateApprovalProcess,
} from './use-approval-processes';
import styles from './approval-process-management.module.scss';

// Approval process register / edit popup: process fields and the ordered steps (step N is row N).

type Field = 'atrzProcCd' | 'atrzProcNm' | 'useYn' | 'steps';

/** One editable step; `key` keeps React rows stable while steps move. */
interface StepRow {
  key: string;
  stpNm: string;
  roleGroupId: string;
  roleId: string;
  /** Step number to return to on rejection, null = none. */
  rjctStpNo: number | null;
}

let rowSeq = 0;
const newRow = (row: Partial<StepRow> = {}): StepRow => ({
  key: `step-${(rowSeq += 1)}`,
  stpNm: '',
  roleGroupId: '',
  roleId: '',
  rjctStpNo: null,
  ...row,
});

/** Keeps every rejection target valid after a move / removal: it must point to an earlier step. */
function normalizeRejects(rows: StepRow[]): StepRow[] {
  return rows.map((row, index) => (row.rjctStpNo !== null && row.rjctStpNo > index ? { ...row, rjctStpNo: null } : row));
}

function toRequestSteps(rows: StepRow[]): ApprovalProcessStepRequest[] {
  return rows.map((row, index) => ({
    stpNo: index + 1,
    stpNm: row.stpNm.trim(),
    roleGroupId: row.roleGroupId,
    roleId: row.roleId,
    rjctStpNo: row.rjctStpNo ?? undefined,
  }));
}

/** Role picker of one step: the roles of the step's group, active only. */
function StepRoleSelect({ row, disabled, onChange }: { row: StepRow; disabled: boolean; onChange: (roleId: string) => void }) {
  const { data: roles = [], isFetching } = useActiveRoles(row.roleGroupId || null);
  const options = roles.map((role) => ({ value: role.roleId, label: `${role.roleNm} (${role.roleId})` }));
  // A stored role that is no longer active still shows its code instead of a blank select
  if (row.roleId && !isFetching && !options.some((o) => o.value === row.roleId)) {
    options.push({ value: row.roleId, label: `${row.roleId} (inactive)` });
  }
  return (
    <AppSelect<string>
      className={styles.fullWidth}
      placeholder={row.roleGroupId ? 'Select role' : 'Select a group first'}
      options={options}
      value={row.roleId || undefined}
      loading={isFetching}
      disabled={disabled || !row.roleGroupId}
      onChange={onChange}
    />
  );
}

interface FormModalProps {
  /** null = register. */
  detail: ApprovalProcessDetail | null;
  canWrite: boolean;
  onClose: () => void;
}

function ApprovalProcessFormModal({ detail, canWrite, onClose }: FormModalProps) {
  const isCreate = detail === null;
  const editable = canWrite;
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<Field>();
  const [values, setValues] = useState({
    atrzProcCd: detail?.atrzProcCd ?? '',
    atrzProcNm: detail?.atrzProcNm ?? '',
    useYn: (detail?.useYn ?? 'Y') as YesNo,
  });
  const [rows, setRows] = useState<StepRow[]>(() =>
    detail?.steps?.length
      ? [...detail.steps]
          .sort((a, b) => a.stpNo - b.stpNo)
          .map((step) =>
            newRow({ stpNm: step.stpNm, roleGroupId: step.roleGroupId, roleId: step.roleId, rjctStpNo: step.rjctStpNo ?? null }),
          )
      : [newRow()],
  );
  const { data: roleGroups = [] } = useActiveRoleGroups();
  const createProcess = useCreateApprovalProcess();
  const updateProcess = useUpdateApprovalProcess();
  const deleteProcess = useDeleteApprovalProcess();

  const groupOptions = roleGroups.map((group) => ({ value: group.roleGroupId, label: `${group.roleGroupNm} (${group.roleGroupId})` }));

  const change = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const updateRows = (next: StepRow[]) => {
    setRows(normalizeRejects(next));
    clearError('steps');
  };
  const changeRow = (index: number, patch: Partial<StepRow>) =>
    updateRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const moveRow = (index: number, delta: -1 | 1) => {
    const next = [...rows];
    const [moved] = next.splice(index, 1);
    next.splice(index + delta, 0, moved);
    updateRows(next);
  };

  const validate = (): boolean => {
    if (!checkRequired(values, isCreate ? ['atrzProcCd', 'atrzProcNm', 'useYn'] : ['atrzProcNm', 'useYn'])) return false;
    if (isCreate && !PROCESS_CODE_PATTERN.test(values.atrzProcCd.trim())) {
      setError('atrzProcCd', APPROVAL_PROCESS_MESSAGES.codeFormat);
      return false;
    }
    if (rows.length === 0) {
      setError('steps', APPROVAL_PROCESS_MESSAGES.stepsRequired);
      return false;
    }
    if (rows.some((row) => !row.stpNm.trim() || !row.roleGroupId || !row.roleId)) {
      setError('steps', APPROVAL_PROCESS_MESSAGES.stepIncomplete);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const steps = toRequestSteps(rows);
    try {
      if (isCreate) {
        await createProcess.mutateAsync({
          atrzProcCd: values.atrzProcCd.trim(),
          atrzProcNm: values.atrzProcNm.trim(),
          useYn: values.useYn,
          steps,
        });
        toast.success(SYS_MESSAGES.registered);
      } else {
        await updateProcess.mutateAsync({
          atrzProcId: detail.atrzProcId,
          request: { atrzProcNm: values.atrzProcNm.trim(), useYn: values.useYn, steps },
        });
        toast.success(SYS_MESSAGES.updated);
      }
      onClose();
    } catch (e) {
      const handled = applyApiError(e, {
        [APPROVAL_PROCESS_ERRORS.duplicateCode]: ['atrzProcCd', APPROVAL_PROCESS_MESSAGES.duplicateCode],
        [APPROVAL_PROCESS_ERRORS.invalidStepOrder]: ['steps', APPROVAL_PROCESS_MESSAGES.invalidStepOrder],
        [APPROVAL_PROCESS_ERRORS.invalidRejectStep]: ['steps', APPROVAL_PROCESS_MESSAGES.invalidRejectStep],
        [APPROVAL_PROCESS_ERRORS.invalidRole]: ['steps', APPROVAL_PROCESS_MESSAGES.invalidRole],
      });
      if (!handled) toast.error(errorMessage(e));
    }
  };

  const handleDelete = () => {
    if (!detail) return;
    confirm({
      content: APPROVAL_PROCESS_MESSAGES.confirmDelete,
      okText: SYS_DIALOG_LABELS.delete,
      danger: true,
      onOk: async () => {
        try {
          await deleteProcess.mutateAsync(detail.atrzProcId);
          toast.success(SYS_MESSAGES.deleted);
          onClose();
        } catch (e) {
          toast.error(apiErrorCode(e) === APPROVAL_PROCESS_ERRORS.inUse ? APPROVAL_PROCESS_MESSAGES.inUse : errorMessage(e));
        }
      },
    });
  };

  const title = isCreate ? 'Register Approval Process' : editable ? 'Edit Approval Process' : 'Approval Process Detail';

  return (
    <SysFormModal
      open
      width={1200}
      title={title}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={editable ? () => void handleSubmit() : undefined}
      submitting={createProcess.isPending || updateProcess.isPending}
      onCancel={onClose}
      notice={!isCreate && <p className={styles.notice}>{APPROVAL_PROCESS_MESSAGES.sessionsKeepSteps}</p>}
      leftActions={
        !isCreate &&
        editable && (
          <SysButton look="danger" loading={deleteProcess.isPending} onClick={handleDelete}>
            Delete
          </SysButton>
        )
      }
    >
      <SysFormSection title="Process">
        <SysFieldGrid columns={3}>
          <SysField
            label="Process Code"
            required
            error={errors.atrzProcCd}
            hint={isCreate ? 'Used by the system to start sessions; cannot be changed later.' : undefined}
          >
            <TextInput
              value={values.atrzProcCd}
              maxLength={PROCESS_CODE_MAX}
              placeholder="e.g. PROC_MBR_JOIN"
              disabled={!isCreate}
              onChange={(e) => change('atrzProcCd', e.target.value.toUpperCase())}
            />
          </SysField>
          <SysField label="Process Name" required error={errors.atrzProcNm}>
            <TextInput
              value={values.atrzProcNm}
              maxLength={PROCESS_NAME_MAX}
              readOnly={!editable}
              onChange={(e) => change('atrzProcNm', e.target.value)}
            />
          </SysField>
          <SysField label="Use" required error={errors.useYn}>
            <AppRadio.Group
              options={USE_YN_RADIO_OPTIONS}
              value={values.useYn}
              disabled={!editable}
              onChange={(e) => change('useYn', e.target.value as YesNo)}
            />
          </SysField>
        </SysFieldGrid>
      </SysFormSection>

      <SysFormSection
        title="Steps"
        actions={
          editable && (
            <SysButton look="navy" disabled={rows.length >= MAX_STEPS} onClick={() => updateRows([...rows, newRow()])}>
              Add Step
            </SysButton>
          )
        }
      >
        <div className={styles.stepsWrap}>
          <table className={styles.stepsTable}>
            <thead>
              <tr>
                <th className={styles.stepNo}>Step</th>
                <th>Step Name</th>
                <th>Role Group</th>
                <th>Role</th>
                <th>Return on Rejection</th>
                {editable && <th className={styles.stepActions}>Order</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.key}>
                  <td className={styles.stepNo}>{index + 1}</td>
                  <td className={styles.stepName}>
                    <TextInput
                      value={row.stpNm}
                      maxLength={STEP_NAME_MAX}
                      placeholder="e.g. RCPT, PRCS"
                      readOnly={!editable}
                      onChange={(e) => changeRow(index, { stpNm: e.target.value })}
                    />
                  </td>
                  <td className={styles.stepRole}>
                    <AppSelect<string>
                      className={styles.fullWidth}
                      placeholder="Select group"
                      options={groupOptions}
                      value={row.roleGroupId || undefined}
                      disabled={!editable}
                      onChange={(roleGroupId) => changeRow(index, { roleGroupId, roleId: '' })}
                    />
                  </td>
                  <td className={styles.stepRole}>
                    <StepRoleSelect row={row} disabled={!editable} onChange={(roleId) => changeRow(index, { roleId })} />
                  </td>
                  <td className={styles.stepReject}>
                    <AppSelect<number>
                      className={styles.fullWidth}
                      options={[
                        { value: 0, label: 'None' },
                        ...rows.slice(0, index).map((_, i) => ({ value: i + 1, label: `Step ${i + 1}` })),
                      ]}
                      value={row.rjctStpNo ?? 0}
                      disabled={!editable || index === 0}
                      onChange={(v) => changeRow(index, { rjctStpNo: v ? v : null })}
                    />
                  </td>
                  {editable && (
                    <td className={styles.stepActions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        aria-label={`Move step ${index + 1} up`}
                        disabled={index === 0}
                        onClick={() => moveRow(index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={styles.iconButton}
                        aria-label={`Move step ${index + 1} down`}
                        disabled={index === rows.length - 1}
                        onClick={() => moveRow(index, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={styles.iconButton}
                        aria-label={`Remove step ${index + 1}`}
                        disabled={rows.length === 1}
                        onClick={() => updateRows(rows.filter((_, i) => i !== index))}
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {errors.steps && <p className={styles.stepsError}>{errors.steps}</p>}
      </SysFormSection>
    </SysFormModal>
  );
}

interface ApprovalProcessModalProps {
  /** null = register; otherwise the process to open. */
  atrzProcId: string | null;
  canWrite: boolean;
  onClose: () => void;
}

/** Loads the process with its steps before opening the form. */
export function ApprovalProcessModal({ atrzProcId, canWrite, onClose }: ApprovalProcessModalProps) {
  const { data, isError, error } = useApprovalProcess(atrzProcId);
  if (atrzProcId === null) return <ApprovalProcessFormModal detail={null} canWrite={canWrite} onClose={onClose} />;
  if (data) return <ApprovalProcessFormModal key={data.atrzProcId} detail={data} canWrite={canWrite} onClose={onClose} />;
  return (
    <SysFormModal open title="Approval Process Detail" onCancel={onClose}>
      <div className={styles.loading}>{isError ? errorMessage(error) : <LoadingSpinner />}</div>
    </SysFormModal>
  );
}
