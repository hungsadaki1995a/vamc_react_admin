import { useRef, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import type { ExcelColumnDef, ExcelUploadResult } from '@/types/excel';

interface UseExcelConfig {
  columns: ExcelColumnDef[];
  /** POST endpoint — server streams back the excel file */
  downloadUrl?: string;
  /** POST multipart endpoint — returns ExcelUploadResult */
  uploadUrl?: string;
  fileName?: string;
  /** Additional query parameters forwarded to the download endpoint */
  queryParams?: Record<string, unknown>;
  onUploadSuccess?: () => void;
}

interface ErrorModalProps {
  open: boolean;
  result: ExcelUploadResult | null;
  onClose: () => void;
}

/**
 * Excel download / upload / template hook.
 *
 * ```tsx
 * const { download, triggerUpload, downloadTemplate, downloading, uploading,
 *         fileInputRef, handleFileChange, errorModalProps } = useExcel({ columns, ... });
 *
 * // Bind the hidden file input in your JSX
 * <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
 *        style={{ display: 'none' }} onChange={handleFileChange} />
 * ```
 */
export function useExcel({
  columns,
  downloadUrl,
  uploadUrl,
  fileName = 'download',
  queryParams,
  onUploadSuccess,
}: UseExcelConfig) {
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<ExcelUploadResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Download excel from server — streams file from downloadUrl */
  const download = async () => {
    if (!downloadUrl) return;
    setDownloading(true);
    try {
      const response = await apiClient.post(
        downloadUrl,
        { columns, queryParams: queryParams ?? {}, fileName },
        { responseType: 'blob', timeout: 120_000 }, // 5만건 대응 타임아웃
      );

      const url  = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `${fileName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  /** Programmatically trigger the hidden file input */
  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  /** Handle file selection and POST to uploadUrl */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void uploadFile(file);
    // Reset so the same file can be re-selected after an error
    e.target.value = '';
  };

  const uploadFile = async (file: File) => {
    if (!uploadUrl) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('columns', JSON.stringify(columns));

      const { data } = await apiClient.post(uploadUrl, formData, { timeout: 120_000 });

      // vamc-npl-backend wraps response: { status, message, data: ExcelUploadResult }
      const result: ExcelUploadResult = (data as { data?: ExcelUploadResult }).data ?? data;

      if (result.success) {
        onUploadSuccess?.();
      } else {
        setUploadResult(result);
        setErrorModalOpen(true);
      }
    } finally {
      setUploading(false);
    }
  };

  /** Download empty template excel from /api/excel/template */
  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      const response = await apiClient.post(
        '/api/excel/template',
        { columns, fileName },
        { responseType: 'blob' },
      );

      const url  = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `${fileName}_템플릿.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const errorModalProps: ErrorModalProps = {
    open: errorModalOpen,
    result: uploadResult,
    onClose: () => setErrorModalOpen(false),
  };

  return {
    download,
    triggerUpload,
    downloadTemplate,
    downloading,
    uploading,
    fileInputRef,
    handleFileChange,
    errorModalProps,
  };
}
