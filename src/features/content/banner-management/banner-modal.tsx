import { useEffect, useState } from 'react';
import { Input, InputNumber, Modal, Radio, Spin } from 'antd';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import {
  changeBannerUse,
  createBanner,
  getBanner,
  updateBanner,
  uploadBannerImage,
} from '@/api/contents/banner-api';
import type { Banner, BannerRequest } from '@/api/contents/banner-api';
import { FormField } from '@/features/sys/_shared/sys-ui';
import { errorMessage } from '@/features/sys/_shared/sys-utils';
import styles from '@/features/sys/_shared/sys-page.module.css';
import { ImageField } from '../_shared/post-files';

// Banner Management - Detail / Register / Edit popup (VPA0032P01).
// Policy: a banner in use cannot be edited — save it as Unused, then reopen to edit.

interface BannerModalProps {
  /** null = register a new banner. */
  bannerId: string | null;
  canWrite: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  useYn: 'Y' | 'N';
  order: number | null;
  positionId: string;
  title: string;
  linkUrl: string;
  imageFileId?: string;
}

const NEW_FORM: FormState = { useYn: 'N', order: null, positionId: '', title: '', linkUrl: '' };
const URL_PATTERN = /^https?:\/\/.+/;

export default function BannerModal({ bannerId, canWrite, onClose, onSaved }: BannerModalProps) {
  const isCreate = bannerId === null;
  const { toast } = useNotify();

  const { data: detail, isFetching } = useApiQuery<Banner>(
    ['contents', 'banners', 'detail', bannerId],
    () => getBanner(bannerId as string),
    { enabled: !isCreate, gcTime: 0 },
  );

  const [form, setForm] = useState<FormState>(NEW_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!detail) return;
    setForm({
      useYn: detail.useYn,
      order: detail.order,
      positionId: detail.positionId,
      title: detail.title,
      linkUrl: detail.linkUrl ?? '',
      imageFileId: detail.imageFileId,
    });
  }, [detail]);

  const patch = (values: Partial<FormState>) => setForm((prev) => ({ ...prev, ...values }));
  const inUse = !isCreate && detail?.useYn === 'Y';
  const fieldsDisabled = !canWrite || inUse;

  const validate = (): string | null => {
    if (form.order === null) return 'Enter the display order.';
    if (!form.positionId.trim()) return 'Enter the banner position.';
    if (!form.title.trim()) return 'Enter the banner title.';
    if (form.linkUrl.trim() && !URL_PATTERN.test(form.linkUrl.trim())) {
      return 'The link URL must start with http:// or https://.';
    }
    if (!form.imageFileId) return 'Attach the banner image.';
    return null;
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      if (inUse) {
        // Only the usage flag can change while the banner is in use.
        if (form.useYn === 'N') await changeBannerUse([bannerId as string], 'N');
      } else {
        const invalid = validate();
        if (invalid) {
          toast.warning(invalid);
          return;
        }
        const request: BannerRequest = {
          title: form.title.trim(),
          positionId: form.positionId.trim(),
          order: form.order as number,
          linkUrl: form.linkUrl.trim() || undefined,
          imageFileId: form.imageFileId as string,
        };
        const saved = isCreate ? await createBanner(request) : await updateBanner(bannerId as string, request);
        // New / edited banners are stored as Unused; switch on afterwards if asked.
        const savedId = saved.data?.bannerId ?? bannerId;
        if (form.useYn === 'Y' && savedId) await changeBannerUse([savedId], 'Y');
      }
      toast.success('Saved.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      width={860}
      centered
      title={
        <span>
          Check/Modify Banner
          {inUse && <span className={styles.formNotice}>※ Can be edited when Unused.</span>}
        </span>
      }
      onCancel={onClose}
      maskClosable={false}
      footer={
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnDark}
            disabled={!canWrite || saving || isFetching}
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </div>
      }
    >
      <Spin spinning={isFetching}>
        <div className={styles.formGrid} style={{ ['--form-cols' as string]: 3 }}>
          <FormField label="In Use">
            <Radio.Group
              value={form.useYn}
              disabled={!canWrite}
              onChange={(e) => patch({ useYn: e.target.value as 'Y' | 'N' })}
              options={[
                { value: 'Y', label: 'Used' },
                { value: 'N', label: 'Unused' },
              ]}
            />
          </FormField>
          <FormField label="Order" required>
            <InputNumber
              value={form.order}
              min={1}
              max={999}
              precision={0}
              disabled={fieldsDisabled}
              onChange={(order) => patch({ order })}
            />
          </FormField>
          <FormField label="Banner Position" required>
            <Input
              placeholder="e.g. MAIN_TOP"
              value={form.positionId}
              maxLength={100}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ positionId: e.target.value })}
            />
          </FormField>

          <FormField label="Banner Title" required span="full">
            <Input
              value={form.title}
              maxLength={256}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </FormField>
          <FormField label="Banner Link URL" span="full">
            <Input
              placeholder="https://… (leave blank if no link)"
              value={form.linkUrl}
              maxLength={2000}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ linkUrl: e.target.value })}
            />
          </FormField>
          <FormField label="Banner Image" required span="full">
            <ImageField
              upload={uploadBannerImage}
              fileUnqId={form.imageFileId}
              disabled={fieldsDisabled}
              onChange={(imageFileId) => patch({ imageFileId })}
            />
          </FormField>
        </div>
      </Spin>
    </Modal>
  );
}
