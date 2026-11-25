import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import ActionButton from '@/components/common/actions/ActionButton';
import StatusBadge from '@/components/common/badge/StatusBadge';
import type { StatusBadgeColor } from '@/components/common/badge/StatusBadge';
import FileUploadBox from '@/components/common/file-upload/FileUploadBox';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import Popup from '@/components/common/popup/Popup';
import DataTable from '@/components/common/table/DataTable';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import AppRadio from '@/components/inputs/AppRadio';
import TextArea from '@/components/inputs/TextArea';
import { useCommonCodes } from '@/hooks/use-common-codes';
import { useNotify } from '@/hooks/use-notify';
import { RECEIPT_OFFICER_STEP } from '@/api/common/approval-api';
import { applicationNo, tradeProcessCode } from '@/api/trade/trade-api';
import type {
  TradeAppKind,
  TradeApplicationDetail,
  TradeApplicationHistory,
  TradeApplicationStatus,
  TradeCollateral,
  TradeFile,
  TradeNpl,
} from '@/api/trade/trade-api';
import ApprovalDecisionPopup from '@/features/approval/_shared/ApprovalDecisionPopup';
import ApprovalInfoPopup from '@/features/approval/_shared/ApprovalInfoPopup';
import { ApprovalStepsTable } from '@/features/approval/_shared/ApprovalParts';
import type { ApprovalDetailRow } from '@/features/approval/_shared/ApprovalParts';
import ApprovalRequestPopup from '@/features/approval/_shared/ApprovalRequestPopup';
import AssignOfficerPopup from '@/features/approval/_shared/AssignOfficerPopup';
import { formatDateTime, formatDmy } from '@/utils/date-format';
import { errorMessage, formatAmount } from '@/utils/system-utils';
import {
  useCancelApplication,
  useCheckApplicationDocuments,
  useOpenTradeFile,
  useUploadApplicationScans,
} from './use-trade-application-actions';
import {
  useChangeTradeApplicationOfficer,
  useReceiptTradeApplication,
  useRequestTradeApplicationApproval,
  useTradeApplication,
} from './use-trade-applications';
import styles from './trade-application-popup.module.scss';

// Application processing popup (VPA050101P01 purchase / 050102P01 sale / 050103P01 consulting), one component for
// the three kinds; only the target block differs. Steps of the flows (docs/*-flow-dev_20261102.html, intake):
//   7  receiver: [Receipt] with the officer in charge (required);
//   11 / 11-1c officer: scan upload; 11-1 / 11-1a / 11-2 documents complete / incomplete (+ missing note);
//   11-3 officer: [Request Approval] → approver; 11-4 approver: [Approve] / [Reject];
//   cancel 2: [Cancel Application] with a reason, before the approval.
// Buttons follow the server's `availableAction` (or `availableActions` once WP8 sends it); the officer name opens
// the officer change, like Staff in Charge of member management.

type SubPopup = 'receipt' | 'officer' | 'request' | 'approve' | 'reject' | 'info' | 'cancel' | null;

