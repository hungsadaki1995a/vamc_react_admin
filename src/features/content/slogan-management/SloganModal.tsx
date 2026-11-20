import { useEffect, useState } from 'react';
import { Input, Modal, Radio, Spin } from 'antd';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import {
  createSlogan,
  getSlogan,
  updateSlogan,
} from '@/api/contents/site-display-api';
import type { SloganRequest } from '@/api/contents/site-display-api';
import type { PostDetail } from '@/api/contents/post-api';
import { FormField } from '@/features/system/_shared/SystemUi';
import { errorMessage } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';

// Slogan Management - Detail / Register / Edit popup (menu A04110300).

interface SloganModalProps {
  /** null = register a new slogan. */
  sloganId: string | null;
  canWrite: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  useYn: 'Y' | 'N';
  positionId: string;
  title: string;
  titleEn: string;
  subSlogan: string;
  subSloganEn: string;
}

const NEW_FORM: FormState = {
  useYn: 'N',
  positionId: 'MAIN_HERO',
  title: '',
  titleEn: '',
  subSlogan: '',
  subSloganEn: '',
};

export default function SloganModal({ sloganId, canWrite, onClose, onSaved }: SloganModalProps) {
  const isCreate = sloganId === null;
  const { toast } = useNotify();

  const { data: detail, isFetching } = useApiQuery<PostDetail>(
    ['contents', 'slogans', 'detail', sloganId],
    () => getSlogan(sloganId as string),
    { enabled: !isCreate, gcTime: 0 },
  );

  const [form, setForm] = useState<FormState>(NEW_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!detail) return;
    setForm({
      useYn: detail.published === 'Y' ? 'Y' : 'N',
      positionId: detail.tag ?? 'MAIN_HERO',
      title: detail.title ?? '',
      titleEn: detail.titleEn ?? '',
      subSlogan: detail.content ?? '',
      subSloganEn: detail.contentEn ?? '',
    });
  }, [detail]);

  const patch = (values: Partial<FormState>) => setForm((prev) => ({ ...prev, ...values }));

  const validate = (): string | null => {
    if (!form.positionId.trim()) return 'Enter the slogan position.';
    if (!form.title.trim()) return 'Enter the main slogan (VI).';
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
      const request: SloganRequest = {
        title: form.title.trim(),
        titleEn: form.titleEn.trim() || undefined,
        subSlogan: form.subSlogan.trim() || undefined,
        subSloganEn: form.subSloganEn.trim() || undefined,
        positionId: form.positionId.trim(),
        useYn: form.useYn,
      };
      if (isCreate) {
        await createSlogan(request);
      } else {
        await updateSlogan(sloganId as string, request);
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
      title={<span>{isCreate ? 'Register Slogan' : 'Check/Modify Slogan'}</span>}
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
            <FormField label="Slogan ID" span="full">
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
              placeholder="e.g. MAIN_HERO, FOOTER, ABOUT"
              maxLength={100}
              onChange={(e) => patch({ positionId: e.target.value })}
            />
          </FormField>
          <FormField label="Main Slogan (VI)" required span="full">
            <Input
              value={form.title}
              disabled={!canWrite}
              placeholder="Enter main slogan in Vietnamese"
              maxLength={500}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </FormField>
          <FormField label="Main Slogan (EN)" span="full">
            <Input
              value={form.titleEn}
              disabled={!canWrite}
              placeholder="Enter main slogan in English"
              maxLength={500}
              onChange={(e) => patch({ titleEn: e.target.value })}
            />
          </FormField>
          <FormField label="Sub-slogan / Description (VI)" span="full">
            <Input.TextArea
              rows={3}
              value={form.subSlogan}
              disabled={!canWrite}
              maxLength={2000}
              onChange={(e) => patch({ subSlogan: e.target.value })}
            />
          </FormField>
          <FormField label="Sub-slogan / Description (EN)" span="full">
            <Input.TextArea
              rows={3}
              value={form.subSloganEn}
              disabled={!canWrite}
              maxLength={2000}
              onChange={(e) => patch({ subSloganEn: e.target.value })}
            />
          </FormField>
        </div>
      </Spin>
    </Modal>
  );
}
