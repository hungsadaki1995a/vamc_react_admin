import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import type { AboutHistory, AboutHistoryRequest } from '@/api/contents/about-page-api';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { apiValidationErrors, errorMessage } from '@/utils/system-utils';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { useAboutHistory, useDeleteAboutHistory, useSaveAboutHistory } from './use-history';
import styles from './history-management.module.scss';

// History Management - Register / Edit popup (VPA071002P01).
// Register: [Cancel] [Register]; Edit: [Delete] [Cancel] [Edit]. Saved items apply to the user timeline at once.

const PERIOD_MAX = 30;
const CONTENT_MAX = 300;

function createHistorySchema(t: TFunction) {
  return z.object({
    year: z
      .string()
      .trim()
      .min(1, t('messages.content.history.yearRequired'))
      .regex(/^\d{4}$/, t('messages.content.history.yearFormat')),
    periodVn: z.string().trim().min(1, t('messages.content.history.periodVnRequired')).max(PERIOD_MAX),
    periodEn: z.string().trim().max(PERIOD_MAX),
    contentVn: z.string().trim().min(1, t('messages.content.history.contentVnRequired')).max(CONTENT_MAX),
    contentEn: z.string().trim().max(CONTENT_MAX),
  });
}

type HistoryFormValues = z.infer<ReturnType<typeof createHistorySchema>>;

const HISTORY_FIELDS: (keyof HistoryFormValues)[] = ['year', 'periodVn', 'periodEn', 'contentVn', 'contentEn'];

function toRequest(values: HistoryFormValues): AboutHistoryRequest {
  return {
    year: values.year,
    periodVn: values.periodVn,
    periodEn: values.periodEn || undefined,
    contentVn: values.contentVn,
    contentEn: values.contentEn || undefined,
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
  const { t } = useTranslation();
  const { data, isError } = useAboutHistory(pstNo);

  if (pstNo !== null && !data) {
    return (
      <SysFormModal width={1200} open title="Edit History" onCancel={onClose}>
        {isError ? <div>{t('messages.content.history.loadFailed')}</div> : null}
      </SysFormModal>
    );
  }
  return <HistoryForm item={data ?? null} canWrite={canWrite} onClose={onClose} />;
}

function HistoryForm({ item, canWrite, onClose }: { item: AboutHistory | null; canWrite: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const isCreate = item === null;
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const save = useSaveAboutHistory();
  const remove = useDeleteAboutHistory();
  const schema = useMemo(() => createHistorySchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<HistoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      year: item?.year ?? '',
      periodVn: item?.periodVn ?? '',
      periodEn: item?.periodEn ?? '',
      contentVn: item?.contentVn ?? '',
      contentEn: item?.contentEn ?? '',
    },
  });

  const [contentVn, contentEn] = useWatch({ control, name: ['contentVn', 'contentEn'] });

  const onValidSubmit = async (values: HistoryFormValues) => {
    try {
      await save.mutateAsync({ pstNo: item?.pstNo ?? null, request: toRequest(values) });
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.updated);
      onClose();
    } catch (error) {
      const validation = apiValidationErrors(error);
      if (validation) {
        let mapped = false;
        HISTORY_FIELDS.forEach((key) => {
          const message = validation[key];
          if (message) {
            setError(key, { type: 'server', message });
            mapped = true;
          }
        });
        if (mapped) return;
      }
      toast.error(errorMessage(error));
    }
  };

  const askDelete = () => {
    if (!item) return;
    confirm({
      content: t('messages.content.history.confirmDelete'),
      okText: t('common.delete'),
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

  const counter = (value = '') => (
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
      onSubmit={canWrite ? () => void handleSubmit(onValidSubmit)() : undefined}
      submitText={isCreate ? t('common.register') : t('common.edit')}
      submitDisabled={save.isPending || remove.isPending}
      leftActions={
        !isCreate && canWrite ? (
          <SysButton look="danger" disabled={remove.isPending || save.isPending} onClick={askDelete}>
            {t('common.delete')}
          </SysButton>
        ) : undefined
      }
    >
      <SysFieldGrid columns={1}>
        <SysField label="Year" required error={errors.year?.message}>
          <Controller
            name="year"
            control={control}
            render={({ field }) => (
              <TextInput
                aria-label="Year"
                value={field.value}
                maxLength={4}
                inputMode="numeric"
                placeholder="e.g. 2014"
                disabled={!canWrite}
                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                onBlur={field.onBlur}
              />
            )}
          />
        </SysField>
        <SysField label="Period Label (VN)" required error={errors.periodVn?.message}>
          <Controller
            name="periodVn"
            control={control}
            render={({ field }) => (
              <TextInput
                aria-label="Period Label (VN)"
                value={field.value}
                maxLength={PERIOD_MAX}
                placeholder="e.g. Năm 2013"
                disabled={!canWrite}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </SysField>
        <SysField label="Period Label (EN)" error={errors.periodEn?.message}>
          <Controller
            name="periodEn"
            control={control}
            render={({ field }) => (
              <TextInput
                aria-label="Period Label (EN)"
                value={field.value}
                maxLength={PERIOD_MAX}
                placeholder="e.g. 2013"
                disabled={!canWrite}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </SysField>
        <SysField label="Content (VN)" required error={errors.contentVn?.message} hint={counter(contentVn)}>
          <Controller
            name="contentVn"
            control={control}
            render={({ field }) => (
              <TextArea
                aria-label="Content (VN)"
                className={styles.content}
                rows={3}
                value={field.value}
                maxLength={CONTENT_MAX}
                disabled={!canWrite}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </SysField>
        <SysField label="Content (EN)" error={errors.contentEn?.message} hint={counter(contentEn)}>
          <Controller
            name="contentEn"
            control={control}
            render={({ field }) => (
              <TextArea
                aria-label="Content (EN)"
                className={styles.content}
                rows={3}
                value={field.value}
                maxLength={CONTENT_MAX}
                disabled={!canWrite}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
