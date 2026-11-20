import { useState } from 'react';
import { Input, Select } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import type { EmpStatus, EmployeeDetail, UpdateEmployeeRequest } from '@/api/system/employee-api';
import { SysButton } from '../_shared/sys-list-ui';
import { SysField, SysFieldGrid, SysFormModal } from '../_shared/sys-form-ui';
import { SYS_DIALOG_LABELS, SYS_MESSAGES } from '../_shared/sys-messages';
import { useSysDialogs } from '../_shared/use-sys-dialogs';
import { useFieldErrors } from '../_shared/use-field-errors';
import { errorMessage } from '../_shared/system-utils';
import { EMAIL_PATTERN, EMP_NO_PATTERN, EMP_STATUS_OPTIONS, MOBILE_PATTERN } from './user-constants';
import { useCreateEmployee, useDeleteEmployee, useResetEmployeePassword, useUpdateEmployee } from './use-employees';

// User Management - Register/Edit popup (VPA090202P01).
// No password field: on register the server mails a temporary password, which is never shown here.

interface UserModalProps {
  /** Loaded detail = edit mode; undefined = register mode. */
  detail?: EmployeeDetail;
  canWrite: boolean;
  onClose: () => void;
}

interface UserForm {
  empSttsCd: EmpStatus | '';
  empNo: string;
  empNm: string;
  empEmlAddr: string;
  empTelno: string;
  empMoblTelno: string;
}

type UserField = keyof UserForm;

const REQUIRED: UserField[] = ['empSttsCd', 'empNo', 'empNm', 'empEmlAddr', 'empMoblTelno'];

function toForm(detail?: EmployeeDetail): UserForm {
  return {
    empSttsCd: detail?.empSttsCd ?? 'H',
    empNo: detail?.empNo ?? '',
    empNm: detail?.empNm ?? '',
    empEmlAddr: detail?.empEmlAddr ?? '',
    empTelno: detail?.empTelno ?? '',
    empMoblTelno: detail?.empMoblTelno ?? '',
  };
}

