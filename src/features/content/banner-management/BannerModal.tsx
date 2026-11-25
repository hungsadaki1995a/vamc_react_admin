import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Popup from '@/components/common/popup/Popup';
import Spinbox from '@/components/inputs/Spinbox';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { BANNER_ERRORS } from '@/api/contents/banner-api';
import type { Banner, BannerRequest } from '@/api/contents/banner-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { apiErrorCode, apiValidationErrors, errorMessage } from '@/utils/system-utils';
import { useAttachmentPreview } from '../_shared/use-content-files';
import ImageUploadField from './ImageUploadField';
import {
  BANNER_IMAGE_EXTENSIONS,
  BANNER_IMAGE_MAX_BYTES,
  BANNER_TITLE_MAX,
} from './banner-constants';
import { useDeleteBanners, useSaveBanner, useUploadBannerImage } from './use-banners';
import styles from './banner-management.module.scss';

// Banner Management - Register / Edit popup (VPA070601P01).
// Design fields: Banner Title, Banner Image (+ preview), Display Order; footer [Delete] | [Cancel] [Register / Edit].
// Every saved banner is shown on the user home; the server keeps the orders 1..n (moves the others on save,
// closes the gap on delete) and refuses a 6th banner.

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

function createBannerSchema(maxOrder: number, t: TFunction) {
  const required = (label: string) => t('messages.sys.fieldRequired', { label });
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, required(t('messages.content.banner.fieldTitle')))
      .max(BANNER_TITLE_MAX, t('messages.content.banner.titleMax', { max: BANNER_TITLE_MAX })),
    imageFileId: z.string().min(1, required(t('messages.content.banner.fieldImage'))),
    order: z
      .number()
      .int(t('messages.content.banner.orderInt'))
      .min(1, t('messages.content.banner.orderMin'))
      .max(maxOrder, t('messages.content.banner.orderMax', { max: maxOrder }))
      .nullable()
      .transform((value, ctx) => {
        if (value === null) {
          ctx.addIssue({ code: 'custom', message: required(t('messages.content.banner.fieldOrder')) });
          return z.NEVER;
        }
        return value;
      }),
  });
}

type BannerSchema = ReturnType<typeof createBannerSchema>;
type BannerFormInput = z.input<BannerSchema>;
type BannerFormOutput = z.output<BannerSchema>;

const BANNER_FIELD_MAP: Record<string, keyof BannerFormInput> = {
  title: 'title',
  imageFileId: 'imageFileId',
  order: 'order',
};

