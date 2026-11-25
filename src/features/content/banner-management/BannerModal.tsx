import { useState } from 'react';
import { FileImageOutlined } from '@ant-design/icons';
import Spinbox from '@/components/inputs/Spinbox';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { BANNER_ERRORS } from '@/api/contents/banner-api';
import type { Banner, BannerRequest } from '@/api/contents/banner-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/features/system/_shared/SysFormUi';
import { SysButton } from '@/features/system/_shared/SysListUi';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { useAttachmentPreview } from '../_shared/use-content-files';
import ImageUploadField from './ImageUploadField';
import {
  BANNER_IMAGE_EXTENSIONS,
  BANNER_IMAGE_MAX_BYTES,
  BANNER_MESSAGES,
  BANNER_TITLE_MAX,
} from './banner-constants';
import { useDeleteBanners, useSaveBanner, useUploadBannerImage } from './use-banners';
import styles from './banner-management.module.scss';

// Banner Management - Register / Edit popup (VPA070601P01).
// Design fields: Banner Title, Banner Image (+ preview), Display Order; footer [Delete] | [Cancel] [Register / Edit].
// Every saved banner is shown on the user home; the server keeps the orders 1..n (moves the others on save,
// closes the gap on delete) and refuses a 6th banner.

type FieldKey = 'title' | 'imageFileId' | 'order';

interface BannerModalProps {
  /** null = register. */
  banner: Banner | null;
  /** Banners registered now: Display Order runs from 1 to this (+1 when registering). */
  bannerCount: number;
  /** Register default: next after the last order. */
  nextOrder: number;
  canWrite: boolean;
  onClose: () => void;
}

interface FormState {
  title: string;
  imageFileId?: string;
  order: number | null;
}

const required = (label: string) => `${label} is required.`;

export default function BannerModal({ banner, bannerCount, nextOrder, canWrite, onClose }: BannerModalProps) {
  const isCreate = banner === null;
  const { toast, dialog } = useNotify();
  const saveBanner = useSaveBanner();
  const deleteBanners = useDeleteBanners();
  const uploadImage = useUploadBannerImage();
  const { errors, setError, clearError, clearAll, applyApiError } = useFieldErrors<FieldKey>();

  const [form, setForm] = useState<FormState>(() => ({
    title: banner?.title ?? '',
    imageFileId: banner?.imageFileId,
    order: banner?.order ?? nextOrder,
  }));
  const preview = useAttachmentPreview(form.imageFileId);

  const fieldsDisabled = !canWrite;
  const maxOrder = Math.max(1, isCreate ? bannerCount + 1 : bannerCount);

  const patch = (key: FieldKey, values: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...values }));
    clearError(key);
  };

  const validate = (): boolean => {
    clearAll();
    let valid = true;
    if (!form.title.trim()) {
      setError('title', required('Banner Title'));
      valid = false;
    }
    if (!form.imageFileId) {
      setError('imageFileId', required('Banner Image'));
      valid = false;
    }
    if (form.order === null) {
      setError('order', required('Display Order'));
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const request: BannerRequest = {
      title: form.title.trim(),
      order: form.order as number,
      imageFileId: form.imageFileId as string,
    };
    try {
      await saveBanner.mutateAsync({ bannerId: banner?.bannerId ?? null, request });
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.updated);
      onClose();
    } catch (e) {
      const mapped = applyApiError(
        e,
        {
          [BANNER_ERRORS.imageInvalid]: ['imageFileId', BANNER_MESSAGES.invalidImage],
          [BANNER_ERRORS.orderOutOfRange]: ['order', errorMessage(e)],
        },
        { title: 'title', imageFileId: 'imageFileId', order: 'order' },
      );
      if (!mapped) toast.error(errorMessage(e));
    }
  };

  const handleDelete = () => {
    if (!banner) return;
    dialog.confirm({
      content: BANNER_MESSAGES.confirmDelete,
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteBanners.mutateAsync([banner.bannerId]);
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
      title={isCreate ? 'Register Banner' : 'Edit Banner'}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={canWrite ? () => void handleSubmit() : undefined}
      submitting={saveBanner.isPending}
      submitDisabled={uploadImage.isPending}
      onCancel={onClose}
      notice={BANNER_MESSAGES.imageHint}
      leftActions={
        !isCreate &&
        canWrite && (
          <SysButton look="danger" loading={deleteBanners.isPending} onClick={handleDelete}>
            Delete
          </SysButton>
        )
      }
    >
      <SysFieldGrid columns={1}>
        <SysField label="Banner Title" required error={errors.title}>
          <TextInput
            value={form.title}
            placeholder="Enter the title."
            maxLength={BANNER_TITLE_MAX}
            disabled={fieldsDisabled}
            onChange={(e) => patch('title', { title: e.target.value })}
          />
        </SysField>
        <SysField label="Banner Image" required error={errors.imageFileId}>
          <ImageUploadField
            fileUnqId={form.imageFileId}
            initialFileName={banner?.imageFileName}
            extensions={BANNER_IMAGE_EXTENSIONS}
            maxBytes={BANNER_IMAGE_MAX_BYTES}
            invalidMessage={BANNER_MESSAGES.invalidImage}
            disabled={fieldsDisabled}
            upload={uploadImage.mutateAsync}
            uploading={uploadImage.isPending}
            onUploaded={(imageFileId) => patch('imageFileId', { imageFileId })}
            onError={(message) => setError('imageFileId', message)}
          />
        </SysField>
        <SysField label="Banner Preview">
          <div className={styles.preview} data-empty={preview ? undefined : true}>
            {preview ? (
              <img src={preview} alt={form.title} className={styles.previewImage} />
            ) : (
              <span className={styles.previewEmpty}>
                <FileImageOutlined className={styles.previewIcon} />
                No image attached.
              </span>
            )}
          </div>
        </SysField>
        <SysField label="Display Order" required error={errors.order}>
          <div className={styles.orderBox}>
            <Spinbox
              value={form.order}
              min={1}
              max={maxOrder}
              precision={0}
              disabled={fieldsDisabled}
              onChange={(order) => patch('order', { order })}
            />
          </div>
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
