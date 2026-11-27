import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
import { RECEIPT_OFFICER_STEP, approvalStageOf } from '@/api/common/approval-api';
import { TRADE_CONTRACT_KIND, contractNo, tradeProcessCode } from '@/api/trade/trade-api';
import type { TradeAppKind, TradeContractDetail, TradeContractFee, TradeContractListItem, TradeFile, TradeNpl } from '@/api/trade/trade-api';
import type { ContractApprovalHistory } from '@/api/trade/trade-contract-api';
import ApprovalDecisionPopup from '@/features/approval/_shared/ApprovalDecisionPopup';
import ApprovalInfoPopup from '@/features/approval/_shared/ApprovalInfoPopup';
import type { ApprovalDetailRow } from '@/features/approval/_shared/ApprovalParts';
import { SessionStatusBadge } from '@/features/approval/_shared/ApprovalParts';
import ApprovalRequestPopup from '@/features/approval/_shared/ApprovalRequestPopup';
import AssignOfficerPopup from '@/features/approval/_shared/AssignOfficerPopup';
import MemberDetailModal from '@/features/member/member-list/MemberDetailModal';
import { memberItemFor } from '@/features/member/member-list/use-members';
import { codeLabel } from '@/lib/i18n/code-label';
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
  | { type: 'officer' | 'consultant' | 'requestDraft' | 'requestSignature' | 'approve' | 'reject' | 'trade' | 'delivery' | 'annex' | 'renewal' | 'member' }
  | { type: 'info'; atrzHstryId: string }
  | { type: 'fee'; fee: TradeContractFee; refund: boolean }
  | null;

const LIFECYCLE = ['PREPR', 'DRFAPR', 'SGNWT', 'SGNCP', 'PROGS', 'ENDING', 'CMPTN'];
const SCAN_ACCEPT = '.pdf,.jpg,.jpeg,.png';

const nplColumns = (t: TFunction): TableColumnsType<TradeNpl> => [
  { title: t('trade.common.nplCode'), dataIndex: 'bndCd', width: 130, render: (v?: string, r?: TradeNpl) => v || r?.cnsltTrgtNplId || '-' },
  { title: t('trade.common.nplName'), dataIndex: 'bndNm', render: (v?: string) => v || '-' },
  { title: t('trade.common.creditor'), dataIndex: 'crdtrNm', width: 170, render: (v?: string) => v || '-' },
  { title: t('trade.common.principalBalance'), dataIndex: 'prnBlnc', width: 140, align: 'right', render: (v?: number) => formatAmount(v) },
  { title: t('trade.contract.popup.listed'), dataIndex: 'expsrYn', width: 70, align: 'center', render: (v?: string) => v || '-' },
  { title: t('trade.common.status'), dataIndex: 'bndSttsCd', width: 70, align: 'center', render: (v?: string) => v || '-' },
];

function isAnnexOf(detail: TradeContractDetail): boolean {
  return !!detail.mstCtrtCd && detail.mstCtrtCd !== detail.srvcCtrtCd;
}

/** Tabs of the contract popup. */
export type ContractTab = 'contract' | 'documents' | 'fees' | 'annexes' | 'report' | 'termination' | 'approvals';

export interface TradeContractPopupProps {
  kind: TradeAppKind;
  srvcCtrtCd: string;
  /** Tab shown first (hand-off from Approval Management: termination, report). */
  initialTab?: ContractTab;
  title: string;
  canWrite: boolean;
  onClose: () => void;
}

export default function TradeContractPopup({ kind, srvcCtrtCd, initialTab, title, canWrite, onClose }: TradeContractPopupProps) {
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
      initialTab={current === srvcCtrtCd ? initialTab : undefined}
      onClose={onClose}
      onOpen={(code) => setStack((prev) => [...prev, code])}
      onBack={stack.length > 1 ? () => setStack((prev) => prev.slice(0, -1)) : undefined}
    />
  );
}

interface ContractViewProps {
  kind: TradeAppKind;
  detail: TradeContractDetail;
  initialTab?: ContractTab;
  title: string;
  canWrite: boolean;
  onClose: () => void;
  onOpen: (srvcCtrtCd: string) => void;
  onBack?: () => void;
}

