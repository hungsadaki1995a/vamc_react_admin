import { useEffect, useState } from 'react';
import { Input, Modal, Select, Spin } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useScreenLabel } from '@/hooks/use-screen-label';
import {
  createEmployee,
  getEmployee,
  resetEmployeePassword,
  updateEmployee,
} from '@/api/sys/employee-api';
import type { EmployeeDetail, EmpStatus, UpdateEmployeeRequest } from '@/api/sys/employee-api';
import { FormField } from '../_shared/sys-ui';
import { errorMessage } from '../_shared/sys-utils';
import styles from '../_shared/sys-page.module.css';
import { EMP_STATUS_CODES, EMP_STATUS_FALLBACK } from './user-constants';

dayjs.extend(customParseFormat);

// User Management - Detail / Register / Edit popup (VPA0045P01).

interface UserModalProps {
  /** null = register a new user. */
  empNo: string | null;
  canWrite: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  empSttsCd: EmpStatus;
  empNo: string;
  empNm: string;
  empEmlAddr: string;
  empTelno: string;
  empMoblTelno: string;
  jbpsNm: string;
  /** Initial password — required on register, used by Reset on edit. */
  password: string;
}

const NEW_FORM: FormState = {
  empSttsCd: 'H',
  empNo: '',
  empNm: '',
  empEmlAddr: '',
  empTelno: '',
  empMoblTelno: '',
  jbpsNm: '',
  password: '',
};

