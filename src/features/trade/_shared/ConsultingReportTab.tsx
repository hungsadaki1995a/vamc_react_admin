import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import ActionButton from '@/components/common/actions/ActionButton';
import FileUploadBox from '@/components/common/file-upload/FileUploadBox';
import Popup from '@/components/common/popup/Popup';
import DataTable from '@/components/common/table/DataTable';
import TextArea from '@/components/inputs/TextArea';
import { useNotify } from '@/hooks/use-notify';
import type { TradeAdditionalConsultation, TradeContractDetail, TradeFile } from '@/api/trade/trade-api';
import { CONSULTING_REPORT_PROCESS } from '@/api/trade/trade-contract-api';
import type { ApprovalDetailRow } from '@/features/approval/_shared/ApprovalParts';
import ApprovalRequestPopup from '@/features/approval/_shared/ApprovalRequestPopup';
import { formatDateTime } from '@/utils/date-format';
import { errorMessage } from '@/utils/system-utils';
import { useOpenTradeFile } from './use-trade-application-actions';
import {
  useAdditionalConsultationAction,
  useCompleteConsultingReport,
  useRequestReportApproval,
  useSaveConsultingReport,
} from './use-trade-contract-actions';
import styles from './trade-application-popup.module.scss';

// Consulting report and follow-up consultations (WP7, flow consulting "report" P1–P9 and "follow-up" A1–A6):
// the consultant saves the report (PDF + summary) → report approval (PROC_CNSLT_RPTP; rejection returns it to
// draft) → [Complete Report] issues the remaining fee; the report is published (OPEN) when that fee is paid, or at
// once when nothing is left. Follow-up requests come from the member (My Page): [Receive] → [Answer].

const REPORT_STATUS: Record<string, string> = {
  DRFT: 'Draft',
  APRQ: 'In Approval',
  APRV: 'Approved',
  RDY: 'Waiting for the remaining fee',
  OPEN: 'Published',
};
const ADDITIONAL_STATUS: Record<string, string> = { RQST: 'Requested', RCPT: 'Received', CMPTN: 'Answered' };

interface ConsultingReportTabProps {
  detail: TradeContractDetail;
  actions: Set<string>;
  details: ApprovalDetailRow[];
}

