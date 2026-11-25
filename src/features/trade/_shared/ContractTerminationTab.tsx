import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import ActionButton from '@/components/common/actions/ActionButton';
import FileUploadBox from '@/components/common/file-upload/FileUploadBox';
import Popup from '@/components/common/popup/Popup';
import DataTable from '@/components/common/table/DataTable';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import AppRadio from '@/components/inputs/AppRadio';
import TextArea from '@/components/inputs/TextArea';
import { useNotify } from '@/hooks/use-notify';
import { tradeProcessCode } from '@/api/trade/trade-api';
import type { TradeAppKind, TradeContractDetail, TradeContractEnd, TradeContractKind, TradeFile } from '@/api/trade/trade-api';
import type { EndReason, FeeHandling } from '@/api/trade/trade-contract-api';
import type { ApprovalDetailRow } from '@/features/approval/_shared/ApprovalParts';
import ApprovalRequestPopup from '@/features/approval/_shared/ApprovalRequestPopup';
import { formatDmy } from '@/utils/date-format';
import { errorMessage } from '@/utils/system-utils';
import { useOpenTradeFile } from './use-trade-application-actions';
import {
  useCompleteTermination,
  useRequestTerminationApproval,
  useStartTermination,
  useUploadTerminationDocument,
} from './use-trade-contract-actions';
import styles from './trade-application-popup.module.scss';

// Termination tab (WP6, flow "close" steps 1–15 / plan §1.4): register the termination with its reason →
// termination approval → liquidation minutes (Mẫu 12) → minutes signature approval → signed minutes scan →
// [Close Contract]. Reasons by kind: consulting has no Expired; Expired needs an end date. The business guards
// (sale CMPL only after the sale with no fee open, CNCL not after the sale, …) are the server's: its message is shown.

const REASON_LABELS: Record<EndReason, string> = { CMPL: 'Completed', CNCL: 'Early termination', EXPR: 'Expired' };
const FEE_HANDLING_LABELS: Record<FeeHandling, string> = { RFND: 'Refund', CLCN: 'Collect', NONE: 'No refund' };
const END_STATUS_LABELS: Record<string, string> = {
  PREPR: 'Registered',
  DRFAPR: 'Approved',
  SGNWT: 'Awaiting Signature',
  SGNCP: 'Signed',
  CMPTN: 'Closed',
};

interface ContractTerminationTabProps {
  kind: TradeAppKind;
  contractKind: TradeContractKind;
  detail: TradeContractDetail;
  actions: Set<string>;
  details: ApprovalDetailRow[];
}