export default function BannerModal({ banner, bannerCount, nextOrder, canWrite, onClose }: BannerModalProps) {
  const { t } = useTranslation();
  const isCreate = banner === null;
  const { toast } = useNotify();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const saveBanner = useSaveBanner();
  const deleteBanners = useDeleteBanners();
  const uploadImage = useUploadBannerImage();

  const fieldsDisabled = !canWrite;
  const maxOrder = Math.max(1, isCreate ? bannerCount + 1 : bannerCount);
  const schema = useMemo(() => createBannerSchema(maxOrder, t), [maxOrder, t]);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<BannerFormInput, unknown, BannerFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: banner?.title ?? '',
      imageFileId: banner?.imageFileId ?? '',
      order: banner?.order ?? nextOrder,
    },
  });

  const [title, imageFileId] = useWatch({ control, name: ['title', 'imageFileId'] });
  const preview = useAttachmentPreview(imageFileId);

  const onValidSubmit = async (values: BannerFormOutput) => {
    const request: BannerRequest = {
      title: values.title,
      order: values.order,
      imageFileId: values.imageFileId,
    };
    try {
      await saveBanner.mutateAsync({ bannerId: banner?.bannerId ?? null, request });
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.updated);
      onClose();
    } catch (e) {
      const code = apiErrorCode(e);
      if (code === BANNER_ERRORS.imageInvalid) {
        setError('imageFileId', { type: 'server', message: t('messages.content.banner.invalidImage') });
        return;
      }
      if (code === BANNER_ERRORS.orderOutOfRange) {
        setError('order', { type: 'server', message: errorMessage(e) });
        return;
      }
      const validation = apiValidationErrors(e);
      if (validation) {
        let mapped = false;
        Object.entries(validation).forEach(([field, message]) => {
          const key = BANNER_FIELD_MAP[field];
          if (key) {
            setError(key, { type: 'server', message });
            mapped = true;
          }
        });
        if (mapped) return;
      }
      toast.error(errorMessage(e));
    }
  };

  const handleConfirmDelete = async () => {
    if (!banner) return;
    try {
      await deleteBanners.mutateAsync([banner.bannerId]);
      toast.success(SYS_MESSAGES.deleted);
      setConfirmDeleteOpen(false);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <>
      <SysFormModal
        open
        width={1200}
        title={isCreate ? 'Register Banner' : 'Edit Banner'}
        submitText={isCreate ? 'Register' : 'Edit'}
        onSubmit={canWrite ? () => void handleSubmit(onValidSubmit)() : undefined}
        submitting={saveBanner.isPending}
        submitDisabled={uploadImage.isPending}
        onCancel={onClose}
        notice={t('messages.content.banner.imageHint')}
        leftActions={
          !isCreate &&
          canWrite && (
            <SysButton look="danger" loading={deleteBanners.isPending} onClick={() => setConfirmDeleteOpen(true)}>
              Delete
            </SysButton>
          )
        }
      >
        <SysFieldGrid columns={1}>
          <SysField label="Banner Title" required error={errors.title?.message}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  placeholder="Enter the title."
                  maxLength={BANNER_TITLE_MAX}
                  disabled={fieldsDisabled}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </SysField>
          <SysField label="Banner Image" required error={errors.imageFileId?.message}>
            <Controller
              name="imageFileId"
              control={control}
              render={({ field }) => (
                <ImageUploadField
                  fileUnqId={field.value}
                  initialFileName={banner?.imageFileName}
                  extensions={BANNER_IMAGE_EXTENSIONS}
                  maxBytes={BANNER_IMAGE_MAX_BYTES}
                  invalidMessage={t('messages.content.banner.invalidImage')}
                  disabled={fieldsDisabled}
                  upload={uploadImage.mutateAsync}
                  uploading={uploadImage.isPending}
                  onUploaded={(uploadedId) => {
                    field.onChange(uploadedId);
                    clearErrors('imageFileId');
                  }}
                  onError={(message) => setError('imageFileId', { type: 'manual', message })}
                />
              )}
            />
          </SysField>
          <SysField label="Banner Preview">
            <div className={styles.preview} data-empty={preview ? undefined : true}>
              {preview ? (
                <img src={preview} alt={title} className={styles.previewImage} />
              ) : (
                <span className={styles.previewEmpty}>
                  {t('messages.content.banner.noImageAttached')}
                </span>
              )}
            </div>
          </SysField>
          <SysField label="Display Order" required error={errors.order?.message}>
            <div className={styles.orderBox}>
              <Controller
                name="order"
                control={control}
                render={({ field }) => (
                  <Spinbox
                    value={field.value}
                    min={1}
                    max={maxOrder}
                    precision={0}
                    disabled={fieldsDisabled}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </SysField>
        </SysFieldGrid>
      </SysFormModal>
      {banner && (
        <Popup
          open={confirmDeleteOpen}
          title={t('messages.dialog.confirm')}
          status="confirm"
          confirmText={t('messages.dialog.delete')}
          cancelText={t('messages.dialog.cancel')}
          confirmDanger
          confirmLoading={deleteBanners.isPending}
          mask={{ closable: false }}
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => {
            if (!deleteBanners.isPending) setConfirmDeleteOpen(false);
          }}
        >
          {t('messages.content.banner.confirmDelete')}
        </Popup>
      )}
    </>
  );
}
