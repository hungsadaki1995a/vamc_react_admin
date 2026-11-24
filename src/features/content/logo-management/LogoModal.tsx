import { useState } from 'react';
import { FileImageOutlined } from '@ant-design/icons';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import AppRadio from '@/components/inputs/AppRadio';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import type { LogoRequest } from '@/api/contents/site-display-api';
import type { PostDetail } from '@/api/contents/post-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/features/system/_shared/SysFormUi';
import { SysButton } from '@/features/system/_shared/SysListUi';
import { USE_YN_RADIO_OPTIONS } from '@/features/system/_shared/sys-constants';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { useAttachmentPreview } from '../_shared/use-content-files';
import ImageUploadField from '../banner-management/ImageUploadField';
import { useDeleteLogos, useLogo, useSaveLogo, useUploadLogoImage } from './use-logos';
import styles from './logo-management.module.scss';

// Logo Management - Register / Edit popup (menu A07060200).
// Design rules kept: Logo File PNG / SVG, max 2MB (E03), "Current Logo" preview, [Delete] | [Cancel] [Register / Edit].

type FieldKey = 'positionId' | 'title' | 'imageFileId' | 'linkUrl';

interface LogoModalProps {
  /** null = register. */
  logoId: string | null;
  canWrite: boolean;
  onClose: () => void;
}

interface FormState {
  useYn: 'Y' | 'N';
  positionId: string;
  title: string;
  titleEn: string;
  linkUrl: string;
  description: string;
  descriptionEn: string;
  imageFileId?: string;
}

const NEW_FORM: FormState = {
  useYn: 'Y',
  positionId: 'HEADER',
  title: '',
  titleEn: '',
  linkUrl: '',
  description: '',
  descriptionEn: '',
};

const URL_PATTERN = /^(https?:\/\/.+|\/.*)/;
const LOGO_EXTENSIONS = ['png', 'svg'];
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

const LOGO_MESSAGES = {
  /** E03 */
  invalidImage: 'Only PNG, SVG files of 2MB or less can be uploaded.',
  invalidUrl: 'The link URL must start with http://, https:// or /.',
  /** C01 */
  confirmDelete: 'Are you sure you want to delete?',
  fileHint: 'PNG, SVG, max 2MB, recommended 300 × 88px.',
} as const;

const required = (label: string) => `${label} is required.`;

