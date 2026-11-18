import { useRef, useState } from 'react';
import { Input, Modal, Radio, Select } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { useScreenLabel } from '@/hooks/use-screen-label';
import { createForm, downloadFormFile, updateForm, uploadFormFile } from '@/api/sys/form-api';
import type { FormCategory, FormItem, FormLang } from '@/api/sys/form-api';
import { FormField } from '../_shared/sys-ui';
import { errorMessage } from '../_shared/sys-utils';
import styles from '../_shared/sys-page.module.css';

// Form Management - Register/Edit popup (VPA0040P01).
// The wireframe reserves this popup for a "Document Management Program" whose
// environment is still undecided; until then it is a plain form + file upload
// mapped to FORM_MNG. ⚠️ Backend API not implemented yet — see `@/api/sys/form-api`.

interface FormModalProps {
  /** null = register a new form. */
  form: FormItem | null;
  canWrite: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  formNo: string;
  langCd: FormLang;
  formNm: string;
  formSeCd: FormCategory;
  useYn: 'Y' | 'N';
}

/** Extensions the backend file whitelist accepts for documents. */
const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.hwp,.zip';

export default function FormModal({ form: editing, canWrite, onClose, onSaved }: FormModalProps) {
  const isCreate = editing === null;
  const { toast } = useNotify();
  const { tvt, tvb, tvh, tsm } = useScreenLabel();
  const fileInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    formNo: editing?.formNo ?? '',
    langCd: editing?.langCd ?? 'VN',
    formNm: editing?.formNm ?? '',
    formSeCd: editing?.formSeCd ?? 'APFR',
    useYn: editing?.useYn ?? 'N',
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const patch = (values: Partial<FormState>) => setForm((prev) => ({ ...prev, ...values }));
  const disabled = !canWrite;

  const handleConfirm = async () => {
    if (!form.formNo.trim() || !form.formNm.trim()) {
      toast.warning(tsm('required', 'Enter the form number and form name.'));
      return;
    }
    if (isCreate && !file) {
      toast.warning(tsm('fileRequired', 'Attach the form file.'));
      return;
    }
    setSaving(true);
    try {
      // Upload first; the form row then references the returned file group.
      const fileUnqId = file ? await uploadFormFile(file) : undefined;
      const request = { ...form, formNo: form.formNo.trim(), formNm: form.formNm.trim(), fileUnqId };
      const response = isCreate ? await createForm(request) : await updateForm(request);
      toast.success(response.message || tsm('saved', 'Saved.'));
      onSaved();
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!editing) return;
    try {
      await downloadFormFile(editing);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Modal
      open
      width={820}
      centered
      title={tvh('formModal', 'Register/Edit Form')}
      onCancel={onClose}
      maskClosable={false}
      footer={
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btn} onClick={onClose}>
            {tvb('cancel', 'Cancel')}
          </button>
          <button type="button" className={styles.btnDark} disabled={disabled || saving} onClick={handleConfirm}>
            {tvb('confirm', 'Confirm')}
          </button>
        </div>
      }
    >
      <div className={styles.formGrid} style={{ ['--form-cols' as string]: 2 }}>
        <FormField label={tvt('formNo', 'Form Number')} required>
          <Input
            value={form.formNo}
            maxLength={100}
            disabled={disabled || !isCreate}
            onChange={(e) => patch({ formNo: e.target.value })}
          />
        </FormField>
        <FormField label={tvt('langCd', 'Language')} required>
          <Select
            style={{ width: '100%' }}
            value={form.langCd}
            disabled={disabled || !isCreate}
            onChange={(langCd) => patch({ langCd })}
            options={[
              { value: 'VN', label: tvt('langVn', 'Vietnamese (VN)') },
              { value: 'EN', label: tvt('langEn', 'English (EN)') },
            ]}
          />
        </FormField>

        <FormField label={tvt('formSeCd', 'Category')} required>
          <Select
            style={{ width: '100%' }}
            value={form.formSeCd}
            disabled={disabled}
            onChange={(formSeCd) => patch({ formSeCd })}
            options={[
              { value: 'APFR', label: tvt('catApplication', 'Application Form') },
              { value: 'CTFR', label: tvt('catContract', 'Contract Agreement') },
              { value: 'STFR', label: tvt('catStatistics', 'Statistical Report') },
            ]}
          />
        </FormField>
        <FormField label={tvt('useYn', 'Use')}>
          <Radio.Group
            value={form.useYn}
            disabled={disabled}
            onChange={(e) => patch({ useYn: e.target.value as 'Y' | 'N' })}
            options={[
              { value: 'Y', label: 'Y' },
              { value: 'N', label: 'N' },
            ]}
          />
        </FormField>

        <FormField label={tvt('formNm', 'Form Name')} required span="full">
          <Input
            value={form.formNm}
            maxLength={300}
            disabled={disabled}
            onChange={(e) => patch({ formNm: e.target.value })}
          />
        </FormField>

        <FormField label={tvt('file', 'File')} required={isCreate} span="full">
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSmall}`}
            disabled={disabled}
            onClick={() => fileInput.current?.click()}
          >
            {tvb('chooseFile', 'Choose File')}
          </button>
          {file ? (
            <span>{file.name}</span>
          ) : editing?.fileNm ? (
            <a className={styles.cellLink} onClick={handleDownload}>
              {editing.fileNm}
            </a>
          ) : (
            <span className={styles.textMuted}>{tvt('noFile', 'No file selected')}</span>
          )}
        </FormField>
      </div>
    </Modal>
  );
}