export default function UserModal({ detail, canWrite, onClose }: UserModalProps) {
  const isEdit = detail !== undefined;
  const { toast, notify } = useNotify();
  const { confirm } = useSysDialogs();
  const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<UserField>();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const resetPassword = useResetEmployeePassword();

  const [form, setForm] = useState<UserForm>(() => toForm(detail));

  const change = (patch: Partial<UserForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    (Object.keys(patch) as UserField[]).forEach(clearError);
  };

  /** E01 then format checks (E03); true when the form can be sent. */
  const validate = (): boolean => {
    if (!checkRequired(form, REQUIRED)) return false;
    let valid = true;
    if (!isEdit && !EMP_NO_PATTERN.test(form.empNo)) {
      setError('empNo', 'Use 3 to 10 letters, digits, "_" or "-".');
      valid = false;
    }
    if (!EMAIL_PATTERN.test(form.empEmlAddr.trim())) {
      setError('empEmlAddr', 'Please check the email format.');
      valid = false;
    }
    if (!MOBILE_PATTERN.test(form.empMoblTelno.trim())) {
      setError('empMoblTelno', 'Please check the mobile number format.');
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const request: UpdateEmployeeRequest = {
      empSttsCd: form.empSttsCd as EmpStatus,
      empNm: form.empNm.trim(),
      empEmlAddr: form.empEmlAddr.trim(),
      empTelno: form.empTelno.trim() || undefined,
      empMoblTelno: form.empMoblTelno.trim(),
      // Not on the v0.8 popup; kept because the update overwrites every column.
      jbpsNm: detail?.jbpsNm,
    };
    try {
      if (isEdit) {
        await updateEmployee.mutateAsync({ empNo: detail.empNo, request });
        toast.success(SYS_MESSAGES.updated);
      } else {
        const response = await createEmployee.mutateAsync({ ...request, empNo: form.empNo.trim() });
        const result = response.data;
        if (result?.mailSent) {
          notify.success(`The user was registered. A temporary password was sent to ${result.mailSentTo ?? form.empEmlAddr}.`);
        } else {
          notify.warning(
            'The user was registered, but the temporary password mail could not be sent. Open the user and use [Reset Password] to send it again.',
          );
        }
      }
      onClose();
    } catch (e) {
      const handled = applyApiError(e, {
        EMP_DUPLICATED: ['empNo', SYS_MESSAGES.duplicate('Employee No.')],
        EMP001: ['empEmlAddr', SYS_MESSAGES.duplicate('Email')],
        EMP002: ['empMoblTelno', SYS_MESSAGES.duplicate('Mobile Number')],
      });
      if (!handled) toast.error(errorMessage(e));
    }
  };

  const handleDelete = () => {
    if (!detail) return;
    confirm({
      content: SYS_MESSAGES.confirmDelete('this user'),
      okText: SYS_DIALOG_LABELS.delete,
      danger: true,
      onOk: async () => {
        try {
          await deleteEmployee.mutateAsync(detail.empNo);
          toast.success(SYS_MESSAGES.deleted);
          onClose();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const handleResetPassword = () => {
    if (!detail) return;
    confirm({
      content: `Send a temporary password to ${detail.empEmlAddr ?? 'the user'}? The account is unlocked as well.`,
      okText: SYS_DIALOG_LABELS.send,
      onOk: async () => {
        try {
          const response = await resetPassword.mutateAsync(detail.empNo);
          const result = response.data;
          if (result?.mailSent) {
            notify.success(`A temporary password was sent to ${result.mailSentTo ?? detail.empEmlAddr}.`);
          } else {
            notify.error('The account was unlocked, but the temporary password mail could not be sent. Please try again.');
          }
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const readOnly = !canWrite;
  const extraActions =
    isEdit && canWrite ? (
      <>
        <SysButton loading={resetPassword.isPending} onClick={handleResetPassword}>
          Reset Password
        </SysButton>
        <SysButton danger loading={deleteEmployee.isPending} onClick={handleDelete}>
          Delete
        </SysButton>
      </>
    ) : undefined;

  return (
    <SysFormModal
      open
      title={isEdit ? 'Edit User' : 'Register User'}
      submitText={isEdit ? 'Edit' : 'Register'}
      onSubmit={canWrite ? () => void handleSubmit() : undefined}
      submitting={createEmployee.isPending || updateEmployee.isPending}
      extraActions={extraActions}
      notice={isEdit ? undefined : 'A temporary password is sent to the email on registration and must be changed at first login.'}
      onCancel={onClose}
    >
      <SysFieldGrid columns={2}>
        <SysField label="Status" required error={errors.empSttsCd}>
          <Select
            options={EMP_STATUS_OPTIONS}
            value={form.empSttsCd || undefined}
            disabled={readOnly}
            onChange={(empSttsCd: EmpStatus) => change({ empSttsCd })}
          />
        </SysField>
        <SysField label="Employee No." required error={errors.empNo}>
          <Input
            value={form.empNo}
            maxLength={10}
            disabled={isEdit || readOnly}
            placeholder="e.g. staff01"
            onChange={(e) => change({ empNo: e.target.value })}
          />
        </SysField>
        <SysField label="Name" required error={errors.empNm}>
          <Input value={form.empNm} maxLength={100} disabled={readOnly} onChange={(e) => change({ empNm: e.target.value })} />
        </SysField>
        <SysField label="Email" required error={errors.empEmlAddr}>
          <Input
            type="email"
            value={form.empEmlAddr}
            maxLength={256}
            disabled={readOnly}
            placeholder="e.g. staff01@vamc.vn"
            onChange={(e) => change({ empEmlAddr: e.target.value })}
          />
        </SysField>
        <SysField label="Office Phone" error={errors.empTelno}>
          <Input
            type="tel"
            value={form.empTelno}
            maxLength={11}
            disabled={readOnly}
            onChange={(e) => change({ empTelno: e.target.value })}
          />
        </SysField>
        <SysField label="Mobile Number" required error={errors.empMoblTelno}>
          <Input
            type="tel"
            value={form.empMoblTelno}
            maxLength={20}
            disabled={readOnly}
            placeholder="e.g. +84901234567"
            onChange={(e) => change({ empMoblTelno: e.target.value })}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
