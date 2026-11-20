import { useEffect, useState } from 'react';
import { Input, Modal, Radio, Spin } from 'antd';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import {
  createLogo,
  getLogo,
  updateLogo,
  uploadLogoImage,
} from '@/api/contents/site-display-api';
import type { LogoRequest } from '@/api/contents/site-display-api';
import type { PostDetail } from '@/api/contents/post-api';
import { FormField } from '@/features/system/_shared/SystemUi';
import { errorMessage } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';
import { ImageField } from '../_shared/PostFiles';

// Logo Management - Detail / Register / Edit popup (menu A04110200).

interface LogoModalProps {
  /** null = register a new logo. */
  logoId: string | null;
  canWrite: boolean;
  onClose: () => void;
  onSaved: () => void;
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
  useYn: 'N',
  positionId: 'HEADER',
  title: '',
  titleEn: '',
  linkUrl: '',
  description: '',
  descriptionEn: '',
};
const URL_PATTERN = /^(https?:\/\/.+|\/.*)/;

export default function LogoModal({ logoId, canWrite, onClose, onSaved }: LogoModalProps) {
  const isCreate = logoId === null;
  const { toast } = useNotify();

  const { data: detail, isFetching } = useApiQuery<PostDetail>(
    ['contents', 'logos', 'detail', logoId],
    () => getLogo(logoId as string),
    { enabled: !isCreate, gcTime: 0 },
  );

  const [form, setForm] = useState<FormState>(NEW_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!detail) return;
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
  }, [detail]);

  const patch = (values: Partial<FormState>) => setForm((prev) => ({ ...prev, ...values }));

  const validate = (): string | null => {
    if (!form.positionId.trim()) return 'Enter the logo position.';
    if (!form.title.trim()) return 'Enter the logo name (VI).';
    if (form.linkUrl.trim() && !URL_PATTERN.test(form.linkUrl.trim())) {
      return 'The link URL must start with http://, https://, or /.';
    }
    if (!form.imageFileId) return 'Attach the logo image.';
    return null;
  };

  const handleConfirm = async () => {
    const invalid = validate();
    if (invalid) {
      toast.warning(invalid);
      return;
    }
    setSaving(true);
    try {
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
      if (isCreate) {
        await createLogo(request);
      } else {
        await updateLogo(logoId as string, request);
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
      title={<span>{isCreate ? 'Register Logo' : 'Check/Modify Logo'}</span>}
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
        <div className={`${styles.formGrid} [--form-cols:2]`}>
          {!isCreate && detail && (
            <FormField label="Logo ID" span="full">
              <Input value={detail.pstNo} disabled />
            </FormField>
          )}
          <FormField label="Usage Status" required>
            <Radio.Group
              value={form.useYn}
              disabled={!canWrite}
              onChange={(e) => patch({ useYn: e.target.value as 'Y' | 'N' })}
            >
              <Radio value="Y">Used</Radio>
              <Radio value="N">Unused</Radio>
            </Radio.Group>
          </FormField>
          <FormField label="Position" required>
            <Input
              value={form.positionId}
              disabled={!canWrite}
              placeholder="e.g. HEADER, FOOTER, FAVICON"
              maxLength={100}
              onChange={(e) => patch({ positionId: e.target.value })}
            />
          </FormField>
          <FormField label="Logo Name (VI)" required span="full">
            <Input
              value={form.title}
              disabled={!canWrite}
              placeholder="Enter logo name in Vietnamese"
              maxLength={500}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </FormField>
          <FormField label="Logo Name (EN)" span="full">
            <Input
              value={form.titleEn}
              disabled={!canWrite}
              placeholder="Enter logo name in English"
              maxLength={500}
              onChange={(e) => patch({ titleEn: e.target.value })}
            />
          </FormField>
          <FormField label="Link URL" span="full">
            <Input
              value={form.linkUrl}
              disabled={!canWrite}
              placeholder="e.g. / or https://vamc.vn"
              maxLength={1000}
              onChange={(e) => patch({ linkUrl: e.target.value })}
            />
          </FormField>
          <FormField label="Logo Image" required span="full">
            <ImageField
              fileUnqId={form.imageFileId}
              disabled={!canWrite}
              upload={uploadLogoImage}
              onChange={(fileGroupId) => patch({ imageFileId: fileGroupId })}
            />
          </FormField>
          <FormField label="Description / Alt (VI)" span="full">
            <Input.TextArea
              rows={2}
              value={form.description}
              disabled={!canWrite}
              maxLength={2000}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </FormField>
          <FormField label="Description / Alt (EN)" span="full">
            <Input.TextArea
              rows={2}
              value={form.descriptionEn}
              disabled={!canWrite}
              maxLength={2000}
              onChange={(e) => patch({ descriptionEn: e.target.value })}
            />
          </FormField>
        </div>
      </Spin>
    </Modal>
  );
}
