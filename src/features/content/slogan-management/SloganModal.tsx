import { useState } from 'react';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import AppRadio from '@/components/inputs/AppRadio';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import type { SloganRequest } from '@/api/contents/site-display-api';
import type { PostDetail } from '@/api/contents/post-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/features/system/_shared/SysFormUi';
import { SysButton } from '@/features/system/_shared/SysListUi';
import { USE_YN_RADIO_OPTIONS } from '@/features/system/_shared/sys-constants';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { useDeleteSlogans, useSaveSlogan, useSlogan } from './use-slogans';
import styles from './slogan-management.module.scss';

// Slogan Management - Register / Edit popup (menu A07060300).
// Design rules kept: Slogan (VN) / (EN) textareas, required, max 100 characters and 2 lines, with a counter.

type FieldKey = 'positionId' | 'title' | 'titleEn';

interface SloganModalProps {
  /** null = register. */
  sloganId: string | null;
  canWrite: boolean;
  onClose: () => void;
}

interface FormState {
  useYn: 'Y' | 'N';
  positionId: string;
  title: string;
  titleEn: string;
  subSlogan: string;
  subSloganEn: string;
}

const NEW_FORM: FormState = {
  useYn: 'Y',
  positionId: 'MAIN_HERO',
  title: '',
  titleEn: '',
  subSlogan: '',
  subSloganEn: '',
};

const SLOGAN_MAX = 100;
const SLOGAN_MAX_LINES = 2;

const required = (label: string) => `${label} is required.`;

/** Keeps at most two lines (Enter starts the second line, a third one is dropped). */
const limitLines = (value: string) => value.split('\n').slice(0, SLOGAN_MAX_LINES).join('\n');

interface SloganTextProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

/** 2-line textarea with the "n / 100 characters" counter of the design. */
function SloganText({ value, disabled, onChange }: SloganTextProps) {
  return (
    <div className={styles.textBox}>
      <TextArea
        rows={SLOGAN_MAX_LINES}
        value={value}
        maxLength={SLOGAN_MAX}
        disabled={disabled}
        onChange={(e) => onChange(limitLines(e.target.value))}
      />
      <span className={styles.counter}>
        <strong>{value.length}</strong> / {SLOGAN_MAX} characters
      </span>
    </div>
  );
}

export default function SloganModal({ sloganId, canWrite, onClose }: SloganModalProps) {
  const isCreate = sloganId === null;
  const { toast, dialog } = useNotify();
  const { data: detail, isFetching } = useSlogan(sloganId);
  const saveSlogan = useSaveSlogan();
  const deleteSlogans = useDeleteSlogans();
  const { errors, setError, clearError, clearAll } = useFieldErrors<FieldKey>();

  const [form, setForm] = useState<FormState>(NEW_FORM);

  // Fill the form when the detail arrives — adjusted during render, not in an effect.
  const [loadedDetail, setLoadedDetail] = useState<PostDetail | undefined>(undefined);
  if (detail && detail !== loadedDetail) {
    setLoadedDetail(detail);
    setForm({
      useYn: detail.published === 'Y' ? 'Y' : 'N',
      positionId: detail.tag ?? 'MAIN_HERO',
      title: detail.title ?? '',
      titleEn: detail.titleEn ?? '',
      subSlogan: detail.content ?? '',
      subSloganEn: detail.contentEn ?? '',
    });
  }
  const disabled = !canWrite;

  const patch = (key: FieldKey | null, values: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...values }));
    if (key) clearError(key);
  };

  const validate = (): boolean => {
    clearAll();
    let valid = true;
    if (!form.positionId.trim()) {
      setError('positionId', required('Position'));
      valid = false;
    }
    if (!form.title.trim()) {
      setError('title', required('Slogan (VN)'));
      valid = false;
    }
    if (!form.titleEn.trim()) {
      setError('titleEn', required('Slogan (EN)'));
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const request: SloganRequest = {
      title: form.title.trim(),
      titleEn: form.titleEn.trim(),
      subSlogan: form.subSlogan.trim() || undefined,
      subSloganEn: form.subSloganEn.trim() || undefined,
      positionId: form.positionId.trim(),
      useYn: form.useYn,
    };
    try {
      await saveSlogan.mutateAsync({ sloganId, request });
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.updated);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const handleDelete = () => {
    if (!sloganId) return;
    dialog.confirm({
      content: 'Are you sure you want to delete?',
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteSlogans.mutateAsync([sloganId]);
          toast.success(SYS_MESSAGES.deleted);
          onClose();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  return (
    <SysFormModal
      open
      width={1200}
      title={isCreate ? 'Register Slogan' : 'Edit Slogan'}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={canWrite ? () => void handleSubmit() : undefined}
      submitting={saveSlogan.isPending}
      submitDisabled={isFetching}
      onCancel={onClose}
      notice="Line breaks entered with Enter are shown as is on the user home."
      leftActions={
        !isCreate &&
        canWrite && (
          <SysButton look="danger" loading={deleteSlogans.isPending} onClick={handleDelete}>
            Delete
          </SysButton>
        )
      }
    >
      <LoadingSpinner spinning={isFetching}>
        <SysFieldGrid columns={2}>
          <SysField label="Use" required>
            <AppRadio.Group
              value={form.useYn}
              options={USE_YN_RADIO_OPTIONS}
              disabled={disabled}
              onChange={(e) => patch(null, { useYn: e.target.value as 'Y' | 'N' })}
            />
          </SysField>
          <SysField label="Position" required error={errors.positionId}>
            <TextInput
              value={form.positionId}
              placeholder="e.g. MAIN_HERO, FOOTER, ABOUT"
              maxLength={100}
              disabled={disabled}
              onChange={(e) => patch('positionId', { positionId: e.target.value })}
            />
          </SysField>
          <SysField label="Slogan (VN)" required span="full" error={errors.title}>
            <SloganText value={form.title} disabled={disabled} onChange={(title) => patch('title', { title })} />
          </SysField>
          <SysField label="Slogan (EN)" required span="full" error={errors.titleEn}>
            <SloganText value={form.titleEn} disabled={disabled} onChange={(titleEn) => patch('titleEn', { titleEn })} />
          </SysField>
          <SysField label="Sub-slogan (VN)" span="full">
            <TextArea
              rows={2}
              value={form.subSlogan}
              maxLength={2000}
              disabled={disabled}
              onChange={(e) => patch(null, { subSlogan: e.target.value })}
            />
          </SysField>
          <SysField label="Sub-slogan (EN)" span="full">
            <TextArea
              rows={2}
              value={form.subSloganEn}
              maxLength={2000}
              disabled={disabled}
              onChange={(e) => patch(null, { subSloganEn: e.target.value })}
            />
          </SysField>
        </SysFieldGrid>
      </LoadingSpinner>
    </SysFormModal>
  );
}
