import { useState } from 'react';
import { Input, Radio, Select } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { FORM_API_AVAILABLE, FORM_ERRORS } from '@/api/system/form-api';
import type { FormItem, FormLang, FormSaveRequest, YesNo } from '@/api/system/form-api';
import { SysField, SysFieldGrid, SysFormModal } from '../_shared/SysFormUi';
import { USE_YN_RADIO_OPTIONS } from '../_shared/sys-constants';
import { SYS_MESSAGES } from '../_shared/sys-messages';
import { errorMessage } from '../_shared/system-utils';
import { useFieldErrors } from '../_shared/use-field-errors';
import { useSysDialogs } from '../_shared/use-sys-dialogs';
import { useSaveForm } from './use-forms';

// Form Management - Register / Edit popup (VPA090102P01).

type FieldKey = 'formNo' | 'langCd' | 'useYn' | 'formNm' | 'fileUrl';

interface FormState {
  formNo: string;
  langCd: FormLang | undefined;
  useYn: YesNo;
  formNm: string;
  fileUrl: string;
}

const LANG_OPTIONS: { value: FormLang; label: string }[] = [
  { value: 'VN', label: 'VN' },
  { value: 'EN', label: 'EN' },
];

const FORM_NO_PATTERN = /^\d{4}$/;
const FILE_URL_PATTERN = /^https:\/\/\S+\.(docx|xlsx|pdf)$/i;

const FORM_MESSAGES = {
  /** E02 */
  duplicate: SYS_MESSAGES.duplicate('form no.'),
  /** E03 */
  invalidUrl: 'Please enter a docx, xlsx or pdf file URL starting with https.',
  formNoDigits: 'Enter a 4-digit number.',
  notAvailable: 'Saving forms is not available yet: the backend API is waiting for a schema change.',
} as const;

interface FormModalProps {
  /** null = register. */
  form: FormItem | null;
  canWrite: boolean;
  onClose: () => void;
}

export default function FormModal({ form, canWrite, onClose }: FormModalProps) {
  const isCreate = form === null;
  const { toast } = useNotify();
  const { alert } = useSysDialogs();
  const saveForm = useSaveForm();
  const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();

  const [values, setValues] = useState<FormState>(() => ({
    formNo: form?.formNo ?? '',
    langCd: form?.langCd,
    useYn: form?.useYn ?? 'Y',
    formNm: form?.formNm ?? '',
    fileUrl: form?.fileUrl ?? '',
  }));

  const patch = (key: FieldKey, value: Partial<FormState>) => {
    setValues((prev) => ({ ...prev, ...value }));
    clearError(key);
  };

  const validate = (): boolean => {
    if (!checkRequired(values, ['formNo', 'langCd', 'useYn', 'formNm', 'fileUrl'])) return false;
    let valid = true;
    if (!FORM_NO_PATTERN.test(values.formNo.trim())) {
      setError('formNo', FORM_MESSAGES.formNoDigits);
      valid = false;
    }
    if (!FILE_URL_PATTERN.test(values.fileUrl.trim())) {
      setError('fileUrl', FORM_MESSAGES.invalidUrl);
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!FORM_API_AVAILABLE) {
      alert(FORM_MESSAGES.notAvailable);
      return;
    }
    const request: FormSaveRequest = {
      formNo: values.formNo.trim(),
      langCd: values.langCd as FormLang,
      useYn: values.useYn,
      formNm: values.formNm.trim(),
      fileUrl: values.fileUrl.trim(),
    };
    try {
      await saveForm.mutateAsync({ isCreate, request });
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.updated);
      onClose();
    } catch (error) {
      const handled = applyApiError(error, {
        [FORM_ERRORS.duplicate]: ['formNo', FORM_MESSAGES.duplicate],
        [FORM_ERRORS.invalidUrl]: ['fileUrl', FORM_MESSAGES.invalidUrl],
      });
      if (!handled) toast.error(errorMessage(error));
    }
  };

  const title = isCreate ? 'Register Form' : 'Edit Form';

  return (
    <SysFormModal
      width={1200}
      open
      title={title}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={canWrite ? handleSubmit : undefined}
      submitting={saveForm.isPending}
      onCancel={onClose}
    >
      <SysFieldGrid columns={3}>
        <SysField label="Form No." required error={errors.formNo}>
          <Input
            value={values.formNo}
            placeholder="e.g. 1000"
            maxLength={4}
            inputMode="numeric"
            disabled={!isCreate}
            onChange={(e) => patch('formNo', { formNo: e.target.value.replace(/\D/g, '') })}
          />
        </SysField>
        <SysField label="Language" required error={errors.langCd}>
          <Select<FormLang>
            value={values.langCd}
            placeholder="Select"
            options={LANG_OPTIONS}
            onChange={(langCd) => patch('langCd', { langCd })}
          />
        </SysField>
        <SysField label="Use" required error={errors.useYn}>
          <Radio.Group
            value={values.useYn}
            options={USE_YN_RADIO_OPTIONS}
            onChange={(e) => patch('useYn', { useYn: e.target.value as YesNo })}
          />
        </SysField>
        <SysField label="Form Name" required span="full" error={errors.formNm}>
          <Input
            value={values.formNm}
            maxLength={100}
            onChange={(e) => patch('formNm', { formNm: e.target.value })}
          />
        </SysField>
        <SysField label="File URL" required span="full" error={errors.fileUrl}>
          <Input
            value={values.fileUrl}
            placeholder="e.g. https://cdn.vamc.vn/form/1000_en.docx"
            maxLength={2000}
            onChange={(e) => patch('fileUrl', { fileUrl: e.target.value })}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
