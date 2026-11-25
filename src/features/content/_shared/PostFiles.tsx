import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DeleteOutlined,
  DownloadOutlined,
  FileAddFilled,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
} from '@ant-design/icons';
import ActionButton from '@/components/common/actions/ActionButton';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import type { ContentFile, FileBoard } from '@/api/contents/post-api';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { errorMessage } from '@/utils/system-utils';
import styles from '@/components/common/sys-ui/system-page.module.scss';
import {
  originalFileName,
  useAttachmentPreview,
  useContentFileGroup,
  useDeleteContentFile,
  useDownloadContentFile,
  useImageUpload,
  useUploadContentFiles,
} from './use-content-files';
import postStyles from './post.module.scss';

// File inputs of the content popups. Files are uploaded as soon as they are picked;
// the popup then only stores the returned file-group id on the post.

/** Design: max 5 files, 10MB each (E03 / E04). */
const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'mp3', 'mp4', 'webm', 'doc', 'docx', 'xlsx', 'zip'];
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];

const extensionOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

function FileTypeIcon({ name }: { name: string }) {
  const ext = extensionOf(name);
  if (ext === 'pdf') return <FilePdfOutlined className={postStyles.fileIconPdf} />;
  if (ext === 'doc' || ext === 'docx') return <FileWordOutlined className={postStyles.fileIconDoc} />;
  if (ext === 'xlsx') return <FileExcelOutlined className={postStyles.fileIconXls} />;
  if (IMAGE_EXTENSIONS.includes(ext)) return <FileImageOutlined className={postStyles.fileIconDoc} />;
  return <FileOutlined className={postStyles.fileIconDoc} />;
}

interface AttachmentSectionProps {
  board: FileBoard;
  fileUnqId?: string;
  files: ContentFile[];
  disabled?: boolean;
  onChange: (fileUnqId: string | undefined, files: ContentFile[]) => void;
}

/**
 * "Attachments  Total n  [Upload File]" block under the popup grid: drop area with a guide text,
 * one row per file with [delete] and [download] icons (E03 / E04 below the area).
 */
export function AttachmentSection({ board, fileUnqId, files, disabled, onChange }: AttachmentSectionProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();
  const uploadFiles = useUploadContentFiles(board);
  const deleteFile = useDeleteContentFile(board);
  const downloadFile = useDownloadContentFile();
  const busy = uploadFiles.isPending || deleteFile.isPending;
  const locked = disabled || busy;

  const handlePick = async (picked: File[]) => {
    if (picked.length === 0 || locked) return;
    // Checked in the design order: extension > size > count.
    if (picked.some((f) => !ALLOWED_EXTENSIONS.includes(extensionOf(f.name)) || f.size > MAX_FILE_BYTES)) {
      setError(t('messages.content.post.invalidFiles', { extensions: ALLOWED_EXTENSIONS.join(', ') }));
      return;
    }
    if (files.length + picked.length > MAX_FILES) {
      setError(t('messages.content.post.maxFiles', { max: MAX_FILES }));
      return;
    }
    setError(undefined);
    try {
      const group = await uploadFiles.mutateAsync({ files: picked, fileUnqId });
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
      setError(undefined);
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

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handlePick(Array.from(e.dataTransfer.files));
  };

  return (
    <section className={postStyles.attachments}>
      <div className={postStyles.attachmentsHeader}>
        <span className={postStyles.attachmentsTitle}>Attachments</span>
        <span className={postStyles.attachmentsTotal}>Total {files.length}</span>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
          onChange={(e) => handlePick(Array.from(e.target.files ?? []))}
        />
        <SysButton className={postStyles.attachmentsUpload} disabled={locked} onClick={() => input.current?.click()}>
          {busy ? 'Uploading…' : 'Upload File'}
        </SysButton>
      </div>
      <div
        className={postStyles.dropArea}
        data-dragging={dragging || undefined}
        data-error={error ? true : undefined}
        onDragOver={(e) => {
          e.preventDefault();
          if (!locked) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {files.length === 0 ? (
          <div className={postStyles.dropGuide}>
            <FileAddFilled className={postStyles.dropIcon} />
            <span>{t('messages.content.post.dropGuide')}</span>
          </div>
        ) : (
          <ul className={postStyles.fileList}>
            {files.map((file) => {
              const name = originalFileName(file.fileNm);
              return (
                <li key={file.fileSeq} className={postStyles.fileRow}>
                  <FileTypeIcon name={name} />
                  <span className={postStyles.fileName} title={name}>
                    {name}
                  </span>
                  {!disabled && (
                    <button
                      type="button"
                      className={postStyles.fileDelete}
                      title="Delete"
                      aria-label={`Delete ${name}`}
                      onClick={() => handleRemove(file)}
                    >
                      <DeleteOutlined />
                    </button>
                  )}
                  <span className={postStyles.fileDivider} />
                  <button
                    type="button"
                    className={postStyles.fileDownload}
                    title="Download"
                    aria-label={`Download ${name}`}
                    onClick={() => handleDownload(file)}
                  >
                    <DownloadOutlined />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && <div className={postStyles.attachmentsError}>{error}</div>}
    </section>
  );
}

interface ThumbnailFieldProps {
  board: FileBoard;
  /** Uploads the picked image and resolves the new file-group id. */
  upload: (file: File) => Promise<string>;
  fileUnqId?: string;
  disabled?: boolean;
  onChange: (fileUnqId: string | undefined) => void;
}

/** Design thumbnail row: read-only file name + [Upload File] and the 16:9 guide text (png / jpg / jpeg, 10MB). */
export function ThumbnailField({ board, upload, fileUnqId, disabled, onChange }: ThumbnailFieldProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const uploadImage = useImageUpload(upload);
  const { data: group } = useContentFileGroup(board, fileUnqId);
  const name = group?.files[0] ? originalFileName(group.files[0].fileNm) : fileUnqId ? 'Image registered' : '';

  const handlePick = async (file?: File) => {
    if (!file) return;
    if (!IMAGE_EXTENSIONS.includes(extensionOf(file.name)) || file.size > MAX_FILE_BYTES) {
      setError(t('messages.content.post.invalidFiles', { extensions: IMAGE_EXTENSIONS.join(', ') }));
      return;
    }
    setError(undefined);
    try {
      onChange(await uploadImage.mutateAsync(file));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className={postStyles.thumbnail}>
      <div className={postStyles.thumbnailRow}>
        <TextInput readOnly placeholder="Register an image" value={name} className={postStyles.thumbnailName} />
        <input
          ref={input}
          type="file"
          accept={IMAGE_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
          hidden
          onChange={(e) => handlePick(e.target.files?.[0])}
        />
        <SysButton disabled={disabled || uploadImage.isPending} onClick={() => input.current?.click()}>
          {uploadImage.isPending ? 'Uploading…' : 'Upload File'}
        </SysButton>
      </div>
      {error ? (
        <div className={postStyles.thumbnailError}>{error}</div>
      ) : (
        <div className={postStyles.thumbnailHint}>
          {t('messages.content.post.thumbnailHint')}
        </div>
      )}
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
  const { t } = useTranslation();
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
        <ActionButton
          size="small"
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
        >
          {busy ? 'Uploading…' : 'Attach image'}
        </ActionButton>
        {fileUnqId && !disabled && (
          <a className={styles.textDanger} onClick={() => onChange(undefined)}>
            <DeleteOutlined /> Remove
          </a>
        )}
        {!fileUnqId && <span className={styles.textMuted}>{t('messages.content.post.noImage')}</span>}
      </div>
      {preview && <img src={preview} alt="" className={styles.imagePreview} />}
    </div>
  );
}
