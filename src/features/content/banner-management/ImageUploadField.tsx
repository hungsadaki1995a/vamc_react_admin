import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextInput from '@/components/inputs/TextInput';
import { SysButton } from '@/components/common/sys-ui/SysListUi';

// "Image / File" row of the Site Display screens (banner popup, logo page): read-only file name + [Upload File].
// The picked file is checked (E03), uploaded at once, and a new upload replaces the previous image.

interface ImageUploadFieldProps {
  /** Current image group id; only used to tell "attached" from "empty" when no name is known. */
  fileUnqId?: string;
  /** Name of the stored image (from the server) until a new file is picked. */
  initialFileName?: string;
  /** Allowed extensions, lower case without the dot, e.g. ['jpg', 'jpeg', 'png']. */
  extensions: string[];
  maxBytes: number;
  /** E03 text, e.g. "Only JPG, PNG files of 10MB or less can be uploaded." */
  invalidMessage: string;
  disabled?: boolean;
  upload: (file: File) => Promise<string>;
  uploading?: boolean;
  onUploaded: (fileUnqId: string) => void;
  /** E03 or upload failure, shown under the field by the caller. */
  onError: (message: string) => void;
}

export default function ImageUploadField({
  fileUnqId,
  initialFileName,
  extensions,
  maxBytes,
  invalidMessage,
  disabled,
  upload,
  uploading,
  onUploaded,
  onError,
}: ImageUploadFieldProps) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  const handlePick = async (picked: FileList | null) => {
    const file = picked?.[0];
    if (input.current) input.current.value = '';
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!extensions.includes(ext) || file.size > maxBytes) {
      onError(invalidMessage);
      return;
    }
    try {
      const id = await upload(file);
      setFileName(file.name);
      onUploaded(id);
    } catch (e) {
      onError(e instanceof Error ? e.message : invalidMessage);
    }
  };

  const shownName = fileName || (fileUnqId ? initialFileName || t('messages.content.attachedImage') : '');

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={extensions.map((ext) => `.${ext}`).join(',')}
        hidden
        onChange={(e) => void handlePick(e.target.files)}
      />
      <TextInput value={shownName} placeholder={t('messages.content.attachFilePlaceholder')} readOnly disabled={disabled} />
      <SysButton disabled={disabled || uploading} loading={uploading} onClick={() => input.current?.click()}>
        Upload File
      </SysButton>
    </>
  );
}
