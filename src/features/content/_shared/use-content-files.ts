import { useEffect, useState } from 'react';
import { useApiTask } from '@/hooks/use-api-action';
import {
  deleteContentFile,
  downloadContentFile,
  fetchAttachmentPreview,
  uploadContentFiles,
} from '@/api/contents/post-api';
import type { ContentFile, FileBoard } from '@/api/contents/post-api';

// File hooks of the content popups (attachment groups, image upload, image preview).

// Pure display helper (strips the stored uuid prefix) — re-exported so components need no API import.
export { originalFileName } from '@/api/contents/post-api';

export interface UploadContentFilesVariables {
  files: File[];
  /** Existing group to append to. */
  fileUnqId?: string;
}

/** Uploads files into an attachment group; resolves the whole group. */
export function useUploadContentFiles(board: FileBoard) {
  return useApiTask(({ files, fileUnqId }: UploadContentFilesVariables) => uploadContentFiles(board, files, fileUnqId));
}

export function useDeleteContentFile(board: FileBoard) {
  return useApiTask((file: ContentFile) => deleteContentFile(board, file.fileUnqId, file.fileSeq));
}

export function useDownloadContentFile() {
  return useApiTask(downloadContentFile);
}

/** Uploads one image into a new group of the board; resolves the file-group id. */
export function useUploadContentImage(board: FileBoard) {
  return useApiTask(async (file: File) => (await uploadContentFiles(board, [file])).fileUnqId);
}

/** Tracks the pending state of an upload function handed to `ImageField`. */
export function useImageUpload(upload: (file: File) => Promise<string>) {
  return useApiTask(upload);
}

/**
 * Object URL of an attachment preview (the endpoint needs the bearer token, so the image is
 * loaded as a blob). The URL is revoked when `fileUnqId` changes or the caller unmounts.
 */
export function useAttachmentPreview(fileUnqId: string | undefined): string | null {
  const [preview, setPreview] = useState<{ fileUnqId: string; url: string } | null>(null);

  useEffect(() => {
    if (!fileUnqId) return undefined;
    let url: string | null = null;
    let cancelled = false;
    fetchAttachmentPreview(fileUnqId)
      .then((objectUrl) => {
        if (cancelled) {
          window.URL.revokeObjectURL(objectUrl);
          return;
        }
        url = objectUrl;
        setPreview({ fileUnqId, url: objectUrl });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (url) window.URL.revokeObjectURL(url);
      setPreview(null);
    };
  }, [fileUnqId]);

  // A URL loaded for another (or removed) file is never shown — it is already revoked.
  return preview && preview.fileUnqId === fileUnqId ? preview.url : null;
}
