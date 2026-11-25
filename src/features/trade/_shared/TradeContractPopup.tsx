import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import ActionButton from '@/components/common/actions/ActionButton';
import StatusBadge from '@/components/common/badge/StatusBadge';
import FileUploadBox from '@/components/common/file-upload/FileUploadBox';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import Popup from '@/components/common/popup/Popup';
import ProgressStepper from '@/components/common/progress-stepper/ProgressStepper';
import DataTable from '@/components/common/table/DataTable';
import AppDatePicker from '@/components/inputs/AppDatePicker';
import { useNotify } from '@/hooks/use-notify';
import { useAuthStore } from '@/stores/auth-store';
import { APPROVAL_STAGE_LABELS, RECEIPT_OFFICER_STEP, approvalStageOf } from '@/api/common/approval-api';
import { TRADE_CONTRACT_KIND, contractNo, tradeProcessCode } from '@/api/trade/trade-api';
import type { TradeAppKind, TradeContractDetail, TradeContractFee, TradeContractListItem, TradeFile, TradeNpl } from '@/api/trade/trade-api';
import type { ContractApprovalHistory } from '@/api/trade/trade-contract-api';
import ApprovalDecisionPopup from '@/features/approval/_shared/ApprovalDecisionPopup';
import ApprovalInfoPopup from '@/features/approval/_shared/ApprovalInfoPopup';
import type { ApprovalDetailRow } from '@/features/approval/_shared/ApprovalParts';
import { SessionStatusBadge } from '@/features/approval/_shared/ApprovalParts';
import ApprovalRequestPopup from '@/features/approval/_shared/ApprovalRequestPopup';
import AssignOfficerPopup from '@/features/approval/_shared/AssignOfficerPopup';
import { formatDateTime, formatDmy } from '@/utils/date-format';
import { errorMessage, formatAmount } from '@/utils/system-utils';
import ContractDraftForm from './ContractDraftForm';
import ConsultingReportTab from './ConsultingReportTab';
import ContractTerminationTab from './ContractTerminationTab';
import { CreateAnnexModal, DeliveryModal, FeeReceiptModal, RenewalDecisionModal, TradeCompletionModal } from './ContractExecutionModals';
import { contractActions } from './contract-actions';
import { useMemberLookup } from './use-trade-application-form';
import { useOpenTradeFile } from './use-trade-application-actions';
import {
  useAssignConsultant,
  useChangeContractOfficer,
  useConcludeContract,
  useContractApprovalHistories,
  useRequestContractApproval,
  useUploadContractDocument,
} from './use-trade-contract-actions';
import { useTradeContract } from './use-trade-contracts';
import styles from './trade-application-popup.module.scss';

// Contract register-edit popup (VPA050201P01 purchase / 050202P01 sale / 050203P01 consulting — no design for
// consulting, Q-U2: same layout). Core lifecycle (WP4, flow "contract" steps 2–16): terms (PREPR) → draft approval
// → [Register Draft] (signature request mail) → signature approval ("Signing Complete" by the approver) → signed
// scan → [Conclude] (PROGS). Execution (WP5): fees, sale completion / trade conclusion + delivery, annexes (same
// lifecycle in this popup), renewal decision. Buttons follow `availableActions` of the detail (WP8); the decision
// uses `openAtrzHstryId`. The officer name opens the officer change, like the member Staff in Charge.

type SubPopup =
  | { type: 'officer' | 'consultant' | 'requestDraft' | 'requestSignature' | 'approve' | 'reject' | 'trade' | 'delivery' | 'annex' | 'renewal' }
  | { type: 'info'; atrzHstryId: string }
  | { type: 'fee'; fee: TradeContractFee; refund: boolean }
  | null;

const LIFECYCLE = ['PREPR', 'DRFAPR', 'SGNWT', 'SGNCP', 'PROGS', 'ENDING', 'CMPTN'];
const LIFECYCLE_LABELS = ['Preparing', 'Draft Approved', 'Awaiting Signature', 'Signed', 'In Effect', 'Terminating', 'Closed'];
const ANNEX_LABELS: Record<string, string> = { EXTN: 'Term extension', PRCE: 'Price change', POST: 'After the sale', ETC: 'Other' };
const SCAN_ACCEPT = '.pdf,.jpg,.jpeg,.png';

