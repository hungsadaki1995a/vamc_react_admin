import { useRef } from 'react';
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNotify } from '@/hooks/use-notify';
import type { ContentFile, FileBoard } from '@/api/contents/post-api';
import { errorMessage } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import postStyles from './post.module.scss';
import {
  originalFileName,
  useAttachmentPreview,
  useDeleteContentFile,
  useDownloadContentFile,
  useImageUpload,
  useUploadContentFiles,
} from './use-content-files';

// File inputs of the content popups. Files are uploaded as soon as they are picked;
// the popup then only stores the returned file-group id on the post.

const MAX_FILES = 10;

interface AttachmentFieldProps {
  board: FileBoard;
  fileUnqId?: string;
  files: ContentFile[];
  disabled?: boolean;
  onChange: (fileUnqId: string | undefined, files: ContentFile[]) => void;
}

/** "Attach files" row: upload into one attachment group, list / download / remove. */
export function AttachmentField({ board, fileUnqId, files, disabled, onChange }: AttachmentFieldProps) {
  const { toast } = useNotify();
  const input = useRef<HTMLInputElement>(null);
  const uploadFiles = useUploadContentFiles(board);
  const deleteFile = useDeleteContentFile(board);
  const downloadFile = useDownloadContentFile();
  const busy = uploadFiles.isPending || deleteFile.isPending;

  const handlePick = async (picked: FileList | null) => {
    if (!picked?.length) return;
    if (files.length + picked.length > MAX_FILES) {
      toast.warning(`Up to ${MAX_FILES} files can be attached.`);
      return;
    }
    try {
      const group = await uploadFiles.mutateAsync({ files: Array.from(picked), fileUnqId });
      onChange(group.fileUnqId, group.files);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  const handleRemove = async (file: ContentFile) => {
    try {
      await deleteFile.mutateAsync(file);
      const rest = files.filter((f) => f.fileSeq !== file.fileSeq);
      onChange(rest.length > 0 ? fileUnqId : undefined, rest);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const handleDownload = async (file: ContentFile) => {
    try {
      await downloadFile.mutateAsync(file);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className={styles.stack}>
      <div className={styles.inline}>
        <input ref={input} type="file" multiple hidden onChange={(e) => handlePick(e.target.files)} />
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSmall}`}
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
        >
          {busy ? 'Uploading…' : 'Attach files'}
        </button>
        <span className={styles.textMuted}>
          {files.length} / {MAX_FILES}
        </span>
      </div>
      {files.map((file) => (
        <div key={file.fileSeq} className={`${styles.inline} ${postStyles.fileRow}`}>
          <a className={styles.cellLink} onClick={() => handleDownload(file)}>
            <DownloadOutlined /> {originalFileName(file.fileNm)}
          </a>
          {!disabled && (
            <a className={styles.textDanger} onClick={() => handleRemove(file)} title="Remove">
              <DeleteOutlined />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

interface ImageFieldProps {
  /** Uploads the picked image and resolves the new file-group id. */
  upload: (file: File) => Promise<string>;
  fileUnqId?: string;
  disabled?: boolean;
  onChange: (fileUnqId: string | undefined) => void;
}

/** "Attach image" row with a preview (thumbnail, portrait, logo, banner image). */
export function ImageField({ upload, fileUnqId, disabled, onChange }: ImageFieldProps) {
  const { toast } = useNotify();
  const input = useRef<HTMLInputElement>(null);
  const uploadImage = useImageUpload(upload);
  const busy = uploadImage.isPending;
  // The preview endpoint needs the bearer token, so the image is loaded as a blob URL.
  const preview = useAttachmentPreview(fileUnqId);

  const handlePick = async (picked: FileList | null) => {
    const file = picked?.[0];
    if (!file) return;
    try {
      onChange(await uploadImage.mutateAsync(file));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className={styles.stack}>
      <div className={styles.inline}>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => handlePick(e.target.files)} />
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSmall}`}
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
        >
          {busy ? 'Uploading…' : 'Attach image'}
        </button>
        {fileUnqId && !disabled && (
          <a className={styles.textDanger} onClick={() => onChange(undefined)}>
            <DeleteOutlined /> Remove
          </a>
        )}
        {!fileUnqId && <span className={styles.textMuted}>No image</span>}
      </div>
      {preview && <img src={preview} alt="" className={styles.imagePreview} />}
    </div>
  );
}
