import { useState } from 'react';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import type { AboutHistory, AboutHistoryRequest } from '@/api/contents/about-page-api';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { SYS_DIALOG_LABELS, SYS_MESSAGES } from '@/config/sys-messages';
import { errorMessage } from '@/utils/system-utils';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { useAboutHistory, useDeleteAboutHistory, useSaveAboutHistory } from './use-history';
import styles from './history-management.module.scss';

// History Management - Register / Edit popup (VPA071002P01).
// Register: [Cancel] [Register]; Edit: [Delete] [Cancel] [Edit]. Saved items apply to the user timeline at once.

type FieldKey = 'year' | 'periodVn' | 'periodEn' | 'contentVn' | 'contentEn';
type FormState = Record<FieldKey, string>;

const EMPTY: FormState = { year: '', periodVn: '', periodEn: '', contentVn: '', contentEn: '' };
const PERIOD_MAX = 30;
const CONTENT_MAX = 300;

/** E01 texts: "{Field name} is required." */
const REQUIRED: Partial<Record<FieldKey, string>> = {
  year: 'Year is required.',
  periodVn: 'Period Label (VN) is required.',
  contentVn: 'Content (VN) is required.',
};
const YEAR_FORMAT = 'Enter the year as 4 digits.';
/** C01 */
const CONFIRM_DELETE = 'Are you sure you want to delete?';

function toState(item: AboutHistory): FormState {
  return {
    year: item.year ?? '',
    periodVn: item.periodVn ?? '',
    periodEn: item.periodEn ?? '',
    contentVn: item.contentVn ?? '',
    contentEn: item.contentEn ?? '',
  };
}

function toRequest(values: FormState): AboutHistoryRequest {
  return {
    year: values.year.trim(),
    periodVn: values.periodVn.trim(),
    periodEn: values.periodEn.trim() || undefined,
    contentVn: values.contentVn.trim(),
    contentEn: values.contentEn.trim() || undefined,
  };
}

interface HistoryModalProps {
  /** null = register. */
  pstNo: string | null;
  canWrite: boolean;
  onClose: () => void;
}

/** Loads the item in edit mode, then mounts the form with it. */
export default function HistoryModal({ pstNo, canWrite, onClose }: HistoryModalProps) {
  const { data, isFetching, isError } = useAboutHistory(pstNo);

  if (pstNo !== null && !data) {
    return (
      <SysFormModal width={1200} open title="Edit History" onCancel={onClose}>
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? 'The history item could not be loaded.' : null}</div>
        </LoadingSpinner>
      </SysFormModal>
    );
  }
  return <HistoryForm item={data ?? null} canWrite={canWrite} onClose={onClose} />;
}

function HistoryForm({ item, canWrite, onClose }: { item: AboutHistory | null; canWrite: boolean; onClose: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const save = useSaveAboutHistory();
  const remove = useDeleteAboutHistory();
  const { errors, setError, clearError, clearAll, applyApiError } = useFieldErrors<FieldKey>();
  const [values, setValues] = useState<FormState>(() => (item ? toState(item) : EMPTY));

  const patch = (key: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const validate = (): boolean => {
    clearAll();
    let valid = true;
    (Object.keys(REQUIRED) as FieldKey[]).forEach((key) => {
      if (!values[key].trim()) {
        setError(key, REQUIRED[key] as string);
        valid = false;
      }
    });
    if (values.year.trim() && !/^\d{4}$/.test(values.year.trim())) {
      setError('year', YEAR_FORMAT);
      valid = false;
    }
    return valid;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      await save.mutateAsync({ pstNo: item?.pstNo ?? null, request: toRequest(values) });
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.updated);
      onClose();
    } catch (error) {
      if (!applyApiError(error)) toast.error(errorMessage(error));
    }
  };

  const askDelete = () => {
    if (!item) return;
    confirm({
      content: CONFIRM_DELETE,
      okText: SYS_DIALOG_LABELS.delete,
      danger: true,
      onOk: async () => {
        try {
          await remove.mutateAsync(item.pstNo);
          toast.success(SYS_MESSAGES.deleted);
          onClose();
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });
  };

  const counter = (value: string) => (
    <span className={styles.counter}>
      {value.length} / {CONTENT_MAX} characters
    </span>
  );

  const title = isCreate ? 'Register History' : 'Edit History';

  return (
    <SysFormModal
      width={1200}
      open
      title={title}
      onCancel={onClose}
      onSubmit={canWrite ? submit : undefined}
      submitText={isCreate ? 'Register' : 'Edit'}
      submitting={save.isPending}
      leftActions={
        !isCreate && canWrite ? (
          <SysButton look="danger" loading={remove.isPending} onClick={askDelete}>
            Delete
          </SysButton>
        ) : undefined
      }
    >
      <SysFieldGrid columns={1}>
        <SysField label="Year" required error={errors.year}>
          <TextInput
            aria-label="Year"
            value={values.year}
            maxLength={4}
            inputMode="numeric"
            placeholder="e.g. 2014"
            disabled={!canWrite}
            onChange={(e) => patch('year', e.target.value.replace(/\D/g, ''))}
          />
        </SysField>
        <SysField label="Period Label (VN)" required error={errors.periodVn}>
          <TextInput
            aria-label="Period Label (VN)"
            value={values.periodVn}
            maxLength={PERIOD_MAX}
            placeholder="e.g. Năm 2013"
            disabled={!canWrite}
            onChange={(e) => patch('periodVn', e.target.value)}
          />
        </SysField>
        <SysField label="Period Label (EN)" error={errors.periodEn}>
          <TextInput
            aria-label="Period Label (EN)"
            value={values.periodEn}
            maxLength={PERIOD_MAX}
            placeholder="e.g. 2013"
            disabled={!canWrite}
            onChange={(e) => patch('periodEn', e.target.value)}
          />
        </SysField>
        <SysField label="Content (VN)" required error={errors.contentVn} hint={counter(values.contentVn)}>
          <TextArea
            aria-label="Content (VN)"
            className={styles.content}
            rows={3}
            value={values.contentVn}
            maxLength={CONTENT_MAX}
            disabled={!canWrite}
            onChange={(e) => patch('contentVn', e.target.value)}
          />
        </SysField>
        <SysField label="Content (EN)" error={errors.contentEn} hint={counter(values.contentEn)}>
          <TextArea
            aria-label="Content (EN)"
            className={styles.content}
            rows={3}
            value={values.contentEn}
            maxLength={CONTENT_MAX}
            disabled={!canWrite}
            onChange={(e) => patch('contentEn', e.target.value)}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