const NPL_COLUMNS: TableColumnsType<TradeNpl> = [
  { title: 'NPL Code', dataIndex: 'bndCd', width: 130, render: (v?: string, r?: TradeNpl) => v || r?.cnsltTrgtNplId || '-' },
  { title: 'NPL Name', dataIndex: 'bndNm', render: (v?: string) => v || '-' },
  { title: 'Creditor', dataIndex: 'crdtrNm', width: 170, render: (v?: string) => v || '-' },
  { title: 'Principal Balance', dataIndex: 'prnBlnc', width: 140, align: 'right', render: (v?: number) => formatAmount(v) },
  { title: 'Listed', dataIndex: 'expsrYn', width: 70, align: 'center', render: (v?: string) => v || '-' },
  { title: 'Status', dataIndex: 'bndSttsCd', width: 70, align: 'center', render: (v?: string) => v || '-' },
];

function isAnnexOf(detail: TradeContractDetail): boolean {
  return !!detail.mstCtrtCd && detail.mstCtrtCd !== detail.srvcCtrtCd;
}

export interface TradeContractPopupProps {
  kind: TradeAppKind;
  srvcCtrtCd: string;
  title: string;
  canWrite: boolean;
  onClose: () => void;
}

export default function TradeContractPopup({ kind, srvcCtrtCd, title, canWrite, onClose }: TradeContractPopupProps) {
  const { t } = useTranslation();
  const contractKind = TRADE_CONTRACT_KIND[kind];
  // Annexes open in the same popup; [Back] returns to the main contract.
  const [stack, setStack] = useState<string[]>([srvcCtrtCd]);
  const current = stack[stack.length - 1];
  const { data, isFetching, isError } = useTradeContract(contractKind, current);
  const detail = data && data.srvcCtrtCd === current ? data : undefined;

  if (!detail) {
    return (
      <Popup open width={1040} title={title} onCancel={onClose} cancelText={t('messages.dialog.close')}>
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? t('messages.api.requestFailed') : null}</div>
        </LoadingSpinner>
      </Popup>
    );
  }
  return (
    <ContractView
      key={detail.srvcCtrtCd}
      kind={kind}
      detail={detail}
      title={title}
      canWrite={canWrite}
      onClose={onClose}
      onOpen={(code) => setStack((prev) => [...prev, code])}
      onBack={stack.length > 1 ? () => setStack((prev) => prev.slice(0, -1)) : undefined}
    />
  );
}

interface ContractViewProps {
  kind: TradeAppKind;
  detail: TradeContractDetail;
  title: string;
  canWrite: boolean;
  onClose: () => void;
  onOpen: (srvcCtrtCd: string) => void;
  onBack?: () => void;
}

