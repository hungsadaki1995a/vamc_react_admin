import { useState } from 'react';
import type { CSSProperties } from 'react';
import ActionButton from '@/components/common/actions/ActionButton';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import Popup from '@/components/common/popup/Popup';
import AppRadio from '@/components/inputs/AppRadio';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import type { LogoRequest } from '@/api/contents/site-display-api';
import type { PostDetail } from '@/api/contents/post-api';
import { FormField } from '@/features/system/_shared/SystemUi';
import { errorMessage } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import { ImageField } from '../_shared/PostFiles';
import { useLogo, useSaveLogo, useUploadLogoImage } from './use-logos';

// Logo Management - Detail / Register / Edit popup (menu A07060200).

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

  const { data: detail, isFetching } = useLogo(logoId);
  const saveLogo = useSaveLogo();
  const uploadImage = useUploadLogoImage();

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
      await saveLogo.mutateAsync({ logoId, request });
      toast.success('Saved.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Popup
      open
      width={860}
      title={<span>{isCreate ? 'Register Logo' : 'Check/Modify Logo'}</span>}
      onCancel={onClose}
      maskClosable={false}
      footer={
        <div className={styles.modalFooter}>
          <ActionButton action="cancel" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            intent="secondary"
            appearance="filled"
            disabled={!canWrite || saveLogo.isPending || isFetching}
            onClick={handleConfirm}
          >
            Confirm
          </ActionButton>
        </div>
      }
    >
      <LoadingSpinner spinning={isFetching}>
        <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
          {!isCreate && detail && (
            <FormField label="Logo ID" span="full">
              <TextInput value={detail.pstNo} disabled />
            </FormField>
          )}
          <FormField label="Usage Status" required>
            <AppRadio.Group
              value={form.useYn}
              disabled={!canWrite}
              onChange={(e) => patch({ useYn: e.target.value as 'Y' | 'N' })}
            >
              <AppRadio value="Y">Used</AppRadio>
              <AppRadio value="N">Unused</AppRadio>
            </AppRadio.Group>
          </FormField>
          <FormField label="Position" required>
            <TextInput
              value={form.positionId}
              disabled={!canWrite}
              placeholder="e.g. HEADER, FOOTER, FAVICON"
              maxLength={100}
              onChange={(e) => patch({ positionId: e.target.value })}
            />
          </FormField>
          <FormField label="Logo Name (VI)" required span="full">
            <TextInput
              value={form.title}
              disabled={!canWrite}
              placeholder="Enter logo name in Vietnamese"
              maxLength={500}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </FormField>
          <FormField label="Logo Name (EN)" span="full">
            <TextInput
              value={form.titleEn}
              disabled={!canWrite}
              placeholder="Enter logo name in English"
              maxLength={500}
              onChange={(e) => patch({ titleEn: e.target.value })}
            />
          </FormField>
          <FormField label="Link URL" span="full">
            <TextInput
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
              upload={uploadImage.mutateAsync}
              onChange={(fileGroupId) => patch({ imageFileId: fileGroupId })}
            />
          </FormField>
          <FormField label="Description / Alt (VI)" span="full">
            <TextArea
              rows={2}
              value={form.description}
              disabled={!canWrite}
              maxLength={2000}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </FormField>
          <FormField label="Description / Alt (EN)" span="full">
            <TextArea
              rows={2}
              value={form.descriptionEn}
              disabled={!canWrite}
              maxLength={2000}
              onChange={(e) => patch({ descriptionEn: e.target.value })}
            />
          </FormField>
        </div>
      </LoadingSpinner>
    </Popup>
  );
}
