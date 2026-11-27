import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import type { AboutOverview } from '@/api/contents/about-page-api';
import { SysButton, SysPage, SysTitleBar } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid } from '@/components/common/sys-ui/SysFormUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { apiValidationErrors, errorMessage } from '@/utils/system-utils';
import RichTextEditor from '../_shared/RichTextEditor';
import { useAboutOverview, useSaveAboutOverview } from './use-overview';
import styles from './overview-management.module.scss';

// Overview Management (VPA07100401): body of user About > About VAMC > Overview (VPW03010201).
// Saved content applies to the user screen immediately; Body (EN) falls back to Body (VN) there.

const TITLE = 'Overview Management';
const BREADCRUMB = ['Content Management', 'About VAMC Management', TITLE];

function createOverviewSchema(t: TFunction) {
  return z.object({
    bodyVn: z.string().trim().min(1, t('messages.content.overview.bodyVnRequired')),
    bodyEn: z.string(),
  });
}

type OverviewFormValues = z.infer<ReturnType<typeof createOverviewSchema>>;

export default function OverviewManagement() {
  const { t } = useTranslation();
  const { data, isError } = useAboutOverview();

  return (
    <SysPage>
      <SysTitleBar title={TITLE} breadcrumb={BREADCRUMB} />
      {data ? (
        <OverviewForm key={data.pstNo ?? 'new'} overview={data} />
      ) : isError ? (
        <div>{t('messages.content.overview.loadFailed')}</div>
      ) : null}
    </SysPage>
  );
}

function OverviewForm({ overview }: { overview: AboutOverview }) {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const save = useSaveAboutOverview();
  const schema = useMemo(() => createOverviewSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OverviewFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bodyVn: overview.bodyVn ?? '',
      bodyEn: overview.bodyEn ?? '',
    },
  });

  const onValidSubmit = async (values: OverviewFormValues) => {
    try {
      await save.mutateAsync({
        bodyVn: values.bodyVn,
        bodyEn: values.bodyEn || undefined,
      });
      toast.success(SYS_MESSAGES.saved);
    } catch (error) {
      const validation = apiValidationErrors(error);
      if (validation) {
        let mapped = false;
        (['bodyVn', 'bodyEn'] as const).forEach((key) => {
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

  return (
    <form className={styles.form} noValidate onSubmit={(e) => e.preventDefault()}>
      <SysFieldGrid columns={1}>
        <SysField label="Body (VN)" required error={errors.bodyVn?.message}>
          <Controller
            name="bodyVn"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                ariaLabel="Body (VN)"
                value={field.value}
                disabled={!canWrite}
                invalid={!!errors.bodyVn}
                onChange={field.onChange}
              />
            )}
          />
        </SysField>
        <SysField label="Body (EN)" error={errors.bodyEn?.message}>
          <Controller
            name="bodyEn"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                ariaLabel="Body (EN)"
                value={field.value}
                disabled={!canWrite}
                invalid={!!errors.bodyEn}
                onChange={field.onChange}
              />
            )}
          />
        </SysField>
      </SysFieldGrid>
      {canWrite && (
        <div className={styles.footer}>
          <SysButton look="primary" disabled={save.isPending} onClick={() => void handleSubmit(onValidSubmit)()}>
            {t('common.save')}
          </SysButton>
        </div>
      )}
    </form>
  );
}
