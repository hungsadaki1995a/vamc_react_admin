import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fileX } from '@/assets/images';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import { SITE_DISPLAY_ERRORS } from '@/api/contents/site-display-api';
import type { LogoSetting } from '@/api/contents/site-display-api';
import { SysButton, SysPage, SysTitleBar } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid } from '@/components/common/sys-ui/SysFormUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { apiErrorCode, apiValidationErrors, errorMessage } from '@/utils/system-utils';
import { useAttachmentPreview } from '../_shared/use-content-files';
import ImageUploadField from '../banner-management/ImageUploadField';
import { useCurrentLogo, useSaveLogo, useUploadLogoImage } from './use-logos';
import styles from './logo-management.module.scss';

// Logo Management (VPA07060201), menu A07060200: the user header logo.
// Design: "Current Logo" preview + "Logo File*" (PNG / SVG, max 2MB, recommended 300 × 88) + [Save] (applied at once).

const TITLE = 'Logo Management';
const BREADCRUMB = ['Content Management', 'Site Display Management', TITLE];

const LOGO_EXTENSIONS = ['png', 'svg'];
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

function createLogoSchema(t: TFunction) {
  return z.object({
    imageFileId: z.string().min(1, t('messages.content.logo.required')),
  });
}

type LogoFormValues = z.infer<ReturnType<typeof createLogoSchema>>;

export default function LogoManagement() {
  const { t } = useTranslation();
  const { data, isFetching, isError } = useCurrentLogo();

  return (
    <SysPage>
      <SysTitleBar title={TITLE} breadcrumb={BREADCRUMB} />
      {data ? (
        <LogoForm key={data.logoId ?? 'new'} logo={data} />
      ) : (
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? t('messages.content.logo.loadFailed') : null}</div>
        </LoadingSpinner>
      )}
    </SysPage>
  );
}

function LogoForm({ logo }: { logo: LogoSetting }) {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const save = useSaveLogo();
  const upload = useUploadLogoImage();
  const schema = useMemo(() => createLogoSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LogoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      imageFileId: logo.imageFileId ?? '',
    },
  });

  const imageFileId = useWatch({ control, name: 'imageFileId' });
  const preview = useAttachmentPreview(imageFileId);

  const onValidSubmit = async (values: LogoFormValues) => {
    try {
      await save.mutateAsync(values.imageFileId);
      toast.success(SYS_MESSAGES.saved);
    } catch (e) {
      if (apiErrorCode(e) === SITE_DISPLAY_ERRORS.logoImageInvalid) {
        setError('imageFileId', { type: 'server', message: t('messages.content.logo.invalidImage') });
        return;
      }
      const validation = apiValidationErrors(e);
      if (validation?.imageFileId) {
        setError('imageFileId', { type: 'server', message: validation.imageFileId });
        return;
      }
      toast.error(errorMessage(e));
    }
  };

  return (
    <form noValidate onSubmit={(e) => e.preventDefault()}>
      <SysFieldGrid columns={1}>
        <SysField label="Current Logo">
          <div className={styles.preview} data-empty={preview ? undefined : true}>
            {preview ? (
              <img src={preview} alt={t('messages.content.logo.emptyPreview')} className={styles.previewImage} />
            ) : (
              <span className={styles.previewEmpty}>
                <img src={fileX} alt="" className={styles.previewIcon} />
                {t('messages.content.logo.emptyPreview')}
              </span>
            )}
          </div>
        </SysField>
        <SysField label="Logo File" required error={errors.imageFileId?.message}>
          <Controller
            name="imageFileId"
            control={control}
            render={({ field }) => (
              <ImageUploadField
                fileUnqId={field.value}
                initialFileName={logo.imageFileName}
                extensions={LOGO_EXTENSIONS}
                maxBytes={LOGO_MAX_BYTES}
                invalidMessage={t('messages.content.logo.invalidImage')}
                disabled={!canWrite}
                upload={upload.mutateAsync}
                uploading={upload.isPending}
                onUploaded={(id) => {
                  field.onChange(id);
                  clearErrors('imageFileId');
                }}
                onError={(message) => setError('imageFileId', { type: 'manual', message })}
              />
            )}
          />
        </SysField>
      </SysFieldGrid>
      {canWrite && (
        <div className={styles.footer}>
          <SysButton
            look="primary"
            loading={save.isPending}
            disabled={upload.isPending}
            onClick={() => void handleSubmit(onValidSubmit)()}
          >
            {t('messages.dialog.save')}
          </SysButton>
        </div>
      )}
    </form>
  );
}
