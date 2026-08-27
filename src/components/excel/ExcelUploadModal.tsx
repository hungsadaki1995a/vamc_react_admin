import { useMemo, type ReactNode } from 'react';
import { Button, Space } from 'antd';
import {
  CheckCircleFilled,
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ICellRendererParams } from 'ag-grid-community';
import AppModal from '@/components/common/AppModal';
import GridTable, { type ColDefEx } from '@/components/grid/GridTable';
import { useLabelStore } from '@/stores/labelStore';
import type { ExcelProcessResult, ExcelRowError, ExcelUploadResult } from '@/types/excel';
import styles from './ExcelUploadModal.module.css';
import { formatLabel } from '@/lib/i18n/formatLabel';

export type ExcelUploadModalMode = 'upload' | 'confirm' | 'success' | 'error';

type ResultTone = 'success' | 'primary' | 'error';

interface ResultStat {
  key: string;
  label: string;
  value: number;
  icon: ReactNode;
  tone: ResultTone;
}

interface ExcelErrorGridRow extends ExcelRowError {
  errorId: string;
}

interface ExcelUploadLabels {
  errorGridRow: string;
  errorGridHeader: string;
  errorGridValue: string;
  errorGridMessage: string;
  emptyValue: string;
  uploadPromptTitle: string;
  uploadPromptDescription: string;
  uploadModalTitle: string;
  errorModalTitle: string;
  resultModalTitle: string;
  successTitle: string;
  successSummary: string;
  confirmTitle: string;
  confirmSummary: string;
  newLabel: string;
  updatedLabel: string;
  deletedLabel: string;
  confirmProcessingNote: string;
  confirmReadyNote: string;
  errorSummary: string;
  errorIntro: string;
  errorCapped: string;
  okButton: string;
  cancelButton: string;
  processButton: string;
  fileSelectButton: string;
  stopButton: string;
}

export interface ExcelUploadModalProps {
  open: boolean;
  mode: ExcelUploadModalMode;
  title?: string;
  result?: ExcelProcessResult | null;
  errorResult?: ExcelUploadResult | null;
  uploading?: boolean;
  confirmLoading?: boolean;
  uploadTitle?: string;
  uploadDescription?: string;
  okText?: string;
  cancelText?: string;
  confirmText?: string;
  onUploadClick?: () => void;
  onConfirm?: () => void;
  onClose: () => void;
}

function formatCount(value: number) {
  return value.toLocaleString();
}

function createErrorColumns(labels: ExcelUploadLabels): ColDefEx<ExcelErrorGridRow>[] {
  return [
    {
      field: 'row',
      headerName: labels.errorGridRow,
      width: 64,
      context: { align: 'center' },
    },
    {
      field: 'header',
      headerName: labels.errorGridHeader,
      width: 130,
    },
    {
      field: 'value',
      headerName: labels.errorGridValue,
      width: 160,
      cellRenderer: ({ value }: ICellRendererParams<ExcelErrorGridRow, string>) => value
        ? <span className={styles.errorValue}>{String(value)}</span>
        : <span className={styles.errorEmptyValue}>{labels.emptyValue}</span>,
    },
    {
      field: 'message',
      headerName: labels.errorGridMessage,
      flex: 1,
      minWidth: 220,
    },
  ];
}

function ResultView({
  mode,
  result,
  confirmLoading,
  labels,
}: {
  mode: 'confirm' | 'success';
  result: ExcelProcessResult;
  confirmLoading: boolean;
  labels: ExcelUploadLabels;
}) {
  const total = formatCount(result.totalRows);
  const header = mode === 'success'
    ? {
        className: styles.resultHeaderSuccess,
        icon: <CheckCircleFilled />,
        title: labels.successTitle,
        sub: formatLabel(labels.successSummary, total),
      }
    : {
        className: styles.resultHeaderConfirm,
        icon: <CloudUploadOutlined />,
        title: labels.confirmTitle,
        sub: formatLabel(labels.confirmSummary, total),
      };
  const stats: ResultStat[] = [
    { key: 'new', label: labels.newLabel, value: result.cntNew, icon: <PlusCircleOutlined />, tone: 'success' },
    { key: 'mod', label: labels.updatedLabel, value: result.cntMod, icon: <EditOutlined />, tone: 'primary' },
    { key: 'del', label: labels.deletedLabel, value: result.cntDel, icon: <DeleteOutlined />, tone: 'error' },
  ];
  const toneClass = {
    success: styles.resultCardSuccess,
    primary: styles.resultCardPrimary,
    error: styles.resultCardError,
  };

  return (
    <div className={styles.resultWrap}>
      <div className={`${styles.resultHeader} ${header.className}`}>
        <span className={styles.resultHeaderIcon}>{header.icon}</span>
        <div>
          <div className={styles.resultHeaderTitle}>{header.title}</div>
          <div className={styles.resultHeaderSub}>{header.sub}</div>
        </div>
      </div>

      <div className={styles.resultCards}>
        {stats.map((stat) => (
          <div
            key={stat.key}
            className={[
              styles.resultCard,
              stat.value > 0 ? toneClass[stat.tone] : styles.resultCardZero,
            ].join(' ')}
          >
            <div className={styles.resultCardLabel}>
              <span className={styles.resultCardIcon}>{stat.icon}</span>
              {stat.label}
            </div>
            <div className={styles.resultCardValue}>{formatCount(stat.value)}</div>
          </div>
        ))}
      </div>

      {mode === 'confirm' && (
        <p className={styles.resultNote}>
          {confirmLoading
            ? labels.confirmProcessingNote
            : labels.confirmReadyNote}
        </p>
      )}
    </div>
  );
}