function ContractView({ kind, detail, title, canWrite, onClose, onOpen, onBack }: ContractViewProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const me = useAuthStore((s) => s.user?.usrId);
  const contractKind = TRADE_CONTRACT_KIND[kind];
  const ctrtCd = detail.srvcCtrtCd;
  const isAnnex = isAnnexOf(detail);
  const actions = contractActions(detail, me, kind, canWrite);
  const { data: member } = useMemberLookup(detail.mbrNo ?? null);
  const { data: histories = [] } = useContractApprovalHistories(contractKind, ctrtCd);
  const changeOfficer = useChangeContractOfficer();
  const assignConsultant = useAssignConsultant();
  const requestApproval = useRequestContractApproval();
  const uploadDocument = useUploadContractDocument();
  const conclude = useConcludeContract();
  const openFile = useOpenTradeFile();
  const [sub, setSub] = useState<SubPopup>(null);
  const [cnclsDt, setCnclsDt] = useState<Dayjs | null>(dayjs());

  const status = detail.ctrtSttsCd ?? '';
  const openSession = detail.openAtrzHstryId ?? (detail.atrzSttsCd === 'INPROGRESS' ? detail.atrzHstryId : undefined);
  const stepIndex = Math.max(0, LIFECYCLE.indexOf(status === 'CNCLN' ? 'CMPTN' : status));
  const draftProcess = tradeProcessCode(kind, isAnnex ? 'ANX' : 'CTRT');
  const details: ApprovalDetailRow[] = [
    { label: isAnnex ? 'Annex No.' : 'Contract No.', value: contractNo(detail) },
    { label: 'Member', value: detail.mbrNm ? `${detail.mbrNm} (${detail.mbrNo ?? '-'})` : (detail.mbrNo ?? '-') },
    { label: 'NPL', value: (detail.npls ?? []).map((n) => n.bndCd).filter(Boolean).join(', ') || '-' },
    { label: 'Price', value: detail.prpPrc !== undefined ? `${formatAmount(detail.prpPrc)} ${detail.crncCd ?? ''}` : '-' },
    { label: 'Fee', value: detail.feeAmt !== undefined ? formatAmount(detail.feeAmt) : '-' },
  ];

  const run = async (task: () => Promise<{ message?: string } | unknown>, success: string) => {
    try {
      await task();
      toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  const close = () => setSub(null);
  const open = (url?: string) =>
    url && openFile.mutate(url, { onError: (error) => toast.error(errorMessage(error)) });

  const fileList = (files: TradeFile[] | undefined, empty: string) =>
    files?.length ? (
      <ul className={styles.files}>
        {files.map((file) => (
          <li key={`${file.fileUnqId}-${file.fileSeq}`} className={styles.fileItem}>
            <span>{file.fileNm}</span>
            {file.previewUrl && (
              <button type="button" className={styles.officerLink} onClick={() => open(file.previewUrl)}>
                Preview
              </button>
            )}
            {file.downloadUrl && (
              <button type="button" className={styles.officerLink} onClick={() => open(file.downloadUrl)}>
                Download
              </button>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <div className={styles.notice}>{empty}</div>
    );

  const feeColumns: TableColumnsType<TradeContractFee> = [
    { title: 'No', dataIndex: 'feeSeq', width: 50, align: 'center' },
    { title: 'Type', dataIndex: 'feeSeCd', width: 100, render: (v?: string) => (v === 'PRAMT' ? 'Advance' : v === 'BALNC' ? 'Balance' : v || '-') },
    { title: 'Amount', dataIndex: 'fee', width: 140, align: 'right', render: (v?: number, r?: TradeContractFee) => `${formatAmount(v)} ${r?.crncCd ?? ''}` },
    { title: 'Due', dataIndex: 'feePayTermDmy', width: 110, align: 'center', render: (v?: string) => formatDmy(v) },
    { title: 'Paid', dataIndex: 'feeRcptYn', width: 70, align: 'center', render: (v?: string) => (v === 'Y' ? 'Paid' : 'Unpaid') },
    { title: 'Paid On', dataIndex: 'feeRcptIdntyDmy', width: 110, align: 'center', render: (v?: string) => formatDmy(v) },
    { title: 'Received', dataIndex: 'rcptAmt', width: 130, align: 'right', render: (v?: number) => formatAmount(v) },
    { title: 'Refund', dataIndex: 'rfndSttsCd', width: 110, render: (v?: string, r?: TradeContractFee) => (v ? `${v === 'RFPL' ? 'Planned' : 'Refunded'} ${r?.rfndAmt ? formatAmount(r.rfndAmt) : ''}` : '-') },
    {
      title: '',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_v, fee) => (
        <>
          {actions.has('CONFIRM_FEE') && fee.feeRcptYn !== 'Y' && (
            <ActionButton size="small" intent="primary" appearance="filled" onClick={() => setSub({ type: 'fee', fee, refund: false })}>
              Confirm
            </ActionButton>
          )}
          {actions.has('REFUND_FEE') && fee.rfndSttsCd === 'RFPL' && (
            <ActionButton size="small" intent="danger" appearance="outlined" onClick={() => setSub({ type: 'fee', fee, refund: true })}>
              Refund
            </ActionButton>
          )}
        </>
      ),
    },
  ];

  const annexColumns: TableColumnsType<TradeContractListItem> = [
    {
      title: 'Annex',
      dataIndex: 'srvcCtrtNo',
      render: (_v, r) => (
        <button type="button" className={styles.officerLink} onClick={() => onOpen(r.srvcCtrtCd)}>
          {contractNo(r)}
        </button>
      ),
    },
    { title: 'Purpose', dataIndex: 'anxPrpsCd', width: 140, render: (v?: string) => (v && ANNEX_LABELS[v]) || v || '-' },
    { title: 'Status', dataIndex: 'ctrtSttsNm', width: 150, render: (v?: string, r?: TradeContractListItem) => v || r?.ctrtSttsCd || '-' },
    { title: 'Concluded', dataIndex: 'ctrtCnclsDmy', width: 110, align: 'center', render: (v?: string) => formatDmy(v) },
  ];

  const historyColumns: TableColumnsType<ContractApprovalHistory> = [
    { title: 'Stage', dataIndex: 'atrzProcCd', width: 210, render: (v?: string) => APPROVAL_STAGE_LABELS[approvalStageOf(v)] },
    { title: 'Status', dataIndex: 'atrzSttsCd', width: 110, align: 'center', render: (v?: string) => <SessionStatusBadge status={v} /> },
    { title: 'Requester', dataIndex: 'requesterEmpNo', width: 100, render: (v?: string) => v || '-' },
    { title: 'Approver', dataIndex: 'approverEmpNm', width: 170, render: (v?: string, r?: ContractApprovalHistory) => v || r?.approverEmpNo || '-' },
    { title: 'Requested', dataIndex: 'requestedAt', width: 130, align: 'center', render: (v?: string) => formatDateTime(v) },
    { title: 'Decided', dataIndex: 'decidedAt', width: 130, align: 'center', render: (v?: string) => formatDateTime(v) },
    { title: 'Comment', dataIndex: 'comment', render: (v?: string) => v || '-' },
    {
      title: '',
      key: 'info',
      width: 70,
      render: (_v, row) => (
        <ActionButton size="small" intent="text" onClick={() => setSub({ type: 'info', atrzHstryId: row.atrzHstryId })}>
          Info
        </ActionButton>
      ),
    },
  ];

  const tabs = [
    {
      key: 'contract',
      label: 'Contract',
      children: (
        <>
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Parties</div>
            <div className={styles.grid}>
              <div className={styles.cellLabel}>Customer</div>
              <div className={styles.cellValue}>
                {member?.mbrNm || member?.orgnzNm || detail.mbrNm || '-'} ({detail.mbrNo ?? '-'}) · {member?.mbrTypeNm ?? '-'}
              </div>
              <div className={styles.cellLabel}>Customer Contact</div>
              <div className={styles.cellValue}>{[member?.telno, member?.emlAddr].filter(Boolean).join(' · ') || '-'}</div>
              <div className={styles.cellLabel}>Broker</div>
              {/* Q-U3 / §6.2: VAMC representative, POA number and fee account have no column yet (WP8). */}
              <div className={`${styles.cellValue} ${styles.wide}`}>VAMC — representative, authorisation and fee account from the system settings (pending Q-U3)</div>
            </div>
          </section>
          {(detail.npls?.length ?? 0) > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionTitle}>NPLs</div>
              <DataTable<TradeNpl> rowKey={(r) => r.bndCd || r.cnsltTrgtNplId || ''} columns={NPL_COLUMNS} dataSource={detail.npls} pagination={false} />
            </section>
          )}
          <section className={styles.section}>
            <div className={styles.sectionTitle}>{isAnnex ? `Annex Terms — ${ANNEX_LABELS[detail.anxPrpsCd ?? ''] ?? detail.anxPrpsCd ?? ''}` : 'Contract Terms'}</div>
            <ContractDraftForm kind={kind} contractKind={contractKind} detail={detail} isAnnex={isAnnex} editable={actions.has('UPDATE_DRAFT')} />
            {(detail.trdCnclsDmy || detail.dlvrCmptnDmy) && (
              <div className={`${styles.grid} ${styles.gridSpaced}`}>
                <div className={styles.cellLabel}>{kind === 'sale' ? 'Sale Completed' : 'Agreement Signed'}</div>
                <div className={styles.cellValue}>{formatDmy(detail.trdCnclsDmy)}</div>
                <div className={styles.cellLabel}>Delivery</div>
                <div className={styles.cellValue}>
                  {formatDmy(detail.dlvrCmptnDmy)} {detail.dlvrCn ?? ''}
                </div>
              </div>
            )}
          </section>
        </>
      ),
    },
    {
      key: 'documents',
      label: 'Documents',
      children: (
        <>
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Draft Contract</div>
            {fileList(detail.draftFiles, 'No draft registered yet.')}
            {actions.has('REGISTER_DRAFT') && (
              <FileUploadBox
                accept={SCAN_ACCEPT}
                disabled={uploadDocument.isPending}
                title="Select the approved draft (PDF) — registering it sends the signature request to the customer"
                uploadButtonText="Register Draft"
                onFileSelect={(files) =>
                  void run(
                    () => uploadDocument.mutateAsync({ kind: contractKind, appKind: kind, ctrtCd, files, as: 'draft' }),
                    t('messages.trade.documentRegistered'),
                  )
                }
              />
            )}
          </section>
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Signed Contract Scan</div>
            {fileList(detail.scanFiles, 'No signed scan yet.')}
            {actions.has('ATTACH_SIGNED_SCAN') && (
              <FileUploadBox
                accept={SCAN_ACCEPT}
                disabled={uploadDocument.isPending}
                title="Select the scan of the contract signed by both parties"
                uploadButtonText="Upload Signed Scan"
                onFileSelect={(files) =>
                  void run(
                    () => uploadDocument.mutateAsync({ kind: contractKind, appKind: kind, ctrtCd, files, as: 'signed' }),
                    t('messages.trade.signedScanAttached'),
                  )
                }
              />
            )}
            {(actions.has('CONCLUDE') || (status === 'SGNCP' && actions.has('ATTACH_SIGNED_SCAN'))) && (
              <div className={`${styles.inlineForm} ${styles.gridSpaced}`}>
                <span className={styles.fieldLabel}>Conclusion Date</span>
                <AppDatePicker format="DD/MM/YYYY" value={cnclsDt} onChange={(d) => setCnclsDt(d)} />
                <ActionButton
                  intent="primary"
                  appearance="filled"
                  loading={conclude.isPending}
                  disabled={!actions.has('CONCLUDE') || !detail.scanFiles?.length}
                  onClick={() =>
                    void run(
                      () => conclude.mutateAsync({ kind: contractKind, ctrtCd, cnclsDt: cnclsDt?.format('YYYY-MM-DD') }),
                      t('messages.trade.concluded'),
                    )
                  }
                >
                  Complete Signing
                </ActionButton>
              </div>
            )}
          </section>
        </>
      ),
    },
    {
      key: 'fees',
      label: `Fees (${detail.fees?.length ?? 0})`,
      children: <DataTable<TradeContractFee> rowKey="feeId" columns={feeColumns} dataSource={detail.fees ?? []} pagination={false} />,
    },
    ...(kind !== 'consulting' && !isAnnex
      ? [
          {
            key: 'annexes',
            label: `Annexes (${detail.annexes?.length ?? 0})`,
            children: (
              <>
                {actions.has('CREATE_ANNEX') && (
                  <div className={styles.checkActions}>
                    <ActionButton intent="secondary" appearance="filled" onClick={() => setSub({ type: 'annex' })}>
                      Create Annex
                    </ActionButton>
                  </div>
                )}
                <DataTable<TradeContractListItem> rowKey="srvcCtrtCd" columns={annexColumns} dataSource={detail.annexes ?? []} pagination={false} />
              </>
            ),
          },
        ]
      : []),
    ...(kind === 'consulting'
      ? [
          {
            key: 'report',
            label: `Report & Follow-up (${detail.additionalConsultations?.length ?? 0})`,
            children: <ConsultingReportTab detail={detail} actions={actions} details={details} />,
          },
        ]
      : []),
    ...(!isAnnex
      ? [
          {
            key: 'termination',
            label: `Termination (${detail.terminations?.length ?? 0})`,
            children: <ContractTerminationTab kind={kind} contractKind={contractKind} detail={detail} actions={actions} details={details} />,
          },
        ]
      : []),
    {
      key: 'approvals',
      label: 'Approval History',
      children: <DataTable<ContractApprovalHistory> rowKey="atrzHstryId" columns={historyColumns} dataSource={histories} pagination={false} />,
    },
  ];

  const footer = (
    <div className={styles.footer}>
      <span className={styles.footerLeft}>
        {onBack && (
          <ActionButton intent="quaternary" appearance="outlined" onClick={onBack}>
            Back to Contract
          </ActionButton>
        )}
        {openSession && (
          <ActionButton intent="quaternary" appearance="outlined" onClick={() => setSub({ type: 'info', atrzHstryId: openSession })}>
            Approval Info
          </ActionButton>
        )}
        {actions.has('DECIDE_RENEWAL') && (
          <ActionButton intent="quaternary" appearance="outlined" onClick={() => setSub({ type: 'renewal' })}>
            Renewal Decision
          </ActionButton>
        )}
      </span>
      {actions.has('REQUEST_DRAFT_APPROVAL') && (
        <ActionButton intent="secondary" appearance="filled" onClick={() => setSub({ type: 'requestDraft' })}>
          Request Draft Approval
        </ActionButton>
      )}
      {actions.has('REQUEST_SIGNATURE_APPROVAL') && (
        <ActionButton intent="secondary" appearance="filled" onClick={() => setSub({ type: 'requestSignature' })}>
          Request Signature Approval
        </ActionButton>
      )}
      {(actions.has('COMPLETE_SALE') || actions.has('CONCLUDE_TRADE')) && (
        <ActionButton intent="secondary" appearance="filled" onClick={() => setSub({ type: 'trade' })}>
          {kind === 'sale' ? 'Sale Completion' : 'Sale and Purchase Agreement'}
        </ActionButton>
      )}
      {actions.has('RECORD_DELIVERY') && (
        <ActionButton intent="secondary" appearance="filled" onClick={() => setSub({ type: 'delivery' })}>
          Record Delivery
        </ActionButton>
      )}
      {actions.has('DECIDE') && openSession && (
        <>
          <ActionButton intent="danger" appearance="outlined" onClick={() => setSub({ type: 'reject' })}>
            Reject
          </ActionButton>
          <ActionButton intent="primary" appearance="filled" onClick={() => setSub({ type: 'approve' })}>
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
      <Popup open width={1080} title={`${title} — ${isAnnex ? 'Annex ' : ''}${contractNo(detail)}`} onCancel={onClose} footer={footer}>
        {/* Record key for tests and hand-offs; screens show the readable number only. */}
        <span hidden data-record-key={ctrtCd} />
        <ProgressStepper
          className={styles.stepper}
          current={stepIndex}
          steps={LIFECYCLE_LABELS.map((label, index) => ({ key: LIFECYCLE[index], label: index === 6 && status === 'CNCLN' ? 'Cancelled' : label }))}
        />
        <div className={styles.header}>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Status</span>
            <span>
              <StatusBadge color={status === 'PROGS' ? 'green' : status === 'CNCLN' ? 'gray' : 'blue'}>{detail.ctrtSttsNm || status}</StatusBadge>
            </span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Application</span>
            <span className={styles.headerValue}>{detail.srvcAplyNo || detail.srvcAplyId || '-'}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Officer in Charge</span>
            {actions.has('CHANGE_OFFICER') ? (
              <button type="button" className={styles.officerLink} title="Change the officer in charge" onClick={() => setSub({ type: 'officer' })}>
                {detail.tkcgEmpNm || detail.tkcgEmpNo || 'Assign'}
              </button>
            ) : (
              <span className={styles.headerValue}>{detail.tkcgEmpNm || detail.tkcgEmpNo || '-'}</span>
            )}
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Approval</span>
            <span className={styles.headerValue}>
              {detail.openApproval
                ? `${APPROVAL_STAGE_LABELS[approvalStageOf(detail.openApproval.atrzProcCd)]} → ${detail.openApproval.approverEmpNm ?? detail.openApproval.approverEmpNo ?? '-'}`
                : '-'}
            </span>
          </div>
          {kind === 'consulting' && (
            <div className={styles.headerItem}>
              <span className={styles.headerLabel}>Consultant</span>
              {actions.has('ASSIGN_CONSULTANT') ? (
                <button type="button" className={styles.officerLink} title="Assign the consultant" onClick={() => setSub({ type: 'consultant' })}>
                  {detail.cnsltEmpNm || detail.cnsltEmpNo || 'Assign'}
                </button>
              ) : (
                <span className={styles.headerValue}>{detail.cnsltEmpNm || detail.cnsltEmpNo || '-'}</span>
              )}
            </div>
          )}
          {isAnnex && (
            <div className={styles.headerItem}>
              <span className={styles.headerLabel}>Main Contract</span>
              <span className={styles.headerValue}>{detail.mstCtrtNo || detail.mstCtrtCd}</span>
            </div>
          )}
        </div>
        <Tabs items={tabs} />
      </Popup>

      {sub?.type === 'officer' && (
        <AssignOfficerPopup
          atrzProcCd={tradeProcessCode(kind, 'RCPT')}
          stpNo={RECEIPT_OFFICER_STEP}
          title="Change Officer in Charge"
          confirmText="Change"
          details={[...details, { label: 'Current Officer', value: detail.tkcgEmpNm || detail.tkcgEmpNo || '-' }]}
          currentEmpNo={detail.tkcgEmpNo}
          submitting={changeOfficer.isPending}
          onSubmit={(empNo) =>
            void run(() => changeOfficer.mutateAsync({ kind: contractKind, ctrtCd, empNo }), t('messages.trade.officerChanged')).then(close)
          }
          onClose={close}
        />
      )}
      {sub?.type === 'consultant' && (
        <AssignOfficerPopup
          atrzProcCd={tradeProcessCode(kind, 'RCPT')}
          stpNo={RECEIPT_OFFICER_STEP}
          // Any trade staff member of the process (receiver, officer, approver) except the officer; the backend only
          // requires a hired employee (Q-U7: the flow lets the approver assign).
          source={{ type: 'processStaff', atrzProcCd: tradeProcessCode(kind, 'RCPT'), stpNos: [1, 2, 3] }}
          label="Consultant"
          title="Assign Consultant"
          confirmText="Assign"
          details={[...details, { label: 'Officer in Charge', value: detail.tkcgEmpNm || detail.tkcgEmpNo || '-' }]}
          currentEmpNo={detail.cnsltEmpNo}
          // The consultant must differ from the officer (backend 409 TRD001).
          excludeEmpNos={detail.tkcgEmpNo ? [detail.tkcgEmpNo] : []}
          submitting={assignConsultant.isPending}
          onSubmit={(empNo) => void run(() => assignConsultant.mutateAsync({ ctrtCd, empNo }), t('messages.trade.consultantAssigned')).then(close)}
          onClose={close}
        />
      )}
      {(sub?.type === 'requestDraft' || sub?.type === 'requestSignature') && (
        <ApprovalRequestPopup
          atrzProcCd={sub.type === 'requestDraft' ? draftProcess : tradeProcessCode(kind, 'SIGN')}
          details={details}
          onSubmit={async (body) => {
            const response = await requestApproval.mutateAsync({
              kind: contractKind,
              ctrtCd,
              step: sub.type === 'requestDraft' ? 'draft' : 'signature',
              body,
            });
            toast.success(response.message || t('messages.approval.requested'));
            close();
          }}
          onClose={close}
        />
      )}
      {openSession && (sub?.type === 'approve' || sub?.type === 'reject') && (
        <ApprovalDecisionPopup atrzHstryId={openSession} mode={sub.type} target={contractNo(detail)} details={details} onClose={close} />
      )}
      {sub?.type === 'info' && <ApprovalInfoPopup atrzHstryId={sub.atrzHstryId} target={contractNo(detail)} onClose={close} />}
      {sub?.type === 'fee' && <FeeReceiptModal kind={contractKind} detail={detail} fee={sub.fee} refund={sub.refund} onClose={close} />}
      {sub?.type === 'trade' && <TradeCompletionModal kind={contractKind} detail={detail} onClose={close} />}
      {sub?.type === 'delivery' && <DeliveryModal kind={contractKind} detail={detail} onClose={close} />}
      {sub?.type === 'renewal' && <RenewalDecisionModal kind={contractKind} detail={detail} onClose={close} />}
      {sub?.type === 'annex' && (
        <CreateAnnexModal
          kind={contractKind}
          detail={detail}
          onClose={close}
          onCreated={(code) => {
            close();
            if (code) onOpen(code);
          }}
        />
      )}
    </>
  );
}