export default function ContractTerminationTab({ kind, contractKind, detail, actions, details }: ContractTerminationTabProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const ctrtCd = detail.srvcCtrtCd;
  const terminations = detail.terminations ?? [];
  const current = terminations.find((end) => end.endSttsCd !== 'CMPTN') ?? terminations[terminations.length - 1];
  const upload = useUploadTerminationDocument();
  const complete = useCompleteTermination();
  const requestApproval = useRequestTerminationApproval();
  const openFile = useOpenTradeFile();
  const [starting, setStarting] = useState(false);
  const [requesting, setRequesting] = useState<'approval' | 'signature' | null>(null);

  const run = async (task: () => Promise<unknown>, success: string) => {
    try {
      await task();
      toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const files = (list: TradeFile[] | undefined, empty: string) =>
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
            {file.downloadUrl && (
              <button type="button" className={styles.officerLink} onClick={() => openFile.mutate(file.downloadUrl as string)}>
                Download
              </button>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <div className={styles.notice}>{empty}</div>
    );

  const columns: TableColumnsType<TradeContractEnd> = [
    { title: 'Reason', dataIndex: 'endRsnCd', width: 150, render: (v?: string) => REASON_LABELS[v as EndReason] ?? v ?? '-' },
    { title: 'Fee Handling', dataIndex: 'feeHndlCd', width: 120, render: (v?: string) => FEE_HANDLING_LABELS[v as FeeHandling] ?? v ?? '-' },
    { title: 'Status', dataIndex: 'endSttsCd', width: 150, render: (v?: string) => END_STATUS_LABELS[v ?? ''] ?? v ?? '-' },
    { title: 'Closed On', dataIndex: 'endDmy', width: 110, align: 'center', render: (v?: string) => formatDmy(v) },
    { title: 'Note', dataIndex: 'endRsnCn', render: (v?: string) => v || '-' },
  ];

  return (
    <>
      {actions.has('START_TERMINATION') && (
        <div className={styles.checkActions}>
          <ActionButton intent="danger" appearance="filled" onClick={() => setStarting(true)}>
            Register Termination
          </ActionButton>
        </div>
      )}
      <DataTable<TradeContractEnd> rowKey="ctrtEndId" columns={columns} dataSource={terminations} pagination={false} />
      {current && (
        <>
          <section className={`${styles.section} ${styles.gridSpaced}`}>
            <div className={styles.sectionTitle}>Liquidation Minutes</div>
            {files(current.draftFiles, 'No minutes registered yet.')}
            {actions.has('REGISTER_TERMINATION_DRAFT') && (
              <FileUploadBox
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={upload.isPending}
                title="Select the approved liquidation minutes (Mẫu 12) — registering them sends the signature request"
                uploadButtonText="Register Minutes"
                onFileSelect={(selected) =>
                  void run(
                    () => upload.mutateAsync({ kind: contractKind, appKind: kind, ctrtCd, files: selected, as: 'draft' }),
                    t('messages.trade.minutesRegistered'),
                  )
                }
              />
            )}
          </section>
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Signed Minutes Scan</div>
            {files(current.scanFiles, 'No signed minutes yet.')}
            {actions.has('ATTACH_TERMINATION_SCAN') && (
              <FileUploadBox
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={upload.isPending}
                title="Select the scan of the minutes signed by both parties"
                uploadButtonText="Upload Signed Minutes"
                onFileSelect={(selected) =>
                  void run(
                    () => upload.mutateAsync({ kind: contractKind, appKind: kind, ctrtCd, files: selected, as: 'signed' }),
                    t('messages.trade.minutesScanAttached'),
                  )
                }
              />
            )}
          </section>
          <div className={styles.checkActions}>
            {actions.has('REQUEST_TERMINATION_APPROVAL') && (
              <ActionButton intent="secondary" appearance="filled" onClick={() => setRequesting('approval')}>
                Request Termination Approval
              </ActionButton>
            )}
            {actions.has('REQUEST_TERMINATION_SIGNATURE') && (
              <ActionButton intent="secondary" appearance="filled" onClick={() => setRequesting('signature')}>
                Request Minutes Signature Approval
              </ActionButton>
            )}
            {(actions.has('COMPLETE_TERMINATION') || (current.endSttsCd === 'SGNCP' && actions.has('ATTACH_TERMINATION_SCAN'))) && (
              <ActionButton
                intent="danger"
                appearance="filled"
                loading={complete.isPending}
                disabled={!actions.has('COMPLETE_TERMINATION')}
                onClick={() => void run(() => complete.mutateAsync({ kind: contractKind, ctrtCd }), t('messages.trade.terminated'))}
              >
                Close Contract
              </ActionButton>
            )}
          </div>
        </>
      )}

      {starting && <StartTerminationModal kind={kind} contractKind={contractKind} detail={detail} onClose={() => setStarting(false)} />}
      {requesting && (
        <ApprovalRequestPopup
          atrzProcCd={tradeProcessCode(kind, requesting === 'approval' ? 'END' : 'END_SIGN')}
          details={[...details, { label: 'Termination', value: REASON_LABELS[current?.endRsnCd as EndReason] ?? current?.endRsnCd ?? '-' }]}
          onSubmit={async (body) => {
            const response = await requestApproval.mutateAsync({ kind: contractKind, ctrtCd, step: requesting, body });
            toast.success(response.message || t('messages.approval.requested'));
            setRequesting(null);
          }}
          onClose={() => setRequesting(null)}
        />
      )}
    </>
  );
}

function StartTerminationModal({
  kind,
  contractKind,
  detail,
  onClose,
}: {
  kind: TradeAppKind;
  contractKind: TradeContractKind;
  detail: TradeContractDetail;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const start = useStartTermination();
  const reasons: EndReason[] = kind === 'consulting' ? ['CMPL', 'CNCL'] : ['CMPL', 'CNCL', 'EXPR'];
  const [reason, setReason] = useState<EndReason>('CMPL');
  const [feeHandling, setFeeHandling] = useState<FeeHandling>('NONE');
  const [note, setNote] = useState('');
  const [directTrade, setDirectTrade] = useState(false);
  const needsNote = reason === 'CNCL';

  const handleStart = async () => {
    try {
      const response = await start.mutateAsync({
        kind: contractKind,
        ctrtCd: detail.srvcCtrtCd,
        body: {
          endRsnCd: reason,
          ...(reason !== 'CMPL' ? { feeHndlCd: feeHandling } : {}),
          note: note.trim() || undefined,
          ...(kind === 'purchase' ? { drctTrdYn: directTrade ? ('Y' as const) : ('N' as const) } : {}),
        },
      });
      toast.success(response.message || t('messages.trade.terminationStarted'));
      onClose();
    } catch (error) {
      // Guard errors of the server (sale not finished, fee open, not expired, …) are shown as they come.
      toast.error(errorMessage(error));
    }
  };

  return (
    <Popup
      open
      width={600}
      title="Register Termination"
      footerAlign="right"
      onCancel={onClose}
      cancelText={t('messages.dialog.cancel')}
      onConfirm={() => void handleStart()}
      confirmText="Register"
      confirmDanger
      confirmLoading={start.isPending}
      confirmDisabled={needsNote && !note.trim()}
    >
      <div className={styles.field}>
        <span className={`${styles.fieldLabel} ${styles.required}`}>Reason</span>
        <AppRadio.Group
          value={reason}
          onChange={(e) => setReason(e.target.value as EndReason)}
          options={reasons.map((value) => ({
            value,
            label: REASON_LABELS[value],
            // Expired only for a contract with an end date (flow close step 1).
            disabled: value === 'EXPR' && !detail.ctrtEndDmy,
          }))}
        />
      </div>
      {reason !== 'CMPL' && (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Fee Handling</span>
          <AppRadio.Group
            value={feeHandling}
            onChange={(e) => setFeeHandling(e.target.value as FeeHandling)}
            options={(Object.keys(FEE_HANDLING_LABELS) as FeeHandling[]).map((value) => ({ value, label: FEE_HANDLING_LABELS[value] }))}
          />
        </div>
      )}
      {kind === 'purchase' && (
        <AppCheckbox checked={directTrade} onChange={(e) => setDirectTrade(e.target.checked)}>
          The parties traded directly
        </AppCheckbox>
      )}
      <div className={styles.field}>
        <span className={`${styles.fieldLabel} ${needsNote ? styles.required : ''}`}>{needsNote ? 'Termination Reason' : 'Note'}</span>
        <TextArea rows={3} maxLength={1000} showCount value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {needsNote && <div className={styles.notice}>{t('messages.trade.cancelNoticeHint')}</div>}
    </Popup>
  );
}