function UploadView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={styles.uploadView}>
      <div className={styles.uploadDropzone}>
        <UploadOutlined className={styles.uploadIcon} />
        <div>
          <div className={styles.uploadTitle}>{title}</div>
          <div className={styles.uploadDescription}>{description}</div>
        </div>
      </div>
    </div>
  );
}

function ErrorView({
  result,
  labels,
  columns,
}: {
  result: ExcelUploadResult;
  labels: ExcelUploadLabels;
  columns: ColDefEx<ExcelErrorGridRow>[];
}) {
  const isCapped = (result.errors?.length ?? 0) >= 100;
  const rows: ExcelErrorGridRow[] = (result.errors ?? []).map((row, index) => ({
    ...row,
    errorId: `${row.row}-${row.col ?? row.header ?? 'cell'}-${index}`,
  }));
  const summary = formatLabel(
    labels.errorSummary,
    formatCount(result.totalRows),
    formatCount(result.failRows),
  );

  return (
    <div className={styles.errorWrap}>
      <div className={styles.errorSummary}>{summary}</div>
      <p className={styles.errorIntro}>{labels.errorIntro}</p>
      {isCapped && (
        <p className={styles.errorCapped}>
          {labels.errorCapped}
        </p>
      )}
      <div className={styles.errorGrid}>
        <GridTable<ExcelErrorGridRow>
          columnDefs={columns}
          rowData={rows}
          rowKey="errorId"
          pagination={false}
          pageSize={20}
          height="100%"
          rowHeight={36}
          defaultColDef={{
            sortable: false,
            resizable: true,
          }}
        />
      </div>
    </div>
  );
}

