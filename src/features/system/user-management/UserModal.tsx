import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import type { EmpStatus, EmployeeDetail, UpdateEmployeeRequest } from '@/api/system/employee-api';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { SYS_DIALOG_LABELS, SYS_MESSAGES } from '@/config/sys-messages';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { errorMessage } from '@/utils/system-utils';
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
  const { t } = useTranslation();
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
      setError('empNo', t('messages.system.user.empNoPattern'));
      valid = false;
    }
    if (!EMAIL_PATTERN.test(form.empEmlAddr.trim())) {
      setError('empEmlAddr', t('messages.system.user.invalidEmail'));
      valid = false;
    }
    if (!MOBILE_PATTERN.test(form.empMoblTelno.trim())) {
      setError('empMoblTelno', t('messages.system.user.invalidMobile'));
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
          notify.success(t('messages.system.user.registeredMailSent', { email: result.mailSentTo ?? form.empEmlAddr }));
        } else {
          notify.warning(t('messages.system.user.registeredMailFailed'));
        }
      }
      onClose();
    } catch (e) {
      const handled = applyApiError(e, {
        EMP_DUPLICATED: ['empNo', SYS_MESSAGES.duplicate(t('messages.sys.items.employeeNo'))],
        EMP001: ['empEmlAddr', SYS_MESSAGES.duplicate(t('messages.sys.items.email'))],
        EMP002: ['empMoblTelno', SYS_MESSAGES.duplicate(t('messages.sys.items.mobileNumber'))],
      });
      if (!handled) toast.error(errorMessage(e));
    }
  };

  const handleDelete = () => {
    if (!detail) return;
    confirm({
      content: SYS_MESSAGES.confirmDelete(t('messages.sys.items.thisUser')),
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
      content: t('messages.system.user.confirmResetPassword', {
        target: detail.empEmlAddr ?? t('messages.system.user.theUser'),
      }),
      okText: t('messages.dialog.reset'),
      onOk: async () => {
        try {
          const response = await resetPassword.mutateAsync(detail.empNo);
          const result = response.data;
          if (result?.mailSent) {
            notify.success(t('messages.system.user.tempPasswordSent', { email: result.mailSentTo ?? detail.empEmlAddr }));
          } else {
            notify.error(t('messages.system.user.tempPasswordFailed'));
          }
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const readOnly = !canWrite;
  // Design: [Delete] sits on the left of the footer, [Cancel] [Edit] on the right.
  const leftActions =
    isEdit && canWrite ? (
      <SysButton look="danger" loading={deleteEmployee.isPending} onClick={handleDelete}>
        Delete
      </SysButton>
    ) : undefined;

  const statusField = (
    <SysField label="Status" required error={errors.empSttsCd}>
      <AppSelect<EmpStatus>
        options={EMP_STATUS_OPTIONS}
        value={form.empSttsCd || undefined}
        disabled={readOnly}
        onChange={(empSttsCd) => change({ empSttsCd })}
      />
    </SysField>
  );

  return (
    <SysFormModal
      open
      width={1200}
      title={isEdit ? 'Edit User Information' : 'Register User Information'}
      submitText={isEdit ? 'Edit' : 'Register'}
      onSubmit={canWrite ? () => void handleSubmit() : undefined}
      submitting={createEmployee.isPending || updateEmployee.isPending}
      leftActions={leftActions}
      onCancel={onClose}
    >
      <SysFieldGrid columns={3}>
        <SysField label="Employee No." required error={errors.empNo}>
          <TextInput
            value={form.empNo}
            maxLength={10}
            disabled={isEdit || readOnly}
            placeholder="e.g. emp100"
            onChange={(e) => change({ empNo: e.target.value })}
          />
        </SysField>
        <SysField label="Name" required error={errors.empNm}>
          <TextInput value={form.empNm} maxLength={100} disabled={readOnly} onChange={(e) => change({ empNm: e.target.value })} />
        </SysField>
        {statusField}
        <SysField label="Email" required error={errors.empEmlAddr}>
          <TextInput
            type="email"
            value={form.empEmlAddr}
            maxLength={256}
            disabled={readOnly}
            onChange={(e) => change({ empEmlAddr: e.target.value })}
          />
        </SysField>
        <SysField label="Office Phone" error={errors.empTelno}>
          <TextInput
            type="tel"
            value={form.empTelno}
            maxLength={11}
            disabled={readOnly}
            onChange={(e) => change({ empTelno: e.target.value })}
          />
        </SysField>
        <SysField label="Mobile Number" required error={errors.empMoblTelno}>
          <TextInput
            type="tel"
            value={form.empMoblTelno}
            maxLength={20}
            disabled={readOnly}
            onChange={(e) => change({ empMoblTelno: e.target.value })}
          />
        </SysField>
        {isEdit && (
          <SysField label="Password" span={3}>
            <SysButton disabled={readOnly} loading={resetPassword.isPending} onClick={handleResetPassword}>
              Reset Password
            </SysButton>
          </SysField>
        )}
      </SysFieldGrid>
    </SysFormModal>
  );
}
