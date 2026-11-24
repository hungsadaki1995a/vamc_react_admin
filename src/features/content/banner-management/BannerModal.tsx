import { useState } from 'react';
import { FileImageOutlined } from '@ant-design/icons';
import AppRadio from '@/components/inputs/AppRadio';
import Spinbox from '@/components/inputs/Spinbox';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import type { Banner, BannerRequest } from '@/api/contents/banner-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/features/system/_shared/SysFormUi';
import { SysButton } from '@/features/system/_shared/SysListUi';
import { USE_YN_RADIO_OPTIONS } from '@/features/system/_shared/sys-constants';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { useAttachmentPreview } from '../_shared/use-content-files';
import ImageUploadField from './ImageUploadField';
import {
  BANNER_DEFAULT_POSITION,
  BANNER_IMAGE_EXTENSIONS,
  BANNER_IMAGE_MAX_BYTES,
  BANNER_MESSAGES,
  BANNER_TITLE_MAX,
} from './banner-constants';
import { useDeleteBanners, useSaveBanner, useUploadBannerImage } from './use-banners';
import styles from './banner-management.module.scss';

// Banner Management - Register / Edit popup (VPA070601P01).
// Design fields: Banner Title, Banner Image (+ preview), Display Order; footer [Delete] | [Cancel] [Register / Edit].
// Use stays because the server only shows Active banners and refuses to edit or delete an Active one.

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
  useYn: 'Y' | 'N';
}

const required = (label: string) => `${label} is required.`;

export default function BannerModal({ banner, bannerCount, nextOrder, canWrite, onClose }: BannerModalProps) {
  const isCreate = banner === null;
  const { toast, dialog } = useNotify();
  const saveBanner = useSaveBanner();
  const deleteBanners = useDeleteBanners();
  const uploadImage = useUploadBannerImage();
  const { errors, setError, clearError, clearAll } = useFieldErrors<FieldKey>();

  const [form, setForm] = useState<FormState>(() => ({
    title: banner?.title ?? '',
    imageFileId: banner?.imageFileId,
    order: banner?.order ?? nextOrder,
    useYn: banner?.useYn ?? 'Y',
  }));
  const preview = useAttachmentPreview(form.imageFileId);

  const inUse = !isCreate && banner.useYn === 'Y';
  const fieldsDisabled = !canWrite || inUse;
  const maxOrder = Math.max(1, isCreate ? bannerCount + 1 : bannerCount);

  const patch = (key: FieldKey | null, values: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...values }));
    if (key) clearError(key);
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
    // An Active banner: only Use can change (the server refuses other edits).
    if (inUse) {
      if (form.useYn === 'Y') {
        onClose();
        return;
      }
      try {
        await saveBanner.mutateAsync({ bannerId: banner.bannerId, useYn: 'N' });
        toast.success(SYS_MESSAGES.updated);
        onClose();
      } catch (e) {
        toast.error(errorMessage(e));
      }
      return;
    }
    if (!validate()) return;
    const request: BannerRequest = {
      title: form.title.trim(),
      positionId: banner?.positionId ?? BANNER_DEFAULT_POSITION,
      order: form.order as number,
      linkUrl: banner?.linkUrl || undefined,
      imageFileId: form.imageFileId as string,
    };
    try {
      // The server stores a new / edited banner as Inactive; Use is applied afterwards.
      await saveBanner.mutateAsync({
        bannerId: banner?.bannerId ?? null,
        request,
        useYn: form.useYn === 'Y' ? 'Y' : undefined,
      });
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.updated);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
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
      notice={
        <>
          <div>{BANNER_MESSAGES.imageHint}</div>
          {inUse && <div className={styles.inUseNotice}>{BANNER_MESSAGES.inUse}</div>}
        </>
      }
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
        <SysField label="Use" required>
          <AppRadio.Group
            value={form.useYn}
            options={USE_YN_RADIO_OPTIONS}
            disabled={!canWrite}
            onChange={(e) => patch(null, { useYn: e.target.value as 'Y' | 'N' })}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