const KIND_LABELS: Record<TradeAppKind, string> = { sale: 'Sale', purchase: 'Purchase', consulting: 'Consulting' };
const STATUS_COLORS: Record<string, StatusBadgeColor> = {
  RCPT: 'orange',
  PRCS: 'blue',
  DCIN: 'red',
  DCOK: 'navy',
  CMPL: 'green',
  CNCL: 'gray',
};
const STAGE_LABELS: Record<string, string> = {
  NOT_RECEIVED: 'Not Received',
  PROCESSING: 'Processing',
  IN_APPROVAL: 'In Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};
const OPEN_STATUSES: TradeApplicationStatus[] = ['RCPT', 'PRCS', 'DCIN', 'DCOK'];
const OFFICER_STATUSES: TradeApplicationStatus[] = ['PRCS', 'DCIN', 'DCOK'];
const SCAN_ACCEPT = '.pdf,.jpg,.jpeg,.png';

const NPL_COLUMNS: TableColumnsType<TradeNpl> = [
  { title: 'NPL Code', dataIndex: 'bndCd', width: 130, render: (v?: string, r?: TradeNpl) => v || r?.cnsltTrgtNplId || '-' },
  { title: 'NPL Name', dataIndex: 'bndNm', render: (v?: string) => v || '-' },
  { title: 'Creditor', dataIndex: 'crdtrNm', width: 160, render: (v?: string) => v || '-' },
  { title: 'Loan Contract', dataIndex: 'loanCtrtNo', width: 140, render: (v?: string) => v || '-' },
  { title: 'Principal Balance', dataIndex: 'prnBlnc', width: 140, align: 'right', render: (v?: number) => formatAmount(v) },
  { title: 'Appraised Value', dataIndex: 'bndEvlAmt', width: 140, align: 'right', render: (v?: number) => formatAmount(v) },
];

const COLLATERAL_COLUMNS: TableColumnsType<TradeCollateral> = [
  { title: 'Collateral', dataIndex: 'cltrAstNm', render: (v?: string, r?: TradeCollateral) => v || r?.cltrAstCd || '-' },
  { title: 'Contract No.', dataIndex: 'cltrCtrtNo', width: 150, render: (v?: string) => v || '-' },
  { title: 'Contract Date', dataIndex: 'ctrtDmy', width: 120, align: 'center', render: (v?: string) => formatDmy(v) },
  { title: 'Characteristics', dataIndex: 'astChrcCn', render: (v?: string) => v || '-' },
];

const HISTORY_COLUMNS: TableColumnsType<TradeApplicationHistory> = [
  { title: 'Status', dataIndex: 'srvcPrcsSttsNm', width: 170, render: (v?: string, r?: TradeApplicationHistory) => v || r?.srvcPrcsSttsCd || '-' },
  { title: 'Processed At', dataIndex: 'prcsDt', width: 150, align: 'center', render: (v?: string) => formatDateTime(v) },
  { title: 'By', dataIndex: 'prcsBy', width: 130, render: (v?: string) => v || '-' },
  { title: 'Note', dataIndex: 'prcsCn', render: (v?: string) => v || '-' },
];

function nplText(detail: TradeApplicationDetail): string {
  if (detail.bndLotYn === 'Y' || detail.bndLotId) return detail.bndLotNm || detail.bndLotId || '-';
  const codes = (detail.npls ?? []).map((npl) => npl.bndCd || npl.cnsltTrgtNplId).filter(Boolean);
  return codes.length ? codes.join(', ') : detail.bndCd || '-';
}

/** Business detail rows shown in the approval / officer popups. */
function applicationDetails(kind: TradeAppKind, detail: TradeApplicationDetail): ApprovalDetailRow[] {
  const appraised = (detail.npls ?? []).reduce((sum, npl) => sum + (npl.bndEvlAmt ?? 0), 0);
  return [
    { label: 'Application No.', value: applicationNo(detail) },
    { label: 'Kind', value: KIND_LABELS[kind] },
    { label: 'Member', value: detail.mbrNm ? `${detail.mbrNm} (${detail.mbrNo ?? '-'})` : (detail.mbrNo ?? '-') },
    { label: 'NPL / LOT', value: nplText(detail) },
    ...(appraised > 0 ? [{ label: 'Appraised Value', value: formatAmount(appraised) }] : []),
  ];
}

/** Actions open to the signed-in employee: `availableActions` (WP8) when sent, else the single `availableAction`. */
function openActions(detail: TradeApplicationDetail): Set<string> {
  if (detail.availableActions?.length) return new Set(detail.availableActions);
  return new Set(detail.availableAction ? [detail.availableAction] : []);
}

function Cell({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <>
      <div className={styles.cellLabel}>{label}</div>
      <div className={`${styles.cellValue} ${wide ? styles.wide : ''}`}>{children ?? '-'}</div>
    </>
  );
}

export interface TradeApplicationPopupProps {
  kind: TradeAppKind;
  srvcAplyId: string;
  title: string;
  canWrite: boolean;
  onClose: () => void;
  /** [Edit] (WP3); hidden when absent. */
  onEdit?: (detail: TradeApplicationDetail) => void;
}

export default function TradeApplicationPopup({ kind, srvcAplyId, title, canWrite, onClose, onEdit }: TradeApplicationPopupProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const { data, isFetching, isError } = useTradeApplication(kind, srvcAplyId);
  const detail = data && data.srvcAplyId === srvcAplyId ? data : undefined;
  const consultingCodes = useCommonCodes(kind === 'consulting' ? 'CNSLT_DMND_SE_CD' : null);
  const contractKinds = useCommonCodes(kind === 'sale' ? 'CTRT_KND_CD' : null);

  const receipt = useReceiptTradeApplication();
  const changeOfficer = useChangeTradeApplicationOfficer();
  const requestApproval = useRequestTradeApplicationApproval();
  const uploadScans = useUploadApplicationScans();
  const checkDocuments = useCheckApplicationDocuments();
  const cancel = useCancelApplication();

  const [subPopup, setSubPopup] = useState<SubPopup>(null);
  const [documents, setDocuments] = useState<'Y' | 'N'>('Y');
  const [missingNote, setMissingNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelConfirmed, setCancelConfirmed] = useState(false);

  if (!detail) {
    return (
      <Popup open width={960} title={title} onCancel={onClose} cancelText={t('messages.dialog.close')}>
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? t('messages.api.requestFailed') : null}</div>
        </LoadingSpinner>
      </Popup>
    );
  }

  const status = detail.srvcPrcsSttsCd;
  const actions = canWrite ? openActions(detail) : new Set<string>();
  // WP8 sends every action in `availableActions`; older servers send one `availableAction`, then derive (§2.2).
  const serverList = !!detail.availableActions?.length;
  const isOpen = !!status && OPEN_STATUSES.includes(status);
  const canChangeOfficer = serverList ? actions.has('CHANGE_OFFICER') : canWrite && !!status && OFFICER_STATUSES.includes(status);
  const canCancel = serverList ? actions.has('CANCEL') : canWrite && isOpen;
  const canEdit = serverList ? actions.has('UPDATE') : canWrite && isOpen && detail.approvalStage !== 'IN_APPROVAL';
  const canUploadScans = serverList
    ? actions.has('ATTACH_SCAN')
    : actions.has('CHECK_DOCUMENTS') || actions.has('REQUEST_APPROVAL');
  const files = detail.files ?? [];
  const receiver = detail.rcptEmpNm ?? detail.steps?.find((s) => s.stpNm === 'RCPT')?.empNm;
  const details = applicationDetails(kind, detail);
  const rcptProcess = tradeProcessCode(kind, 'RCPT');

  const run = async (task: () => Promise<unknown>, success: string, after?: () => void) => {
    try {
      await task();
      toast.success(success);
      after?.();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleDocuments = () => {
    if (documents === 'N' && !missingNote.trim()) {
      setNoteError(t('messages.trade.missingNoteRequired'));
      return;
    }
    void run(
      () => checkDocuments.mutateAsync({ kind, id: srvcAplyId, complete: documents === 'Y', missingNote: missingNote.trim() }),
      t(documents === 'Y' ? 'messages.trade.documentsComplete' : 'messages.trade.documentsIncomplete'),
      () => setMissingNote(''),
    );
  };

  const handleScans = (selected: File[]) =>
    void run(
      () => uploadScans.mutateAsync({ kind, id: srvcAplyId, files: selected, fileUnqId: detail.esntlDcmntScnFile }),
      t('messages.trade.scansUploaded'),
    );

  const footer = (
    <div className={styles.footer}>
      <span className={styles.footerLeft}>
        {detail.atrzHstryId && (
          <ActionButton intent="quaternary" appearance="outlined" onClick={() => setSubPopup('info')}>
            Approval Info
          </ActionButton>
        )}
        {canCancel && (
          <ActionButton intent="danger" appearance="outlined" onClick={() => setSubPopup('cancel')}>
            Cancel Application
          </ActionButton>
        )}
        {canEdit && onEdit && (
          <ActionButton intent="quaternary" appearance="outlined" onClick={() => onEdit(detail)}>
            Edit
          </ActionButton>
        )}
      </span>
      {actions.has('RECEIVE') && (
        <ActionButton intent="secondary" appearance="filled" onClick={() => setSubPopup('receipt')}>
          Receipt
        </ActionButton>
      )}
      {actions.has('REQUEST_APPROVAL') && (
        <ActionButton intent="secondary" appearance="filled" onClick={() => setSubPopup('request')}>
          Request Approval
        </ActionButton>
      )}
      {actions.has('DECIDE') && detail.atrzHstryId && (
        <>
          <ActionButton intent="danger" appearance="outlined" onClick={() => setSubPopup('reject')}>
            Reject
          </ActionButton>
          <ActionButton intent="primary" appearance="filled" onClick={() => setSubPopup('approve')}>
            Approve
          </ActionButton>
        </>
      )}
      <ActionButton action="close" onClick={onClose}>
        {t('messages.dialog.close')}
      </ActionButton>
    </div>
  );

  return (
    <>
      <Popup open width={1000} title={`${title} — ${applicationNo(detail)}`} onCancel={onClose} footer={footer}>
        {/* Record key for tests and hand-offs; screens show the readable number only. */}
        <span hidden data-record-key={srvcAplyId} />
        <div className={styles.header}>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Status</span>
            <span>
              <StatusBadge color={STATUS_COLORS[status ?? ''] ?? 'gray'}>{detail.srvcPrcsSttsNm || status || '-'}</StatusBadge>
            </span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Approval Stage</span>
            <span className={styles.headerValue}>{STAGE_LABELS[detail.approvalStage ?? ''] ?? detail.approvalStage ?? '-'}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Channel / Date</span>
            <span className={styles.headerValue}>
              {detail.aplyPathCd === 'MANL' ? 'Manual' : 'Web'} · {formatDmy(detail.srvcAplyDmy)}
            </span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Applicant</span>
            <span className={styles.headerValue}>
              {detail.mbrNm || '-'} ({detail.mbrNo || '-'})
            </span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Receiver</span>
            <span className={styles.headerValue}>{receiver || '-'}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Officer in Charge</span>
            {canChangeOfficer ? (
              <button type="button" className={styles.officerLink} title="Change the officer in charge" onClick={() => setSubPopup('officer')}>
                {detail.tkcgEmpNm || detail.tkcgEmpNo || 'Assign'}
              </button>
            ) : (
              <span className={styles.headerValue}>{detail.tkcgEmpNm || detail.tkcgEmpNo || '-'}</span>
            )}
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Contract</span>
            <span className={styles.headerValue}>{detail.srvcCtrtNo || detail.srvcCtrtCd || '-'}</span>
          </div>
        </div>

        {detail.activePurchaseCtrtCd && (
          <div className={styles.warning}>
            A purchase contract for the same subject is still running ({detail.activePurchaseCtrtCd}); the approval request will be refused.
          </div>
        )}
        {detail.cnclRsnCn && <div className={styles.warning}>Cancellation reason: {detail.cnclRsnCn}</div>}
        {detail.rjctRsnCn && detail.approvalStage === 'REJECTED' && (
          <div className={styles.warning}>Rejection reason: {detail.rjctRsnCn}</div>
        )}

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Application</div>
          <div className={styles.grid}>
            {kind === 'consulting' ? (
              <>
                <Cell label="Consulting Type">
                  {consultingCodes.find((c) => c.value === detail.cnsltDmndSeCd)?.label ?? detail.cnsltDmndSeCd ?? '-'}
                </Cell>
                <Cell label="Source Inquiry">{detail.srcInqryPstNo || '-'}</Cell>
                <Cell label="Request" wide>
                  {detail.cnsltDmndPrpsCn || '-'}
                </Cell>
              </>
            ) : (
              <>
                <Cell label={detail.bndLotYn === 'Y' ? 'LOT' : 'NPL'}>{nplText(detail)}</Cell>
                <Cell label={kind === 'sale' ? 'Desired Sale Price' : 'Proposed Purchase Price'}>
                  {detail.prpDsplPrc !== undefined ? `${formatAmount(detail.prpDsplPrc)} ${detail.crncCd ?? ''}` : '-'}
                </Cell>
                {kind === 'sale' && (
                  <>
                    <Cell label="Contract Kind">
                      {contractKinds.find((c) => c.value === detail.ctrtKndCd)?.label ?? detail.ctrtKndCd ?? '-'}
                    </Cell>
                    <Cell label="Base Contract">{detail.baseCtrtCd || '-'}</Cell>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {(detail.npls?.length ?? 0) > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>{kind === 'consulting' ? 'Consulting Targets' : 'NPLs'}</div>
            <DataTable<TradeNpl>
              rowKey={(r) => r.bndCd || r.cnsltTrgtNplId || r.loanCtrtNo || ''}
              columns={NPL_COLUMNS}
              dataSource={detail.npls}
              pagination={false}
            />
          </section>
        )}
        {kind === 'consulting' && (detail.collaterals?.length ?? 0) > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Collaterals</div>
            <DataTable<TradeCollateral>
              rowKey={(r) => r.cltrAstCd || r.cltrCtrtNo || r.cltrAstNm || ''}
              columns={COLLATERAL_COLUMNS}
              dataSource={detail.collaterals}
              pagination={false}
            />
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Documents</div>
          <div className={styles.grid}>
            <Cell label="Documents Check">
              {detail.dcmntCmpltYn === 'Y' ? 'Complete' : detail.dcmntCmpltYn === 'N' ? 'Incomplete' : 'Not checked'}
            </Cell>
            <Cell label="Checked At">{formatDateTime(detail.dcmntChckDt)}</Cell>
            {detail.msngDcmntCn && (
              <Cell label="Missing Documents" wide>
                {detail.msngDcmntCn}
              </Cell>
            )}
          </div>
          <ScanList files={files} />
          {canUploadScans && (
            <FileUploadBox
              accept={SCAN_ACCEPT}
              multiple
              disabled={uploadScans.isPending}
              title="Select or drag the scanned documents (PDF, JPG, PNG)"
              uploadButtonText="Upload Scans"
              onFileSelect={handleScans}
            />
          )}
          {actions.has('CHECK_DOCUMENTS') && (
            <div className={styles.checkForm}>
              <AppRadio.Group
                value={documents}
                onChange={(e) => {
                  setDocuments(e.target.value as 'Y' | 'N');
                  setNoteError('');
                }}
                options={[
                  { label: 'Documents complete', value: 'Y' },
                  { label: 'Documents incomplete', value: 'N' },
                ]}
              />
              {documents === 'N' && (
                <>
                  <TextArea
                    rows={3}
                    maxLength={1000}
                    showCount
                    placeholder="Missing documents (told to the applicant by phone / e-mail / Zalo)"
                    value={missingNote}
                    onChange={(e) => {
                      setMissingNote(e.target.value);
                      setNoteError('');
                    }}
                  />
                  {noteError && <div className={styles.error}>{noteError}</div>}
                </>
              )}
              {/* Q-U5 (plan proposal): the scan must be uploaded before the documents are marked complete. */}
              {documents === 'Y' && files.length === 0 && <div className={styles.error}>{t('messages.trade.scanRequired')}</div>}
              <div className={styles.checkActions}>
                <ActionButton
                  intent="primary"
                  appearance="filled"
                  loading={checkDocuments.isPending}
                  disabled={documents === 'Y' && files.length === 0}
                  onClick={handleDocuments}
                >
                  {documents === 'Y' ? 'Mark Documents Complete' : 'Mark Documents Incomplete'}
                </ActionButton>
              </div>
            </div>
          )}
        </section>

        {(detail.steps?.length ?? 0) > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Approval Progress</div>
            <ApprovalStepsTable steps={detail.steps ?? []} />
          </section>
        )}

        {(detail.histories?.length ?? 0) > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Processing History</div>
            <DataTable<TradeApplicationHistory>
              rowKey={(r) => `${r.srvcPrcsSttsCd}-${r.prcsDt}`}
              columns={HISTORY_COLUMNS}
              dataSource={detail.histories}
              pagination={false}
            />
          </section>
        )}
      </Popup>

      {subPopup === 'receipt' && (
        <AssignOfficerPopup
          atrzProcCd={rcptProcess}
          stpNo={RECEIPT_OFFICER_STEP}
          title="Receipt"
          confirmText="Receipt"
          details={details}
          submitting={receipt.isPending}
          onSubmit={(empNo) =>
            void run(() => receipt.mutateAsync({ kind, id: srvcAplyId, tkcgEmpNo: empNo }), t('messages.trade.received'), () =>
              setSubPopup(null),
            )
          }
          onClose={() => setSubPopup(null)}
        />
      )}
      {subPopup === 'officer' && (
        <AssignOfficerPopup
          atrzProcCd={rcptProcess}
          stpNo={RECEIPT_OFFICER_STEP}
          atrzHstryId={detail.atrzHstryId}
          title="Change Officer in Charge"
          confirmText="Change"
          details={[...details, { label: 'Current Officer', value: detail.tkcgEmpNm || detail.tkcgEmpNo || '-' }]}
          currentEmpNo={detail.tkcgEmpNo}
          submitting={changeOfficer.isPending}
          onSubmit={(empNo) =>
            void run(
              () => changeOfficer.mutateAsync({ kind, id: srvcAplyId, tkcgEmpNo: empNo }),
              t('messages.trade.officerChanged'),
              () => setSubPopup(null),
            )
          }
          onClose={() => setSubPopup(null)}
        />
      )}
      {subPopup === 'request' && (
        <ApprovalRequestPopup
          atrzProcCd={rcptProcess}
          atrzHstryId={detail.atrzHstryId}
          details={details}
          onSubmit={async (body) => {
            const response = await requestApproval.mutateAsync({ kind, id: srvcAplyId, body });
            toast.success(response.message || t('messages.approval.requested'));
            setSubPopup(null);
          }}
          onClose={() => setSubPopup(null)}
        />
      )}
      {detail.atrzHstryId && (subPopup === 'approve' || subPopup === 'reject') && (
        <ApprovalDecisionPopup atrzHstryId={detail.atrzHstryId} mode={subPopup} target={applicationNo(detail)} details={details} onClose={() => setSubPopup(null)} />
      )}
      {detail.atrzHstryId && subPopup === 'info' && <ApprovalInfoPopup atrzHstryId={detail.atrzHstryId} target={applicationNo(detail)} onClose={() => setSubPopup(null)} />}
      {subPopup === 'cancel' && (
        <Popup
          open
          width={560}
          title="Cancel Application"
          footerAlign="right"
          onCancel={() => setSubPopup(null)}
          cancelText={t('messages.dialog.cancel')}
          onConfirm={() =>
            void run(() => cancel.mutateAsync({ kind, id: srvcAplyId, reason: cancelReason.trim() }), t('messages.trade.cancelled'), () => {
              setSubPopup(null);
              setCancelReason('');
              setCancelConfirmed(false);
            })
          }
          confirmText="Submit"
          confirmDanger
          confirmLoading={cancel.isPending}
          confirmDisabled={!cancelReason.trim() || !cancelConfirmed}
        >
          <div className={styles.notice}>{t('messages.trade.cancelHint')}</div>
          <TextArea
            rows={4}
            maxLength={1000}
            showCount
            placeholder="Cancellation reason (required)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <AppCheckbox checked={cancelConfirmed} onChange={(e) => setCancelConfirmed(e.target.checked)}>
            {t('messages.trade.confirmCancel')}
          </AppCheckbox>
        </Popup>
      )}
    </>
  );
}

function ScanList({ files }: { files: TradeFile[] }) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const openFile = useOpenTradeFile();
  if (files.length === 0) return <div className={styles.notice}>No scanned documents yet.</div>;
  const open = (url: string) => openFile.mutate(url, { onError: (error) => toast.error(errorMessage(error, t('messages.api.requestFailed'))) });
  return (
    <ul className={styles.files}>
      {files.map((file) => (
        <li key={`${file.fileUnqId}-${file.fileSeq}`} className={styles.fileItem}>
          <span>{file.fileNm || file.fileUnqId}</span>
          {file.fileSz !== undefined && <span className={styles.fileSize}>{formatAmount(Math.ceil(file.fileSz / 1024))} KB</span>}
          {file.previewUrl && (
            <button type="button" className={styles.officerLink} onClick={() => open(file.previewUrl as string)}>
              Preview
            </button>
          )}
          {file.downloadUrl && (
            <button type="button" className={styles.officerLink} onClick={() => open(file.downloadUrl as string)}>
              Download
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
