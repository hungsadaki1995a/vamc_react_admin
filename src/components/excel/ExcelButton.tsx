import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { DownloadOutlined, FileExcelOutlined, UploadOutlined } from '@ant-design/icons';
import { useExcel } from '@/hooks/useExcel';
import { ExcelErrorModal } from './ExcelErrorModal';
import type { ExcelColumnDef } from '@/types/excel';

interface Props {
  columns: ExcelColumnDef[];
  /** POST endpoint that streams an excel file */
  downloadUrl?: string;
  /** POST multipart endpoint that parses and saves the uploaded file */
  uploadUrl?: string;
  /** Base file name (without extension) */
  fileName?: string;
  /** Query parameters forwarded to the download endpoint */
  queryParams?: Record<string, unknown>;
  onUploadSuccess?: () => void;
  disabled?: boolean;
}

/**
 * Excel dropdown button — download / upload / template in one component.
 *
 * ```tsx
 * const columns: ExcelColumnDef[] = [
 *   { key: 'prjId',  header: '프로젝트ID', width: 15, readOnly: true },
 *   { key: 'prjNm',  header: '프로젝트명', width: 30, required: true },
 *   { key: 'strtDt', header: '시작일',     width: 15, format: 'date', required: true },
 * ];
 *
 * <ExcelButton
 *   columns={columns}
 *   downloadUrl="/api/prj/excel"
 *   uploadUrl="/api/prj/excel/upload"
 *   fileName="프로젝트목록"
 *   queryParams={{ status: filters.status }}
 *   onUploadSuccess={refetch}
 *   disabled={!canWrite}
 * />
 * ```
 */
export function ExcelButton({
  columns,
  downloadUrl,
  uploadUrl,
  fileName,
  queryParams,
  onUploadSuccess,
  disabled,
}: Props) {
  const {
    download,
    triggerUpload,
    downloadTemplate,
    downloading,
    uploading,
    fileInputRef,
    handleFileChange,
    errorModalProps,
  } = useExcel({ columns, downloadUrl, uploadUrl, fileName, queryParams, onUploadSuccess });

  const busy = downloading || uploading;

  const items: MenuProps['items'] = [
    downloadUrl
      ? { key: 'download', icon: <DownloadOutlined />, label: '엑셀 다운로드', onClick: download }
      : null,
    uploadUrl
      ? { key: 'upload', icon: <UploadOutlined />, label: '엑셀 업로드', onClick: triggerUpload }
      : null,
    { key: 'template', icon: <FileExcelOutlined />, label: '템플릿 다운로드', onClick: downloadTemplate },
  ].filter(Boolean) as MenuProps['items'];

  return (
    <>
      {/* Hidden file input — triggered programmatically on upload menu click */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Dropdown menu={{ items }} disabled={disabled || busy}>
        <Button icon={<FileExcelOutlined />} loading={busy}>
          엑셀
        </Button>
      </Dropdown>

      <ExcelErrorModal {...errorModalProps} />
    </>
  );
}