function ContractView({ kind, detail, initialTab, title, canWrite, onClose, onOpen, onBack }: ContractViewProps) {
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
    { label: isAnnex ? t('trade.common.annexNo') : t('trade.common.contractNo'), value: contractNo(detail) },
    { label: t('trade.common.member'), value: detail.mbrNm ? `${detail.mbrNm} (${detail.mbrNo ?? '-'})` : (detail.mbrNo ?? '-') },
    { label: t('trade.common.npl'), value: (detail.npls ?? []).map((n) => n.bndCd).filter(Boolean).join(', ') || '-' },
    { label: t('trade.common.price'), value: detail.prpPrc !== undefined ? `${formatAmount(detail.prpPrc)} ${detail.crncCd ?? ''}` : '-' },
    { label: t('trade.common.fee'), value: detail.feeAmt !== undefined ? formatAmount(detail.feeAmt) : '-' },
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
                {t('trade.common.preview')}
              </button>
            )}
            {file.downloadUrl && (
              <button type="button" className={styles.officerLink} onClick={() => open(file.downloadUrl)}>
                {t('trade.common.download')}
              </button>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <div className={styles.notice}>{empty}</div>
    );

  const feeColumns: TableColumnsType<TradeContractFee> = [
    { title: t('trade.common.rowNo'), dataIndex: 'feeSeq', width: 50, align: 'center' },
    { title: t('trade.common.type'), dataIndex: 'feeSeCd', width: 100, render: (v?: string) => codeLabel('trade.feeTypes', v) },
    { title: t('trade.contract.popup.amount'), dataIndex: 'fee', width: 140, align: 'right', render: (v?: number, r?: TradeContractFee) => `${formatAmount(v)} ${r?.crncCd ?? ''}` },
    { title: t('trade.contract.popup.due'), dataIndex: 'feePayTermDmy', width: 110, align: 'center', render: (v?: string) => formatDmy(v) },
    { title: t('trade.contract.popup.paid'), dataIndex: 'feeRcptYn', width: 70, align: 'center', render: (v?: string) => (v === 'Y' ? t('trade.contract.popup.paid') : t('trade.contract.popup.unpaid')) },
    { title: t('trade.contract.popup.paidOn'), dataIndex: 'feeRcptIdntyDmy', width: 110, align: 'center', render: (v?: string) => formatDmy(v) },
    { title: t('trade.contract.popup.received'), dataIndex: 'rcptAmt', width: 130, align: 'right', render: (v?: number) => formatAmount(v) },
    {
      title: t('trade.contract.popup.refund'),
      dataIndex: 'rfndSttsCd',
      width: 110,
      render: (v?: string, r?: TradeContractFee) =>
        v ? `${v === 'RFPL' ? t('trade.contract.popup.refundPlanned') : t('trade.contract.popup.refunded')} ${r?.rfndAmt ? formatAmount(r.rfndAmt) : ''}` : '-',
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_v, fee) => (
        <>
          {actions.has('CONFIRM_FEE') && fee.feeRcptYn !== 'Y' && (
            <ActionButton size="small" intent="primary" appearance="filled" onClick={() => setSub({ type: 'fee', fee, refund: false })}>
              {t('trade.common.confirm')}
            </ActionButton>
          )}
          {actions.has('REFUND_FEE') && fee.rfndSttsCd === 'RFPL' && (
            <ActionButton size="small" intent="danger" appearance="outlined" onClick={() => setSub({ type: 'fee', fee, refund: true })}>
              {t('trade.contract.popup.refund')}
            </ActionButton>
          )}
        </>
      ),
    },
  ];

  const annexColumns: TableColumnsType<TradeContractListItem> = [
    {
      title: t('trade.contract.popup.annex'),
      dataIndex: 'srvcCtrtNo',
      render: (_v, r) => (
        <button type="button" className={styles.officerLink} onClick={() => onOpen(r.srvcCtrtCd)}>
          {contractNo(r)}
        </button>
      ),
    },
    { title: t('trade.contract.popup.purpose'), dataIndex: 'anxPrpsCd', width: 140, render: (v?: string) => codeLabel('trade.annexPurposes', v) },
    { title: t('trade.common.status'), dataIndex: 'ctrtSttsNm', width: 150, render: (v?: string, r?: TradeContractListItem) => v || r?.ctrtSttsCd || '-' },
    { title: t('trade.contract.popup.concluded'), dataIndex: 'ctrtCnclsDmy', width: 110, align: 'center', render: (v?: string) => formatDmy(v) },
  ];

  const historyColumns: TableColumnsType<ContractApprovalHistory> = [
    { title: t('trade.contract.popup.stage'), dataIndex: 'atrzProcCd', width: 210, render: (v?: string) => codeLabel('approval.stages', approvalStageOf(v)) },
    { title: t('trade.common.status'), dataIndex: 'atrzSttsCd', width: 110, align: 'center', render: (v?: string) => <SessionStatusBadge status={v} /> },
    { title: t('trade.contract.popup.requester'), dataIndex: 'requesterEmpNo', width: 100, render: (v?: string) => v || '-' },
    { title: t('trade.contract.popup.approver'), dataIndex: 'approverEmpNm', width: 170, render: (v?: string, r?: ContractApprovalHistory) => v || r?.approverEmpNo || '-' },
    { title: t('trade.common.requested'), dataIndex: 'requestedAt', width: 130, align: 'center', render: (v?: string) => formatDateTime(v) },
    { title: t('trade.contract.popup.decided'), dataIndex: 'decidedAt', width: 130, align: 'center', render: (v?: string) => formatDateTime(v) },
    { title: t('trade.common.comment'), dataIndex: 'comment', render: (v?: string) => v || '-' },
    {
      title: '',
      key: 'info',
      width: 70,
      render: (_v, row) => (
        <ActionButton size="small" intent="text" onClick={() => setSub({ type: 'info', atrzHstryId: row.atrzHstryId })}>
          {t('trade.common.info')}
        </ActionButton>
      ),
    },
  ];

  const tabs = [
    {
      key: 'contract',
      label: t('trade.contract.tabs.contract'),
      children: (
        <>
          <section className={styles.section}>
            <div className={styles.sectionTitle}>{t('trade.contract.popup.parties')}</div>
            <div className={styles.grid}>
              <div className={styles.cellLabel}>{t('trade.contract.popup.customer')}</div>
              <div className={styles.cellValue}>
                {detail.mbrNo ? (
                  <button type="button" className={styles.officerLink} title={t('trade.common.openMember')} onClick={() => setSub({ type: 'member' })}>
                    {member?.mbrNm || member?.orgnzNm || detail.mbrNm || '-'} ({detail.mbrNo})
                  </button>
                ) : (
                  '-'
                )}{' '}
                · {member?.mbrTypeNm ?? '-'}
              </div>
              <div className={styles.cellLabel}>{t('trade.contract.popup.customerContact')}</div>
              <div className={styles.cellValue}>{[member?.telno, member?.emlAddr].filter(Boolean).join(' · ') || '-'}</div>
              <div className={styles.cellLabel}>{t('trade.contract.popup.broker')}</div>
              {/* Q-U3 / §6.2: VAMC representative, POA number and fee account have no column yet (WP8). */}
              <div className={`${styles.cellValue} ${styles.wide}`}>{t('trade.contract.popup.brokerValue')}</div>
            </div>
          </section>
          {(detail.npls?.length ?? 0) > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionTitle}>{t('trade.common.npls')}</div>
              <DataTable<TradeNpl> rowKey={(r) => r.bndCd || r.cnsltTrgtNplId || ''} columns={nplColumns(t)} dataSource={detail.npls} pagination={false} />
            </section>
          )}
          <section className={styles.section}>
            <div className={styles.sectionTitle}>{isAnnex
                ? t('trade.contract.popup.annexTerms', { purpose: codeLabel('trade.annexPurposes', detail.anxPrpsCd, '') })
                : t('trade.contract.popup.contractTerms')}</div>
            <ContractDraftForm kind={kind} contractKind={contractKind} detail={detail} isAnnex={isAnnex} editable={actions.has('UPDATE_DRAFT')} />
            {(detail.trdCnclsDmy || detail.dlvrCmptnDmy) && (
              <div className={`${styles.grid} ${styles.gridSpaced}`}>
                <div className={styles.cellLabel}>{kind === 'sale' ? t('trade.contract.popup.saleCompleted') : t('trade.contract.popup.agreementSigned')}</div>
                <div className={styles.cellValue}>{formatDmy(detail.trdCnclsDmy)}</div>
                <div className={styles.cellLabel}>{t('trade.contract.popup.delivery')}</div>
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
      label: t('trade.contract.tabs.documents'),
      children: (
        <>
          <section className={styles.section}>
            <div className={styles.sectionTitle}>{t('trade.contract.popup.draftContract')}</div>
            {fileList(detail.draftFiles, t('trade.contract.popup.noDraft'))}
            {actions.has('REGISTER_DRAFT') && (
              <FileUploadBox
                accept={SCAN_ACCEPT}
                disabled={uploadDocument.isPending}
                title={t('trade.contract.popup.draftUploadTitle')}
                uploadButtonText={t('trade.contract.popup.registerDraft')}
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
            <div className={styles.sectionTitle}>{t('trade.contract.popup.signedScan')}</div>
            {fileList(detail.scanFiles, t('trade.contract.popup.noSignedScan'))}
            {actions.has('ATTACH_SIGNED_SCAN') && (
              <FileUploadBox
                accept={SCAN_ACCEPT}
                disabled={uploadDocument.isPending}
                title={t('trade.contract.popup.signedUploadTitle')}
                uploadButtonText={t('trade.contract.popup.uploadSignedScan')}
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
                <span className={styles.fieldLabel}>{t('trade.contract.popup.conclusionDate')}</span>
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
                  {t('trade.contract.popup.completeSigning')}
                </ActionButton>
              </div>
            )}
          </section>
        </>
      ),
    },
    {
      key: 'fees',
      label: t('trade.contract.tabs.fees', { n: detail.fees?.length ?? 0 }),
      children: <DataTable<TradeContractFee> rowKey="feeId" columns={feeColumns} dataSource={detail.fees ?? []} pagination={false} />,
    },
    ...(kind !== 'consulting' && !isAnnex
      ? [
          {
            key: 'annexes',
            label: t('trade.contract.tabs.annexes', { n: detail.annexes?.length ?? 0 }),
            children: (
              <>
                {actions.has('CREATE_ANNEX') && (
                  <div className={styles.checkActions}>
                    <ActionButton intent="secondary" appearance="filled" onClick={() => setSub({ type: 'annex' })}>
                      {t('trade.contract.popup.createAnnex')}
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
            label: t('trade.contract.tabs.report', { n: detail.additionalConsultations?.length ?? 0 }),
            children: <ConsultingReportTab detail={detail} actions={actions} details={details} />,
          },
        ]
      : []),
    ...(!isAnnex
      ? [
          {
            key: 'termination',
            label: t('trade.contract.tabs.termination', { n: detail.terminations?.length ?? 0 }),
            children: <ContractTerminationTab kind={kind} contractKind={contractKind} detail={detail} actions={actions} details={details} />,
          },
        ]
      : []),
    {
      key: 'approvals',
      label: t('trade.contract.tabs.approvals'),
      children: <DataTable<ContractApprovalHistory> rowKey="atrzHstryId" columns={historyColumns} dataSource={histories} pagination={false} />,
    },
  ];

  const footer = (
    <div className={styles.footer}>
      <span className={styles.footerLeft}>
        {onBack && (
          <ActionButton intent="quaternary" appearance="outlined" onClick={onBack}>
            {t('trade.contract.popup.backToContract')}
          </ActionButton>
        )}
        {openSession && (
          <ActionButton intent="quaternary" appearance="outlined" onClick={() => setSub({ type: 'info', atrzHstryId: openSession })}>
            {t('trade.common.approvalInfo')}
          </ActionButton>
        )}
        {actions.has('DECIDE_RENEWAL') && (
          <ActionButton intent="quaternary" appearance="outlined" onClick={() => setSub({ type: 'renewal' })}>
            {t('trade.contract.popup.renewalDecision')}
          </ActionButton>
        )}
      </span>
      {actions.has('REQUEST_DRAFT_APPROVAL') && (
        <ActionButton intent="secondary" appearance="filled" onClick={() => setSub({ type: 'requestDraft' })}>
          {t('trade.contract.popup.requestDraftApproval')}
        </ActionButton>
      )}
      {actions.has('REQUEST_SIGNATURE_APPROVAL') && (
        <ActionButton intent="secondary" appearance="filled" onClick={() => setSub({ type: 'requestSignature' })}>
          {t('trade.contract.popup.requestSignatureApproval')}
        </ActionButton>
      )}
      {(actions.has('COMPLETE_SALE') || actions.has('CONCLUDE_TRADE')) && (
        <ActionButton intent="secondary" appearance="filled" onClick={() => setSub({ type: 'trade' })}>
          {kind === 'sale' ? t('trade.contract.popup.saleCompletion') : t('trade.contract.popup.purchaseAgreement')}
        </ActionButton>
      )}
      {actions.has('RECORD_DELIVERY') && (
        <ActionButton intent="secondary" appearance="filled" onClick={() => setSub({ type: 'delivery' })}>
          {t('trade.contract.popup.recordDelivery')}
        </ActionButton>
      )}
      {actions.has('DECIDE') && openSession && (
        <>
          <ActionButton intent="danger" appearance="outlined" onClick={() => setSub({ type: 'reject' })}>
            {t('trade.common.reject')}
          </ActionButton>
          <ActionButton intent="primary" appearance="filled" onClick={() => setSub({ type: 'approve' })}>
            {t('trade.common.approve')}
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
      <Popup open width={1080} title={isAnnex ? t('trade.contract.popup.titleAnnex', { title, no: contractNo(detail) }) : `${title} — ${contractNo(detail)}`} onCancel={onClose} footer={footer}>
        {/* Record key for tests and hand-offs; screens show the readable number only. */}
        <span hidden data-record-key={ctrtCd} />
        <ProgressStepper
          className={styles.stepper}
          current={stepIndex}
          steps={LIFECYCLE.map((code, index) => ({ key: code, label: codeLabel('trade.contract.lifecycle', index === 6 && status === 'CNCLN' ? 'CNCLN' : code) }))}
        />
        <div className={styles.header}>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>{t('trade.common.status')}</span>
            <span>
              <StatusBadge color={status === 'PROGS' ? 'green' : status === 'CNCLN' ? 'gray' : 'blue'}>{detail.ctrtSttsNm || status}</StatusBadge>
            </span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>{t('trade.common.application')}</span>
            <span className={styles.headerValue}>{detail.srvcAplyNo || detail.srvcAplyId || '-'}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>{t('trade.common.officerInCharge')}</span>
            {actions.has('CHANGE_OFFICER') ? (
              <button type="button" className={styles.officerLink} title={t('trade.common.changeOfficer')} onClick={() => setSub({ type: 'officer' })}>
                {detail.tkcgEmpNm || detail.tkcgEmpNo || t('trade.common.assign')}
              </button>
            ) : (
              <span className={styles.headerValue}>{detail.tkcgEmpNm || detail.tkcgEmpNo || '-'}</span>
            )}
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>{t('trade.common.approval')}</span>
            <span className={styles.headerValue}>
              {detail.openApproval
                ? `${codeLabel('approval.stages', approvalStageOf(detail.openApproval.atrzProcCd))} → ${detail.openApproval.approverEmpNm ?? detail.openApproval.approverEmpNo ?? '-'}`
                : '-'}
            </span>
          </div>
          {kind === 'consulting' && (
            <div className={styles.headerItem}>
              <span className={styles.headerLabel}>{t('trade.common.consultant')}</span>
              {actions.has('ASSIGN_CONSULTANT') ? (
                <button type="button" className={styles.officerLink} title={t('trade.contract.popup.assignConsultant')} onClick={() => setSub({ type: 'consultant' })}>
                  {detail.cnsltEmpNm || detail.cnsltEmpNo || t('trade.common.assign')}
                </button>
              ) : (
                <span className={styles.headerValue}>{detail.cnsltEmpNm || detail.cnsltEmpNo || '-'}</span>
              )}
            </div>
          )}
          {isAnnex && (
            <div className={styles.headerItem}>
              <span className={styles.headerLabel}>{t('trade.contract.popup.mainContract')}</span>
              <span className={styles.headerValue}>{detail.mstCtrtNo || detail.mstCtrtCd}</span>
            </div>
          )}
        </div>
        <Tabs items={tabs} defaultActiveKey={initialTab && tabs.some((tab) => tab.key === initialTab) ? initialTab : undefined} />
      </Popup>

      {sub?.type === 'member' && detail.mbrNo && (
        <MemberDetailModal visible member={memberItemFor(detail.mbrNo, detail.mbrNm)} onClose={close} />
      )}
      {sub?.type === 'officer' && (
        <AssignOfficerPopup
          atrzProcCd={tradeProcessCode(kind, 'RCPT')}
          stpNo={RECEIPT_OFFICER_STEP}
          title={t('trade.common.changeOfficerTitle')}
          confirmText={t('trade.common.change')}
          details={[...details, { label: t('trade.common.currentOfficer'), value: detail.tkcgEmpNm || detail.tkcgEmpNo || '-' }]}
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
          // Any employed staff member except the officer; the backend only requires a hired employee (Q-U7: the
          // flow lets the approver assign).
          source={{ type: 'employees' }}
          label={t('trade.common.consultant')}
          placeholder={t('trade.contract.popup.selectConsultant')}
          searchTitle={t('trade.contract.popup.consultantSearch')}
          title={t('trade.contract.popup.assignConsultantTitle')}
          confirmText={t('trade.common.assign')}
          details={[...details, { label: t('trade.common.officerInCharge'), value: detail.tkcgEmpNm || detail.tkcgEmpNo || '-' }]}
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
