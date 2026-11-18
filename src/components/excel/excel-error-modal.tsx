import { useMemo } from 'react';
import { Modal, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ExcelRowError, ExcelUploadResult } from '@/types/excel';
import { useComponentLabel } from '@/hooks/use-component-label';
import { useTotalCountLabel } from '@/hooks/use-total-count-label';
import { formatLabel } from '@/lib/i18n/format-label';

interface Props {
  open: boolean;
  result: ExcelUploadResult | null;
  onClose: () => void;
}

/** Error display cap — server returns at most this many entries */
const ERROR_CAP = 100;

/**
 * Modal that shows upload validation errors in a table.
 *
 * Uses the **same label keys** as `ExcelUploadModal` — maintaining duplicate keys
 * causes translations to diverge.
 *
 * ```tsx
 * <ExcelErrorModal {...errorModalProps} />
 * ```
 */
export function ExcelErrorModal({ open, result, onClose }: Props) {
  const { tvt, tsg } = useComponentLabel();
  const { format: formatTotal } = useTotalCountLabel();

  const columns = useMemo<ColumnsType<ExcelRowError>>(() => [
    {
      title: tsg('excelRow', '행'),
      dataIndex: 'row',
      width: 64,
      align: 'center',
    },
    {
      title: tsg('excelHeader', '헤더명'),
      dataIndex: 'header',
      width: 130,
    },
    {
      title: tsg('excelValue', '입력값'),
      dataIndex: 'value',
      width: 160,
      render: (v: string) =>
        v
          ? <span style={{ fontFamily: 'monospace' }}>{v}</span>
          : <Tag color="red">{tvt('excelEmptyValue', '빈값')}</Tag>,
    },
    {
      title: tsg('excelErrorDetail', '오류 내용'),
      dataIndex: 'message',
    },
  ], [tsg, tvt]);

  if (!result) return null;

  const isCapped = (result.errors?.length ?? 0) >= ERROR_CAP;

  return (
    <Modal
      title={
        <span style={{ color: '#ff4d4f' }}>
          {tvt('excelUploadFailTitle', '업로드 실패')}
          {' — '}
          {formatLabel(
            tvt('excelErrorSummary', '총 {0}행 중 {1}행 오류'),
            result.totalRows.toLocaleString(),
            result.failRows,
          )}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={740}
      destroyOnHidden
    >
      <p style={{ marginBottom: 12 }}>
        {tvt('excelErrorIntro', '오류가 수정된 후 다시 업로드해주세요. 전체 데이터가 저장되지 않았습니다.')}
      </p>

      {isCapped && (
        <p style={{ color: '#faad14', marginBottom: 8 }}>
          ⚠ {tvt('excelErrorCapped', '오류가 많아 최대 100건까지만 표시됩니다.')}
        </p>
      )}

      <Table<ExcelRowError>
        dataSource={result.errors ?? []}
        columns={columns}
        rowKey={(r) => `${r.row}-${r.col}`}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: false, showTotal: formatTotal }}
        scroll={{ y: 380 }}
      />
    </Modal>
  );
}