export default function LogoModal({ logoId, canWrite, onClose }: LogoModalProps) {
  const isCreate = logoId === null;
  const { toast, dialog } = useNotify();
  const { data: detail, isFetching } = useLogo(logoId);
  const saveLogo = useSaveLogo();
  const deleteLogos = useDeleteLogos();
  const uploadImage = useUploadLogoImage();
  const { errors, setError, clearError, clearAll } = useFieldErrors<FieldKey>();

  const [form, setForm] = useState<FormState>(NEW_FORM);

  // Fill the form when the detail arrives — adjusted during render, not in an effect.
  const [loadedDetail, setLoadedDetail] = useState<PostDetail | undefined>(undefined);
  if (detail && detail !== loadedDetail) {
    setLoadedDetail(detail);
    setForm({
      useYn: detail.published === 'Y' ? 'Y' : 'N',
      positionId: detail.tag ?? 'HEADER',
      title: detail.title ?? '',
      titleEn: detail.titleEn ?? '',
      linkUrl: detail.summary ?? '',
      description: detail.content ?? '',
      descriptionEn: detail.contentEn ?? '',
      imageFileId: detail.thumbnailFileId,
    });
  }
  const preview = useAttachmentPreview(form.imageFileId);
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
      setError('title', required('Logo Name (VN)'));
      valid = false;
    }
    if (!form.imageFileId) {
      setError('imageFileId', required('Logo File'));
      valid = false;
    }
    if (form.linkUrl.trim() && !URL_PATTERN.test(form.linkUrl.trim())) {
      setError('linkUrl', LOGO_MESSAGES.invalidUrl);
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const request: LogoRequest = {
      title: form.title.trim(),
      titleEn: form.titleEn.trim() || undefined,
      positionId: form.positionId.trim(),
      imageFileId: form.imageFileId as string,
      linkUrl: form.linkUrl.trim() || undefined,
      description: form.description.trim() || undefined,
      descriptionEn: form.descriptionEn.trim() || undefined,
      useYn: form.useYn,
    };
    try {
      await saveLogo.mutateAsync({ logoId, request });
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.updated);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const handleDelete = () => {
    if (!logoId) return;
    dialog.confirm({
      content: LOGO_MESSAGES.confirmDelete,
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteLogos.mutateAsync([logoId]);
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
      title={isCreate ? 'Register Logo' : 'Edit Logo'}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={canWrite ? () => void handleSubmit() : undefined}
      submitting={saveLogo.isPending}
      submitDisabled={isFetching || uploadImage.isPending}
      onCancel={onClose}
      notice={LOGO_MESSAGES.fileHint}
      leftActions={
        !isCreate &&
        canWrite && (
          <SysButton look="danger" loading={deleteLogos.isPending} onClick={handleDelete}>
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
              placeholder="e.g. HEADER, FOOTER, FAVICON"
              maxLength={100}
              disabled={disabled}
              onChange={(e) => patch('positionId', { positionId: e.target.value })}
            />
          </SysField>
          <SysField label="Logo Name (VN)" required span="full" error={errors.title}>
            <TextInput
              value={form.title}
              placeholder="Enter the logo name."
              maxLength={500}
              disabled={disabled}
              onChange={(e) => patch('title', { title: e.target.value })}
            />
          </SysField>
          <SysField label="Logo Name (EN)" span="full">
            <TextInput
              value={form.titleEn}
              placeholder="Enter the logo name."
              maxLength={500}
              disabled={disabled}
              onChange={(e) => patch(null, { titleEn: e.target.value })}
            />
          </SysField>
          <SysField label="Current Logo" span="full">
            <div className={styles.preview}>
              {preview ? (
                <img src={preview} alt={form.title} className={styles.previewImage} />
              ) : (
                <span className={styles.previewEmpty}>
                  <FileImageOutlined className={styles.previewIcon} />
                  {form.title || 'No image attached.'}
                </span>
              )}
            </div>
          </SysField>
          <SysField label="Logo File" required span="full" error={errors.imageFileId}>
            <ImageUploadField
              fileUnqId={form.imageFileId}
              extensions={LOGO_EXTENSIONS}
              maxBytes={LOGO_MAX_BYTES}
              invalidMessage={LOGO_MESSAGES.invalidImage}
              disabled={disabled}
              upload={uploadImage.mutateAsync}
              uploading={uploadImage.isPending}
              onUploaded={(imageFileId) => patch('imageFileId', { imageFileId })}
              onError={(message) => setError('imageFileId', message)}
            />
          </SysField>
          <SysField label="Link URL" span="full" error={errors.linkUrl}>
            <TextInput
              value={form.linkUrl}
              placeholder="e.g. / or https://vamc.vn"
              maxLength={1000}
              disabled={disabled}
              onChange={(e) => patch('linkUrl', { linkUrl: e.target.value })}
            />
          </SysField>
          <SysField label="Alt Text (VN)" span="full">
            <TextArea
              rows={2}
              value={form.description}
              maxLength={2000}
              disabled={disabled}
              onChange={(e) => patch(null, { description: e.target.value })}
            />
          </SysField>
          <SysField label="Alt Text (EN)" span="full">
            <TextArea
              rows={2}
              value={form.descriptionEn}
              maxLength={2000}
              disabled={disabled}
              onChange={(e) => patch(null, { descriptionEn: e.target.value })}
            />
          </SysField>
        </SysFieldGrid>
      </LoadingSpinner>
    </SysFormModal>
  );
}
