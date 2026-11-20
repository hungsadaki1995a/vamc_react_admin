import { useEffect, useRef, useState } from 'react';
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNotify } from '@/hooks/use-notify';
import {
  deleteContentFile,
  downloadContentFile,
  fetchAttachmentPreview,
  originalFileName,
  uploadContentFiles,
} from '@/api/contents/post-api';
import type { ContentFile, FileBoard } from '@/api/contents/post-api';
import { errorMessage } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';

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
  const [busy, setBusy] = useState(false);

  const handlePick = async (picked: FileList | null) => {
    if (!picked?.length) return;
    if (files.length + picked.length > MAX_FILES) {
      toast.warning(`Up to ${MAX_FILES} files can be attached.`);
      return;
    }
    setBusy(true);
    try {
      const group = await uploadContentFiles(board, Array.from(picked), fileUnqId);
      onChange(group.fileUnqId, group.files);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const handleRemove = async (file: ContentFile) => {
    setBusy(true);
    try {
      await deleteContentFile(board, file.fileUnqId, file.fileSeq);
      const rest = files.filter((f) => f.fileSeq !== file.fileSeq);
      onChange(rest.length > 0 ? fileUnqId : undefined, rest);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async (file: ContentFile) => {
    try {
      await downloadContentFile(file);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-2.5">
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
        <div key={file.fileSeq} className="flex items-center gap-2.5 text-[13px]">
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
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // The preview endpoint needs the bearer token, so the image is loaded as a blob URL.
  useEffect(() => {
    if (!fileUnqId) return undefined;
    let url: string | null = null;
    let cancelled = false;
    fetchAttachmentPreview(fileUnqId)
      .then((objectUrl) => {
        url = objectUrl;
        if (cancelled) window.URL.revokeObjectURL(objectUrl);
        else setPreview(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      });
    return () => {
      cancelled = true;
      if (url) window.URL.revokeObjectURL(url);
      setPreview(null);
    };
  }, [fileUnqId]);

  const handlePick = async (picked: FileList | null) => {
    const file = picked?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await upload(file));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-2.5">
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
      {preview && (
        <img
          src={preview}
          alt=""
          className="max-w-full max-h-[180px] object-contain border border-[#e2e8f0] self-start"
        />
      )}
    </div>
  );
}
