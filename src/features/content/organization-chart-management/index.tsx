import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import { ABOUT_PAGE_ERRORS } from '@/api/contents/about-page-api';
import type { AboutOrgChart } from '@/api/contents/about-page-api';
import { originalFileName, useUploadContentImage } from '@/features/content/_shared/use-content-files';
import { SysButton, SysPage, SysTitleBar } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid } from '@/components/common/sys-ui/SysFormUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { apiErrorCode, apiValidationErrors, errorMessage } from '@/utils/system-utils';
import RichTextEditor from '../_shared/RichTextEditor';
import { isValidChartImage } from './chart-image';
import ChartImageField from './ChartImageField';
import { useAboutOrgChart, useImagePreviewUrl, useSaveAboutOrgChart } from './use-organization-chart';
import styles from './organization-chart-management.module.scss';

// Organization Chart Management (VPA07100101): chart images and body of user About > About VAMC >
// Organization Chart (VPW03010601). Image (VN) and Body (VN) are required; EN values fall back to VN there.

const TITLE = 'Organization Chart Management';
const BREADCRUMB = ['Content Management', 'About VAMC Management', TITLE];

type ImageKey = 'chartImageVnFileId' | 'chartImageEnFileId';

function createOrgChartSchema(t: TFunction) {
  return z.object({
    chartImageVnFileId: z.string().min(1, t('messages.content.orgChart.imageVnRequired')),
    chartImageEnFileId: z.string(),
    bodyVn: z.string().trim().min(1, t('messages.content.orgChart.bodyVnRequired')),
    bodyEn: z.string(),
  });
}

type OrgChartFormValues = z.infer<ReturnType<typeof createOrgChartSchema>>;

export default function OrganizationChartManagement() {
  const { t } = useTranslation();
  const { data, isError } = useAboutOrgChart();

  return (
    <SysPage>
      <SysTitleBar title={TITLE} breadcrumb={BREADCRUMB} />
      {data ? (
        <OrgChartForm key={data.pstNo ?? 'new'} chart={data} />
      ) : isError ? (
        <div>{t('messages.content.orgChart.loadFailed')}</div>
      ) : null}
    </SysPage>
  );
}

function OrgChartForm({ chart }: { chart: AboutOrgChart }) {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const save = useSaveAboutOrgChart();
  const upload = useUploadContentImage('ABOUT');
  const preview = useImagePreviewUrl();
  const schema = useMemo(() => createOrgChartSchema(t), [t]);
  const [fileNames, setFileNames] = useState<Record<ImageKey, string>>({
    chartImageVnFileId: chart.chartImageVn ? originalFileName(chart.chartImageVn.fileNm) : '',
    chartImageEnFileId: chart.chartImageEn ? originalFileName(chart.chartImageEn.fileNm) : '',
  });

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
  } = useForm<OrgChartFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      chartImageVnFileId: chart.chartImageVnFileId ?? '',
      chartImageEnFileId: chart.chartImageEnFileId ?? '',
      bodyVn: chart.bodyVn ?? '',
      bodyEn: chart.bodyEn ?? '',
    },
  });

  const uploadImage = async (key: ImageKey, file: File) => {
    if (!isValidChartImage(file)) {
      setError(key, { type: 'manual', message: t('messages.content.orgChart.invalidImage') });
      return;
    }
    clearErrors(key);
    try {
      const fileId = await upload.mutateAsync(file);
      setValue(key, fileId, { shouldDirty: true, shouldValidate: true });
      setFileNames((prev) => ({ ...prev, [key]: file.name }));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const openPreview = async (key: ImageKey) => {
    const fileId = getValues(key);
    if (!fileId) return;
    // Open the window in the click handler so the popup is not blocked, then load the image
    const win = window.open('', '_blank');
    try {
      const url = await preview.mutateAsync(fileId);
      if (win) win.location.href = url;
    } catch (error) {
      win?.close();
      toast.error(errorMessage(error));
    }
  };

  const onValidSubmit = async (values: OrgChartFormValues) => {
    try {
      await save.mutateAsync({
        chartImageVnFileId: values.chartImageVnFileId,
        chartImageEnFileId: values.chartImageEnFileId || undefined,
        bodyVn: values.bodyVn,
        bodyEn: values.bodyEn || undefined,
      });
      toast.success(SYS_MESSAGES.saved);
    } catch (error) {
      if (apiErrorCode(error) === ABOUT_PAGE_ERRORS.imageInvalid) {
        setError('chartImageVnFileId', { type: 'server', message: t('messages.content.orgChart.invalidImage') });
        return;
      }
      const validation = apiValidationErrors(error);
      if (validation) {
        let mapped = false;
        (['chartImageVnFileId', 'chartImageEnFileId', 'bodyVn', 'bodyEn'] as const).forEach((key) => {
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

  const imageField = (key: ImageKey, label: string) => (
    <Controller
      name={key}
      control={control}
      render={({ field }) => (
        <ChartImageField
          ariaLabel={label}
          fileName={fileNames[key]}
          hasFile={!!field.value}
          disabled={!canWrite}
          uploading={upload.isPending}
          previewing={preview.isPending}
          onFile={(file) => void uploadImage(key, file)}
          onPreview={() => void openPreview(key)}
        />
      )}
    />
  );

  return (
    <form className={styles.form} noValidate onSubmit={(e) => e.preventDefault()}>
      <SysFieldGrid columns={1} labelWidth={130}>
        <SysField label="Chart Image (VN)" required error={errors.chartImageVnFileId?.message}>
          {imageField('chartImageVnFileId', 'Chart Image (VN)')}
        </SysField>
        <SysField label="Chart Image (EN)" error={errors.chartImageEnFileId?.message}>
          {imageField('chartImageEnFileId', 'Chart Image (EN)')}
        </SysField>
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
          <SysButton
            look="primary"
            disabled={save.isPending || upload.isPending}
            onClick={() => void handleSubmit(onValidSubmit)()}
          >
            {t('common.save')}
          </SysButton>
        </div>
      )}
    </form>
  );
}
