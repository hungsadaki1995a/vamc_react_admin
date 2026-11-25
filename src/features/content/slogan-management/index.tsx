import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import TextArea from '@/components/inputs/TextArea';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import type { SloganSetting } from '@/api/contents/site-display-api';
import { SysButton, SysPage, SysTitleBar } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid } from '@/components/common/sys-ui/SysFormUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { apiValidationErrors, errorMessage } from '@/utils/system-utils';
import { useCurrentSlogan, useSaveSlogan } from './use-slogans';
import styles from './slogan-management.module.scss';

// Slogan Management (VPA07060301), menu A07060300: the user home hero text.
// Design: Slogan (VN)* / (EN)* textareas, max 100 characters and 2 lines each, counter, [Save] (applied at once).

const TITLE = 'Slogan Management';
const BREADCRUMB = ['Content Management', 'Site Display Management', TITLE];

const SLOGAN_MAX = 100;
const SLOGAN_MAX_LINES = 2;

type SloganFieldKey = 'sloganVi' | 'sloganEn';

const LABELS: Record<SloganFieldKey, string> = { sloganVi: 'Slogan (VN)', sloganEn: 'Slogan (EN)' };

/** Keeps at most two lines (Enter starts the second line, a third one is dropped). */
const limitLines = (value: string) => value.split('\n').slice(0, SLOGAN_MAX_LINES).join('\n');

function createSloganSchema(t: TFunction) {
  const required = (label: string) => t('messages.sys.fieldRequired', { label });
  return z.object({
    sloganVi: z.string().trim().min(1, required(LABELS.sloganVi)).max(SLOGAN_MAX),
    sloganEn: z.string().trim().min(1, required(LABELS.sloganEn)).max(SLOGAN_MAX),
  });
}

type SloganFormValues = z.infer<ReturnType<typeof createSloganSchema>>;

export default function SloganManagement() {
  const { t } = useTranslation();
  const { data, isFetching, isError } = useCurrentSlogan();

  return (
    <SysPage>
      <SysTitleBar title={TITLE} breadcrumb={BREADCRUMB} />
      {data ? (
        <SloganForm key={data.sloganId ?? 'new'} slogan={data} />
      ) : (
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? t('messages.content.slogan.loadFailed') : null}</div>
        </LoadingSpinner>
      )}
    </SysPage>
  );
}

function SloganForm({ slogan }: { slogan: SloganSetting }) {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const save = useSaveSlogan();
  const schema = useMemo(() => createSloganSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SloganFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sloganVi: slogan.sloganVi ?? '',
      sloganEn: slogan.sloganEn ?? '',
    },
  });

  const onValidSubmit = async (values: SloganFormValues) => {
    try {
      await save.mutateAsync({ sloganVi: values.sloganVi, sloganEn: values.sloganEn });
      toast.success(SYS_MESSAGES.saved);
    } catch (e) {
      const validation = apiValidationErrors(e);
      if (validation) {
        let mapped = false;
        (['sloganVi', 'sloganEn'] as const).forEach((key) => {
          const message = validation[key];
          if (message) {
            setError(key, { type: 'server', message });
            mapped = true;
          }
        });
        if (mapped) return;
      }
      toast.error(errorMessage(e));
    }
  };

  const textField = (key: SloganFieldKey) => (
    <SysField label={LABELS[key]} required error={errors[key]?.message}>
      <Controller
        name={key}
        control={control}
        render={({ field }) => (
          <div className={styles.textBox}>
            <TextArea
              aria-label={LABELS[key]}
              rows={SLOGAN_MAX_LINES + 1}
              value={field.value}
              maxLength={SLOGAN_MAX}
              disabled={!canWrite}
              status={errors[key] ? 'error' : undefined}
              onChange={(e) => field.onChange(limitLines(e.target.value))}
              onBlur={field.onBlur}
            />
            <span className={styles.counter}>
              <strong>{field.value.length}</strong> / {SLOGAN_MAX} characters
            </span>
          </div>
        )}
      />
    </SysField>
  );

  return (
    <form noValidate onSubmit={(e) => e.preventDefault()}>
      <SysFieldGrid columns={1}>
        {textField('sloganVi')}
        {textField('sloganEn')}
      </SysFieldGrid>
      {canWrite && (
        <div className={styles.footer}>
          <SysButton look="primary" loading={save.isPending} onClick={() => void handleSubmit(onValidSubmit)()}>
            {t('messages.dialog.save')}
          </SysButton>
        </div>
      )}
    </form>
  );
}
