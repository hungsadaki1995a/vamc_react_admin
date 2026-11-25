import { useState } from 'react';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import { ABOUT_PAGE_ERRORS } from '@/api/contents/about-page-api';
import type { AboutOrgChart } from '@/api/contents/about-page-api';
import { originalFileName, useUploadContentImage } from '@/features/content/_shared/use-content-files';
import { SysButton, SysPage, SysTitleBar } from '@/features/system/_shared/SysListUi';
import { SysField, SysFieldGrid } from '@/features/system/_shared/SysFormUi';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import RichTextEditor from '../_shared/RichTextEditor';
import { CHART_IMAGE_E03, isValidChartImage } from './chart-image';
import ChartImageField from './ChartImageField';
import { useAboutOrgChart, useImagePreviewUrl, useSaveAboutOrgChart } from './use-organization-chart';
import styles from './organization-chart-management.module.scss';

// Organization Chart Management (VPA07100101): chart images and body of user About > About VAMC >
// Organization Chart (VPW03010601). Image (VN) and Body (VN) are required; EN values fall back to VN there.

const TITLE = 'Organization Chart Management';
const BREADCRUMB = ['Content Management', 'About VAMC Management', TITLE];

type FieldKey = 'chartImageVnFileId' | 'chartImageEnFileId' | 'bodyVn' | 'bodyEn';
type ImageKey = 'chartImageVnFileId' | 'chartImageEnFileId';

interface ChartImage {
  fileId?: string;
  fileName?: string;
}

export default function OrganizationChartManagement() {
  const { data, isFetching, isError } = useAboutOrgChart();

  return (
    <SysPage>
      <SysTitleBar title={TITLE} breadcrumb={BREADCRUMB} />
      {data ? (
        <OrgChartForm key={data.pstNo ?? 'new'} chart={data} />
      ) : (
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? 'The organization chart could not be loaded.' : null}</div>
        </LoadingSpinner>
      )}
    </SysPage>
  );
}

function OrgChartForm({ chart }: { chart: AboutOrgChart }) {
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const save = useSaveAboutOrgChart();
  const upload = useUploadContentImage('ABOUT');
  const preview = useImagePreviewUrl();
  const { errors, setError, clearError, applyApiError } = useFieldErrors<FieldKey>();
  const [uploadingKey, setUploadingKey] = useState<ImageKey | null>(null);
  const [images, setImages] = useState<Record<ImageKey, ChartImage>>({
    chartImageVnFileId: {
      fileId: chart.chartImageVnFileId,
      fileName: chart.chartImageVn ? originalFileName(chart.chartImageVn.fileNm) : undefined,
    },
    chartImageEnFileId: {
      fileId: chart.chartImageEnFileId,
      fileName: chart.chartImageEn ? originalFileName(chart.chartImageEn.fileNm) : undefined,
    },
  });
  const [bodyVn, setBodyVn] = useState(chart.bodyVn ?? '');
  const [bodyEn, setBodyEn] = useState(chart.bodyEn ?? '');

  const uploadImage = async (key: ImageKey, file: File) => {
    if (!isValidChartImage(file)) {
      setError(key, CHART_IMAGE_E03);
      return;
    }
    clearError(key);
    setUploadingKey(key);
    try {
      const fileId = await upload.mutateAsync(file);
      setImages((prev) => ({ ...prev, [key]: { fileId, fileName: file.name } }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploadingKey(null);
    }
  };

  const openPreview = async (key: ImageKey) => {
    const fileId = images[key].fileId;
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

  const submit = async () => {
    let valid = true;
    if (!images.chartImageVnFileId.fileId) {
      setError('chartImageVnFileId', 'Organization Chart Image (VN) is required.');
      valid = false;
    }
    if (!bodyVn.trim()) {
      setError('bodyVn', 'Body (VN) is required.');
      valid = false;
    }
    if (!valid) return;
    try {
      await save.mutateAsync({
        chartImageVnFileId: images.chartImageVnFileId.fileId as string,
        chartImageEnFileId: images.chartImageEnFileId.fileId,
        bodyVn,
        bodyEn: bodyEn || undefined,
      });
      toast.success(SYS_MESSAGES.saved);
    } catch (error) {
      if (!applyApiError(error, { [ABOUT_PAGE_ERRORS.imageInvalid]: ['chartImageVnFileId', CHART_IMAGE_E03] })) {
        toast.error(errorMessage(error));
      }
    }
  };

  const imageField = (key: ImageKey, label: string) => (
    <ChartImageField
      ariaLabel={label}
      fileName={images[key].fileName}
      hasFile={!!images[key].fileId}
      disabled={!canWrite}
      uploading={uploadingKey === key}
      previewing={preview.isPending && preview.variables === images[key].fileId}
      onFile={(file) => uploadImage(key, file)}
      onPreview={() => openPreview(key)}
    />
  );

  return (
    <>
      <form className={styles.form} noValidate onSubmit={(e) => e.preventDefault()}>
        <SysFieldGrid columns={1} labelWidth={130}>
          <SysField label="Chart Image (VN)" required error={errors.chartImageVnFileId}>
            {imageField('chartImageVnFileId', 'Chart Image (VN)')}
          </SysField>
          <SysField label="Chart Image (EN)" error={errors.chartImageEnFileId}>
            {imageField('chartImageEnFileId', 'Chart Image (EN)')}
          </SysField>
          <SysField label="Body (VN)" required error={errors.bodyVn}>
            <RichTextEditor
              ariaLabel="Body (VN)"
              value={bodyVn}
              disabled={!canWrite}
              invalid={!!errors.bodyVn}
              onChange={(html) => {
                setBodyVn(html);
                clearError('bodyVn');
              }}
            />
          </SysField>
          <SysField label="Body (EN)" error={errors.bodyEn}>
            <RichTextEditor ariaLabel="Body (EN)" value={bodyEn} disabled={!canWrite} onChange={setBodyEn} />
          </SysField>
        </SysFieldGrid>
      </form>
      {canWrite && (
        <div className={styles.footer}>
          <SysButton look="primary" loading={save.isPending} onClick={submit}>
            Save
          </SysButton>
        </div>
      )}
    </>
  );
}