export default function ConsultingReportTab({ detail, actions, details }: ConsultingReportTabProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const ctrtCd = detail.srvcCtrtCd;
  const save = useSaveConsultingReport();
  const requestApproval = useRequestReportApproval();
  const complete = useCompleteConsultingReport();
  const additional = useAdditionalConsultationAction();
  const openFile = useOpenTradeFile();
  const [summary, setSummary] = useState(detail.cnsltRptpSmryCn ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [answering, setAnswering] = useState<TradeAdditionalConsultation | null>(null);
  const [result, setResult] = useState('');
  const [resultFiles, setResultFiles] = useState<File[]>([]);

  const run = async (task: () => Promise<unknown>, success: string, after?: () => void) => {
    try {
      await task();
      toast.success(success);
      after?.();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const fileLinks = (list?: TradeFile[]) =>
    list?.length ? (
      <ul className={styles.files}>
        {list.map((file) => (
          <li key={`${file.fileUnqId}-${file.fileSeq}`} className={styles.fileItem}>
            <span>{file.fileNm}</span>
            {file.previewUrl && (
              <button type="button" className={styles.officerLink} onClick={() => openFile.mutate(file.previewUrl as string)}>
                Preview
              </button>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <div className={styles.notice}>No report file yet.</div>
    );

  const columns: TableColumnsType<TradeAdditionalConsultation> = [
    { title: 'Requested', dataIndex: 'crtDt', width: 140, align: 'center', render: (v?: string) => formatDateTime(v) },
    { title: 'Request', dataIndex: 'rqstCn', render: (v?: string) => v || '-' },
    { title: 'Status', dataIndex: 'adtnSttsCd', width: 110, render: (v?: string) => ADDITIONAL_STATUS[v ?? ''] ?? v ?? '-' },
    { title: 'Answer', dataIndex: 'rsltCn', render: (v?: string) => v || '-' },
    {
      title: '',
      key: 'actions',
      width: 110,
      align: 'center',
      render: (_v, row) => (
        <>
          {actions.has('RECEIVE_ADDITIONAL_CONSULTATION') && row.adtnSttsCd === 'RQST' && (
            <ActionButton
              size="small"
              intent="primary"
              appearance="filled"
              onClick={() =>
                void run(() => additional.mutateAsync({ ctrtCd, adtnId: row.adtnId, complete: false }), t('messages.trade.additionalReceived'))
              }
            >
              Receive
            </ActionButton>
          )}
          {actions.has('COMPLETE_ADDITIONAL_CONSULTATION') && row.adtnSttsCd === 'RCPT' && (
            <ActionButton size="small" intent="secondary" appearance="filled" onClick={() => setAnswering(row)}>
              Answer
            </ActionButton>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <section className={styles.section}>
        <div className={styles.sectionTitle}>Consulting Report — {REPORT_STATUS[detail.cnsltRptpSttsCd ?? ''] ?? 'Not written'}</div>
        {fileLinks(detail.reportFiles)}
        {detail.cnsltRptpSmryCn && !actions.has('SAVE_REPORT') && <div className={styles.notice}>{detail.cnsltRptpSmryCn}</div>}
        {detail.cnsltRptpOpenDt && <div className={styles.fileSize}>Published {formatDateTime(detail.cnsltRptpOpenDt)}</div>}
        {actions.has('SAVE_REPORT') && (
          <div className={styles.checkForm}>
            <FileUploadBox
              accept=".pdf"
              fileName={files[0]?.name}
              title="Select the consulting report (PDF)"
              uploadButtonText="Select Report"
              onFileSelect={setFiles}
              onClear={() => setFiles([])}
            />
            <TextArea rows={4} maxLength={4000} showCount placeholder="Report summary shown to the member" value={summary} onChange={(e) => setSummary(e.target.value)} />
            <div className={styles.checkActions}>
              <ActionButton
                intent="primary"
                appearance="filled"
                loading={save.isPending}
                disabled={!summary.trim() || (!files.length && !detail.cnsltRptpFileUnqId)}
                onClick={() =>
                  void run(
                    () => save.mutateAsync({ ctrtCd, files, fileUnqId: detail.cnsltRptpFileUnqId, summary: summary.trim() }),
                    t('messages.trade.reportSaved'),
                    () => setFiles([]),
                  )
                }
              >
                Save Report
              </ActionButton>
            </div>
          </div>
        )}
        <div className={styles.checkActions}>
          {actions.has('REQUEST_REPORT_APPROVAL') && (
            <ActionButton intent="secondary" appearance="filled" onClick={() => setRequesting(true)}>
              Request Report Approval
            </ActionButton>
          )}
          {actions.has('COMPLETE_REPORT') && (
            <ActionButton
              intent="primary"
              appearance="filled"
              loading={complete.isPending}
              onClick={() => void run(() => complete.mutateAsync(ctrtCd), t('messages.trade.reportCompleted'))}
            >
              Complete Report
            </ActionButton>
          )}
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionTitle}>Follow-up Consultations</div>
        <DataTable<TradeAdditionalConsultation> rowKey="adtnId" columns={columns} dataSource={detail.additionalConsultations ?? []} pagination={false} />
      </section>

      {requesting && (
        <ApprovalRequestPopup
          atrzProcCd={CONSULTING_REPORT_PROCESS}
          details={details}
          onSubmit={async (body) => {
            const response = await requestApproval.mutateAsync({ ctrtCd, body });
            toast.success(response.message || t('messages.approval.requested'));
            setRequesting(false);
          }}
          onClose={() => setRequesting(false)}
        />
      )}
      {answering && (
        <Popup
          open
          width={600}
          title="Answer Follow-up Consultation"
          footerAlign="right"
          onCancel={() => setAnswering(null)}
          cancelText={t('messages.dialog.cancel')}
          confirmText="Send Answer"
          confirmLoading={additional.isPending}
          confirmDisabled={!result.trim()}
          onConfirm={() =>
            void run(
              () => additional.mutateAsync({ ctrtCd, adtnId: answering.adtnId, complete: true, resultCn: result.trim(), files: resultFiles }),
              t('messages.trade.additionalAnswered'),
              () => {
                setAnswering(null);
                setResult('');
                setResultFiles([]);
              },
            )
          }
        >
          <div className={styles.notice}>{answering.rqstCn}</div>
          <TextArea rows={5} maxLength={4000} showCount placeholder="Answer to the member" value={result} onChange={(e) => setResult(e.target.value)} />
          <FileUploadBox
            accept=".pdf,.jpg,.jpeg,.png"
            fileName={resultFiles[0]?.name}
            title="Attachment (optional)"
            uploadButtonText="Select File"
            onFileSelect={setResultFiles}
            onClear={() => setResultFiles([])}
          />
        </Popup>
      )}
    </>
  );
}