export function ExcelUploadModal({
  open,
  mode,
  title,
  result,
  errorResult,
  uploading = false,
  confirmLoading = false,
  uploadTitle,
  uploadDescription,
  okText,
  cancelText,
  confirmText,
  onUploadClick,
  onConfirm,
  onClose,
}: ExcelUploadModalProps) {
  const t = useLabelStore((s) => s.t);
  const labelsVersion = useLabelStore((s) => s.labelsVersion);

  const labels = useMemo<ExcelUploadLabels>(
    () => ({
      errorGridRow: t('COMPONENT.SCRIPT.GRID_excelRow', '행'),
      errorGridHeader: t('COMPONENT.SCRIPT.GRID_excelHeader', '헤더명'),
      errorGridValue: t('COMPONENT.SCRIPT.GRID_excelValue', '입력값'),
      errorGridMessage: t('COMPONENT.SCRIPT.GRID_excelErrorDetail', '오류 내용'),
      emptyValue: t('COMPONENT.VIEW.TEXT_excelEmptyValue', '빈값'),
      uploadPromptTitle: t('COMPONENT.VIEW.TEXT_excelUploadPromptTitle', '엑셀 파일을 업로드하세요'),
      uploadPromptDescription: t(
        'COMPONENT.VIEW.TEXT_excelUploadPromptDescription',
        '엑셀 파일을 선택하면 검증 후 결과가 표시됩니다.',
      ),
      uploadModalTitle: t('COMPONENT.VIEW.TEXT_excelUploadModalTitle', '엑셀 업로드'),
      errorModalTitle: t('COMPONENT.VIEW.TEXT_excelUploadFailTitle', '업로드 실패'),
      resultModalTitle: t('COMPONENT.VIEW.TEXT_excelProcessResultTitle', '엑셀 처리 결과'),
      successTitle: t('COMPONENT.VIEW.TEXT_excelProcessSuccessTitle', '처리가 완료되었습니다'),
      successSummary: t('COMPONENT.VIEW.TEXT_excelProcessSuccessSummary', '전체 {0}건 반영'),
      confirmTitle: t('COMPONENT.VIEW.TEXT_excelProcessConfirmTitle', '업로드 내용을 확인하세요'),
      confirmSummary: t('COMPONENT.VIEW.TEXT_excelProcessConfirmSummary', '전체 {0}건이 저장됩니다.'),
      newLabel: t('COMPONENT.VIEW.TEXT_excelNew', '신규'),
      updatedLabel: t('COMPONENT.VIEW.TEXT_excelUpdated', '수정'),
      deletedLabel: t('COMPONENT.VIEW.TEXT_excelDeleted', '삭제'),
      confirmProcessingNote: t(
        'COMPONENT.VIEW.TEXT_excelProcessSavingNote',
        '저장 중입니다. 취소를 누르면 처리를 중단합니다.',
      ),
      confirmReadyNote: t(
        'COMPONENT.VIEW.TEXT_excelProcessRefreshNote',
        '확인 후 처리하면 목록이 자동으로 갱신됩니다.',
      ),
      errorSummary: t('COMPONENT.VIEW.TEXT_excelErrorSummary', '총 {0}행 중 {1}행 오류'),
      errorIntro: t(
        'COMPONENT.VIEW.TEXT_excelErrorIntro',
        '오류가 수정된 후 다시 업로드해주세요. 전체 데이터가 저장되지 않았습니다.',
      ),
      errorCapped: t('COMPONENT.VIEW.TEXT_excelErrorCapped', '오류가 많아 최대 100건까지만 표시됩니다.'),
      okButton: t('COMPONENT.VIEW.BTN_ok', '확인'),
      cancelButton: t('COMPONENT.SCRIPT.BTN_cancel', '취소'),
      processButton: t('COMPONENT.VIEW.BTN_process', '처리'),
      fileSelectButton: t('COMPONENT.VIEW.BTN_fileSelect', '파일 선택'),
      stopButton: t('COMPONENT.VIEW.BTN_stop', '중단'),
    }),
    // labelsVersion: t는 안정 참조라 로케일 변경 시 이 값으로만 재계산을 유발(의도적 의존성).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion, t],
  );

  const errorColumns = useMemo(
    () => createErrorColumns(labels),
    [labels],
  );

  if ((mode === 'confirm' || mode === 'success') && !result) return null;
  if (mode === 'error' && !errorResult) return null;

  const blocking = mode === 'confirm' && confirmLoading;
  const resolvedUploadTitle = uploadTitle ?? labels.uploadPromptTitle;
  const resolvedUploadDescription = uploadDescription ?? labels.uploadPromptDescription;
  const resolvedOkText = okText ?? labels.okButton;
  const resolvedCancelText = cancelText ?? labels.cancelButton;
  const resolvedConfirmText = confirmText ?? labels.processButton;
  const resolvedTitle = title
    ?? (mode === 'upload'
      ? labels.uploadModalTitle
      : mode === 'error'
        ? labels.errorModalTitle
        : labels.resultModalTitle);

  const footer = mode === 'upload'
    ? (
      <Space>
        <Button onClick={onClose}>{resolvedCancelText}</Button>
        <Button type="primary" loading={uploading} onClick={onUploadClick}>{labels.fileSelectButton}</Button>
      </Space>
    )
    : mode === 'confirm'
      ? (
        <Space>
          <Button onClick={onClose}>{confirmLoading ? labels.stopButton : resolvedCancelText}</Button>
          <Button type="primary" loading={confirmLoading} onClick={onConfirm}>{resolvedConfirmText}</Button>
        </Space>
      )
      : <Button type="primary" onClick={onClose}>{resolvedOkText}</Button>;

  return (
    <AppModal
      title={resolvedTitle}
      open={open}
      onCancel={onClose}
      width={mode === 'error' ? 740 : 460}
      destroyOnHidden
      footer={footer}
      mask={{ closable: !blocking }}
      keyboard={!blocking}
      closable={!blocking}
      className={mode === 'error' ? 'app-modal--grid' : 'app-modal--form'}
    >
      {mode === 'upload' && (
        <UploadView title={resolvedUploadTitle} description={resolvedUploadDescription} />
      )}
      {mode === 'confirm' && result && (
        <ResultView mode="confirm" result={result} confirmLoading={confirmLoading} labels={labels} />
      )}
      {mode === 'success' && result && (
        <ResultView mode="success" result={result} confirmLoading={confirmLoading} labels={labels} />
      )}
      {mode === 'error' && errorResult && (
        <ErrorView result={errorResult} labels={labels} columns={errorColumns} />
      )}
    </AppModal>
  );
}
