import { Modal, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ExcelRowError, ExcelUploadResult } from '@/types/excel';

interface Props {
  open: boolean;
  result: ExcelUploadResult | null;
  onClose: () => void;
}

const TABLE_COLUMNS: ColumnsType<ExcelRowError> = [
  {
    title: '행',
    dataIndex: 'row',
    width: 64,
    align: 'center',
  },
  {
    title: '헤더명',
    dataIndex: 'header',
    width: 130,
  },
  {
    title: '입력값',
    dataIndex: 'value',
    width: 160,
    render: (v: string) =>
      v ? <span style={{ fontFamily: 'monospace' }}>{v}</span> : <Tag color="red">빈값</Tag>,
  },
  {
    title: '오류 내용',
    dataIndex: 'message',
  },
];

/**
 * Modal that shows upload validation errors in a table.
 *
 * ```tsx
 * <ExcelErrorModal {...errorModalProps} />
 * ```
 */
export function ExcelErrorModal({ open, result, onClose }: Props) {
  if (!result) return null;

  const isCapped = (result.errors?.length ?? 0) >= 100;

  return (
    <Modal
      title={
        <span style={{ color: '#ff4d4f' }}>
          업로드 실패 —&nbsp;
          총 {result.totalRows.toLocaleString()}행 중 {result.failRows}행 오류
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={740}
      destroyOnHidden
    >
      <p style={{ marginBottom: 12 }}>
        오류가 수정된 후 다시 업로드해주세요. 전체 데이터가 저장되지 않았습니다.
      </p>

      {isCapped && (
        <p style={{ color: '#faad14', marginBottom: 8 }}>
          ⚠ 오류가 많아 최대 100건까지만 표시됩니다.
        </p>
      )}

      <Table<ExcelRowError>
        dataSource={result.errors ?? []}
        columns={TABLE_COLUMNS}
        rowKey={(r) => `${r.row}-${r.col}`}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (t) => `총 ${t}건` }}
        scroll={{ y: 380 }}
      />
    </Modal>
  );
}