const EMP_NO_PATTERN = /^[a-zA-Z0-9_-]{3,10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UserModal({ empNo, canWrite, onClose, onSaved }: UserModalProps) {
  const isCreate = empNo === null;
  const { toast, dialog } = useNotify();
  const { tvt, tvb, tvh, tsm } = useScreenLabel();
  const queryClient = useQueryClient();

  // The list row is masked; the edit form must start from the unmasked detail.
  const { data: detail, isFetching } = useApiQuery<EmployeeDetail>(
    ['sys', 'employees', 'detail', empNo],
    () => getEmployee(empNo as string),
    { enabled: !isCreate, gcTime: 0 },
  );

  const [form, setForm] = useState<FormState>(NEW_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!detail) return;
    setForm({
      empSttsCd: detail.empSttsCd,
      empNo: detail.empNo,
      empNm: detail.empNm ?? '',
      empEmlAddr: detail.empEmlAddr ?? '',
      empTelno: detail.empTelno ?? '',
      empMoblTelno: detail.empMoblTelno ?? '',
      jbpsNm: detail.jbpsNm ?? '',
      password: '',
    });
  }, [detail]);

  const patch = (values: Partial<FormState>) => setForm((prev) => ({ ...prev, ...values }));
  const disabled = !canWrite;

  const passwordChanged = detail?.pswdChgDmy
    ? dayjs(detail.pswdChgDmy, 'DDMMYYYY').format('DD/MM/YYYY')
    : '';

  const validatePassword = (): string | null =>
    form.password.length < 8 || form.password.length > 50
      ? tsm('passwordLength', 'The initial password must be 8 to 50 characters.')
      : null;

  const validate = (): string | null => {
    if (isCreate && !EMP_NO_PATTERN.test(form.empNo.trim())) {
      return tsm('invalidEmpNo', 'Employee Number must be 3 to 10 letters, digits, "_" or "-".');
    }
    if (!form.empNm.trim()) return tsm('nameRequired', 'Enter the name.');
    if (!EMAIL_PATTERN.test(form.empEmlAddr.trim())) return tsm('invalidEmail', 'Enter a valid email address.');
    if (isCreate) return validatePassword();
    return null;
  };

  const handleConfirm = async () => {
    const invalid = validate();
    if (invalid) {
      toast.warning(invalid);
      return;
    }
    // Update is a full overwrite — every field is sent.
    const profile: UpdateEmployeeRequest = {
      empNm: form.empNm.trim(),
      empEmlAddr: form.empEmlAddr.trim(),
      empTelno: form.empTelno.trim() || undefined,
      empMoblTelno: form.empMoblTelno.trim() || undefined,
      empSttsCd: form.empSttsCd,
      jbpsNm: form.jbpsNm.trim() || undefined,
    };
    setSaving(true);
    try {
      const response = isCreate
        ? await createEmployee({ ...profile, empNo: form.empNo.trim(), password: form.password })
        : await updateEmployee(empNo as string, profile);
      toast.success(response.message || tsm('saved', 'Saved.'));
      onSaved();
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = () => {
    const invalid = validatePassword();
    if (invalid) {
      toast.warning(invalid);
      return;
    }
    dialog.confirm({
      content: tsm(
        'confirmResetPassword',
        'Reset the password to the entered initial password and clear the failed count?',
      ),
      onOk: async () => {
        try {
          const response = await resetEmployeePassword(empNo as string, form.password);
          toast.success(response.message || tsm('passwordReset', 'The password has been reset.'));
          patch({ password: '' });
          await queryClient.invalidateQueries({ queryKey: ['sys', 'employees'] });
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });
  };

  return (
    <Modal
      open
      width={980}
      centered
      title={tvh('userModal', 'View User Information')}
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
            disabled={disabled || saving || isFetching}
            onClick={handleConfirm}
          >
            {tvb('confirm', 'Confirm')}
          </button>
        </div>
      }
    >
      <Spin spinning={isFetching}>
        <div className={styles.modalSectionTitle}>{tvh('employeeInfo', 'Employee Information')}</div>
        <div className={styles.formGrid} style={{ ['--form-cols' as string]: 3 }}>
          <FormField label={tvt('status', 'Employment Status')} required>
            <Select
              style={{ width: '100%' }}
              value={form.empSttsCd}
              disabled={disabled}
              onChange={(empSttsCd) => patch({ empSttsCd })}
              options={EMP_STATUS_CODES.map((code) => ({
                value: code,
                label: tvt(`status${code}`, EMP_STATUS_FALLBACK[code]),
              }))}
            />
          </FormField>
          <FormField label={tvt('empNo', 'Employee Number')} required>
            <Input
              value={form.empNo}
              maxLength={10}
              disabled={disabled || !isCreate}
              onChange={(e) => patch({ empNo: e.target.value })}
            />
          </FormField>
          <FormField label={tvt('empNm', 'Name')} required>
            <Input
              value={form.empNm}
              maxLength={100}
              disabled={disabled}
              onChange={(e) => patch({ empNm: e.target.value })}
            />
          </FormField>

          <FormField label={tvt('email', 'Email')} required>
            <Input
              value={form.empEmlAddr}
              maxLength={256}
              disabled={disabled}
              onChange={(e) => patch({ empEmlAddr: e.target.value })}
            />
          </FormField>
          <FormField label={tvt('telno', 'Company Phone')}>
            <Input
              value={form.empTelno}
              maxLength={11}
              disabled={disabled}
              onChange={(e) => patch({ empTelno: e.target.value })}
            />
          </FormField>
          <FormField label={tvt('mobile', 'Mobile')}>
            <Input
              value={form.empMoblTelno}
              maxLength={20}
              disabled={disabled}
              onChange={(e) => patch({ empMoblTelno: e.target.value })}
            />
          </FormField>

          <FormField label={tvt('position', 'Position')}>
            <Input
              value={form.jbpsNm}
              maxLength={100}
              disabled={disabled}
              onChange={(e) => patch({ jbpsNm: e.target.value })}
            />
          </FormField>
          <FormField label={tvt('passwordMgmt', 'Password Management')} required={isCreate} span="full">
            <span className={styles.filterLabel}>{tvt('initialPw', 'Initial PW')}</span>
            <Input.Password
              style={{ width: 180, flexShrink: 0 }}
              value={form.password}
              maxLength={50}
              autoComplete="new-password"
              disabled={disabled}
              onChange={(e) => patch({ password: e.target.value })}
            />
            {!isCreate && (
              <>
                <span className={styles.filterLabel}>{tvt('pwFailed', 'PW Failed')}</span>
                <Input style={{ width: 56, flexShrink: 0 }} value={detail?.pswdFailNmtm ?? 0} disabled />
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSmall}`}
                  disabled={disabled}
                  onClick={handleResetPassword}
                >
                  {tvb('resetPw', 'Reset')}
                </button>
                <span className={styles.filterLabel}>{tvt('pwChanged', 'PW Changed')}</span>
                <Input style={{ width: 110, flexShrink: 0 }} value={passwordChanged} disabled />
              </>
            )}
          </FormField>
        </div>
      </Spin>
    </Modal>
  );
}
