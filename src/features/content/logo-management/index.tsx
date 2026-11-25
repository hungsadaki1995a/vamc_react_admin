import { useState } from 'react';
import { FileImageOutlined } from '@ant-design/icons';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import { SITE_DISPLAY_ERRORS } from '@/api/contents/site-display-api';
import type { LogoSetting } from '@/api/contents/site-display-api';
import { SysButton, SysPage, SysTitleBar } from '@/features/system/_shared/SysListUi';
import { SysField, SysFieldGrid } from '@/features/system/_shared/SysFormUi';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
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

const LOGO_MESSAGES = {
  /** E01 */
  required: 'Logo File is required.',
  /** E03 */
  invalidImage: 'Only PNG, SVG files of 2MB or less can be uploaded.',
  loadFailed: 'The logo could not be loaded.',
} as const;

export default function LogoManagement() {
  const { data, isFetching, isError } = useCurrentLogo();

  return (
    <SysPage>
      <SysTitleBar title={TITLE} breadcrumb={BREADCRUMB} />
      {data ? (
        <LogoForm key={data.logoId ?? 'new'} logo={data} />
      ) : (
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? LOGO_MESSAGES.loadFailed : null}</div>
        </LoadingSpinner>
      )}
    </SysPage>
  );
}

function LogoForm({ logo }: { logo: LogoSetting }) {
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const save = useSaveLogo();
  const upload = useUploadLogoImage();
  const { errors, setError, clearError, applyApiError } = useFieldErrors<'imageFileId'>();
  const [imageFileId, setImageFileId] = useState(logo.imageFileId);
  const preview = useAttachmentPreview(imageFileId);

  const submit = async () => {
    if (!imageFileId) {
      setError('imageFileId', LOGO_MESSAGES.required);
      return;
    }
    try {
      await save.mutateAsync(imageFileId);
      toast.success(SYS_MESSAGES.saved);
    } catch (e) {
      if (!applyApiError(e, { [SITE_DISPLAY_ERRORS.logoImageInvalid]: ['imageFileId', LOGO_MESSAGES.invalidImage] })) {
        toast.error(errorMessage(e));
      }
    }
  };

  return (
    <>
      <form noValidate onSubmit={(e) => e.preventDefault()}>
        <SysFieldGrid columns={1}>
          <SysField label="Current Logo">
            <div className={styles.preview}>
              {preview ? (
                <img src={preview} alt="VAMC Logo" className={styles.previewImage} />
              ) : (
                <span className={styles.previewEmpty}>
                  <FileImageOutlined className={styles.previewIcon} />
                  VAMC Logo
                </span>
              )}
            </div>
          </SysField>
          <SysField label="Logo File" required error={errors.imageFileId}>
            <ImageUploadField
              fileUnqId={imageFileId}
              initialFileName={logo.imageFileName}
              extensions={LOGO_EXTENSIONS}
              maxBytes={LOGO_MAX_BYTES}
              invalidMessage={LOGO_MESSAGES.invalidImage}
              disabled={!canWrite}
              upload={upload.mutateAsync}
              uploading={upload.isPending}
              onUploaded={(id) => {
                setImageFileId(id);
                clearError('imageFileId');
              }}
              onError={(message) => setError('imageFileId', message)}
            />
          </SysField>
        </SysFieldGrid>
      </form>
      {canWrite && (
        <div className={styles.footer}>
          <SysButton look="primary" loading={save.isPending} disabled={upload.isPending} onClick={submit}>
            Save
          </SysButton>
        </div>
      )}
    </>
  );
}
