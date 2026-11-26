import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
import MemberDetailModal from '@/features/member/member-list/MemberDetailModal';
import { memberItemFor } from '@/features/member/member-list/use-members';
import { codeLabel } from '@/lib/i18n/code-label';
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

type SubPopup = 'receipt' | 'officer' | 'request' | 'approve' | 'reject' | 'info' | 'cancel' | 'member' | null;

const STATUS_COLORS: Record<string, StatusBadgeColor> = {
  RCPT: 'orange',
  PRCS: 'blue',
  DCIN: 'red',
  DCOK: 'navy',
  CMPL: 'green',
  CNCL: 'gray',
};
const OPEN_STATUSES: TradeApplicationStatus[] = ['RCPT', 'PRCS', 'DCIN', 'DCOK'];
const OFFICER_STATUSES: TradeApplicationStatus[] = ['PRCS', 'DCIN', 'DCOK'];
const SCAN_ACCEPT = '.pdf,.jpg,.jpeg,.png';

const nplColumns = (t: TFunction): TableColumnsType<TradeNpl> => [
  { title: t('trade.common.nplCode'), dataIndex: 'bndCd', width: 130, render: (v?: string, r?: TradeNpl) => v || r?.cnsltTrgtNplId || '-' },
  { title: t('trade.common.nplName'), dataIndex: 'bndNm', render: (v?: string) => v || '-' },
  { title: t('trade.common.creditor'), dataIndex: 'crdtrNm', width: 160, render: (v?: string) => v || '-' },
  { title: t('trade.application.popup.loanContract'), dataIndex: 'loanCtrtNo', width: 140, render: (v?: string) => v || '-' },
  { title: t('trade.common.principalBalance'), dataIndex: 'prnBlnc', width: 140, align: 'right', render: (v?: number) => formatAmount(v) },
  { title: t('trade.common.appraisedValue'), dataIndex: 'bndEvlAmt', width: 140, align: 'right', render: (v?: number) => formatAmount(v) },
];

const collateralColumns = (t: TFunction): TableColumnsType<TradeCollateral> => [
  { title: t('trade.common.collateral'), dataIndex: 'cltrAstNm', render: (v?: string, r?: TradeCollateral) => v || r?.cltrAstCd || '-' },
  { title: t('trade.common.contractNo'), dataIndex: 'cltrCtrtNo', width: 150, render: (v?: string) => v || '-' },
  { title: t('trade.common.contractDate'), dataIndex: 'ctrtDmy', width: 120, align: 'center', render: (v?: string) => formatDmy(v) },
  { title: t('trade.common.characteristics'), dataIndex: 'astChrcCn', render: (v?: string) => v || '-' },
];

const historyColumns = (t: TFunction): TableColumnsType<TradeApplicationHistory> => [
  { title: t('trade.common.status'), dataIndex: 'srvcPrcsSttsNm', width: 170, render: (v?: string, r?: TradeApplicationHistory) => v || r?.srvcPrcsSttsCd || '-' },
  { title: t('trade.application.popup.processedAt'), dataIndex: 'prcsDt', width: 150, align: 'center', render: (v?: string) => formatDateTime(v) },
  { title: t('trade.application.popup.processedBy'), dataIndex: 'prcsByNm', width: 190, render: (v?: string, r?: TradeApplicationHistory) => v || r?.prcsBy || '-' },
  { title: t('trade.common.note'), dataIndex: 'prcsCn', render: (v?: string) => v || '-' },
];

function nplText(detail: TradeApplicationDetail): string {
  if (detail.bndLotYn === 'Y' || detail.bndLotId) return detail.bndLotNm || detail.bndLotId || '-';
  const codes = (detail.npls ?? []).map((npl) => npl.bndCd || npl.cnsltTrgtNplId).filter(Boolean);
  return codes.length ? codes.join(', ') : detail.bndCd || '-';
}

/** Business detail rows shown in the approval / officer popups. */
function applicationDetails(t: TFunction, kind: TradeAppKind, detail: TradeApplicationDetail): ApprovalDetailRow[] {
  const appraised = (detail.npls ?? []).reduce((sum, npl) => sum + (npl.bndEvlAmt ?? 0), 0);
  return [
    { label: t('trade.common.applicationNo'), value: applicationNo(detail) },
    { label: t('trade.common.kind'), value: t(`trade.kinds.${kind}`) },
    { label: t('trade.common.member'), value: detail.mbrNm ? `${detail.mbrNm} (${detail.mbrNo ?? '-'})` : (detail.mbrNo ?? '-') },
    { label: t('trade.common.nplLot'), value: nplText(detail) },
    ...(appraised > 0 ? [{ label: t('trade.common.appraisedValue'), value: formatAmount(appraised) }] : []),
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
  const details = applicationDetails(t, kind, detail);
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
            {t('trade.common.approvalInfo')}
          </ActionButton>
        )}
        {canCancel && (
          <ActionButton intent="danger" appearance="outlined" onClick={() => setSubPopup('cancel')}>
            {t('trade.application.popup.cancelApplication')}
          </ActionButton>
        )}
        {canEdit && onEdit && (
          <ActionButton intent="quaternary" appearance="outlined" onClick={() => onEdit(detail)}>
            {t('trade.common.edit')}
          </ActionButton>
        )}
      </span>
      {actions.has('RECEIVE') && (
        <ActionButton intent="secondary" appearance="filled" onClick={() => setSubPopup('receipt')}>
          {t('trade.application.popup.receipt')}
        </ActionButton>
      )}
      {actions.has('REQUEST_APPROVAL') && (
        <ActionButton intent="secondary" appearance="filled" onClick={() => setSubPopup('request')}>
          {t('trade.common.requestApproval')}
        </ActionButton>
      )}
      {actions.has('DECIDE') && detail.atrzHstryId && (
        <>
          <ActionButton intent="danger" appearance="outlined" onClick={() => setSubPopup('reject')}>
            {t('trade.common.reject')}
          </ActionButton>
          <ActionButton intent="primary" appearance="filled" onClick={() => setSubPopup('approve')}>
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
      <Popup open width={1000} title={`${title} — ${applicationNo(detail)}`} onCancel={onClose} footer={footer}>
        {/* Record key for tests and hand-offs; screens show the readable number only. */}
        <span hidden data-record-key={srvcAplyId} />
        <div className={styles.header}>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>{t('trade.common.status')}</span>
            <span>
              <StatusBadge color={STATUS_COLORS[status ?? ''] ?? 'gray'}>{detail.srvcPrcsSttsNm || status || '-'}</StatusBadge>
            </span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>{t('trade.common.approvalStage')}</span>
            <span className={styles.headerValue}>{codeLabel('trade.approvalStages', detail.approvalStage)}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>{t('trade.application.popup.channelDate')}</span>
            <span className={styles.headerValue}>
              {codeLabel('trade.channels', detail.aplyPathCd === 'MANL' ? 'MANL' : 'WEB')} · {formatDmy(detail.srvcAplyDmy)}
            </span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>{t('trade.application.popup.applicant')}</span>
            {detail.mbrNo ? (
              // Member detail popup of Member Management (decision 2026-11-26: customer data comes from the member).
              <button type="button" className={styles.officerLink} title={t('trade.common.openMember')} onClick={() => setSubPopup('member')}>
                {detail.mbrNm || '-'} ({detail.mbrNo})
              </button>
            ) : (
              <span className={styles.headerValue}>-</span>
            )}
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>{t('trade.common.receiver')}</span>
            <span className={styles.headerValue}>{receiver || '-'}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>{t('trade.common.officerInCharge')}</span>
            {canChangeOfficer ? (
              <button type="button" className={styles.officerLink} title={t('trade.common.changeOfficer')} onClick={() => setSubPopup('officer')}>
                {detail.tkcgEmpNm || detail.tkcgEmpNo || t('trade.common.assign')}
              </button>
            ) : (
              <span className={styles.headerValue}>{detail.tkcgEmpNm || detail.tkcgEmpNo || '-'}</span>
            )}
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>{t('trade.common.contract')}</span>
            <span className={styles.headerValue}>{detail.srvcCtrtNo || detail.srvcCtrtCd || '-'}</span>
          </div>
        </div>

        {detail.activePurchaseCtrtCd && (
          <div className={styles.warning}>
            {t('trade.application.popup.purchaseRunning', { no: detail.activePurchaseCtrtNo || detail.activePurchaseCtrtCd })}
          </div>
        )}
        {detail.cnclRsnCn && <div className={styles.warning}>{t('trade.application.popup.cancellationReason', { reason: detail.cnclRsnCn })}</div>}
        {detail.rjctRsnCn && detail.approvalStage === 'REJECTED' && (
          <div className={styles.warning}>{t('trade.application.popup.rejectionReason', { reason: detail.rjctRsnCn })}</div>
        )}

        <section className={styles.section}>
          <div className={styles.sectionTitle}>{t('trade.common.application')}</div>
          <div className={styles.grid}>
            {kind === 'consulting' ? (
              <>
                <Cell label={t('trade.common.consultingType')}>
                  {consultingCodes.find((c) => c.value === detail.cnsltDmndSeCd)?.label ?? detail.cnsltDmndSeCd ?? '-'}
                </Cell>
                <Cell label={t('trade.application.popup.sourceInquiry')}>{detail.srcInqryPstNo || '-'}</Cell>
                <Cell label={t('trade.application.popup.request')} wide>
                  {detail.cnsltDmndPrpsCn || '-'}
                </Cell>
              </>
            ) : (
              <>
                <Cell label={detail.bndLotYn === 'Y' ? t('trade.common.lot') : t('trade.common.npl')}>{nplText(detail)}</Cell>
                <Cell label={kind === 'sale' ? t('trade.common.desiredSalePrice') : t('trade.common.proposedPurchasePrice')}>
                  {detail.prpDsplPrc !== undefined ? `${formatAmount(detail.prpDsplPrc)} ${detail.crncCd ?? ''}` : '-'}
                </Cell>
                {kind === 'sale' && (
                  <>
                    <Cell label={t('trade.common.contractKind')}>
                      {contractKinds.find((c) => c.value === detail.ctrtKndCd)?.label ?? detail.ctrtKndCd ?? '-'}
                    </Cell>
                    <Cell label={t('trade.common.baseContract')}>{detail.baseCtrtCd || '-'}</Cell>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {(detail.npls?.length ?? 0) > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>{kind === 'consulting' ? t('trade.application.popup.consultingTargets') : t('trade.common.npls')}</div>
            <DataTable<TradeNpl>
              rowKey={(r) => r.bndCd || r.cnsltTrgtNplId || r.loanCtrtNo || ''}
              columns={nplColumns(t)}
              dataSource={detail.npls}
              pagination={false}
            />
          </section>
        )}
        {kind === 'consulting' && (detail.collaterals?.length ?? 0) > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>{t('trade.common.collaterals')}</div>
            <DataTable<TradeCollateral>
              rowKey={(r) => r.cltrAstCd || r.cltrCtrtNo || r.cltrAstNm || ''}
              columns={collateralColumns(t)}
              dataSource={detail.collaterals}
              pagination={false}
            />
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.sectionTitle}>{t('trade.application.popup.documents')}</div>
          <div className={styles.grid}>
            <Cell label={t('trade.application.popup.documentsCheck')}>
              {detail.dcmntCmpltYn === 'Y'
                ? t('trade.application.popup.complete')
                : detail.dcmntCmpltYn === 'N'
                  ? t('trade.application.popup.incomplete')
                  : t('trade.application.popup.notChecked')}
            </Cell>
            <Cell label={t('trade.application.popup.checkedAt')}>{formatDateTime(detail.dcmntChckDt)}</Cell>
            {detail.msngDcmntCn && (
              <Cell label={t('trade.application.popup.missingDocuments')} wide>
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
              title={t('trade.application.popup.scanUploadTitle')}
              uploadButtonText={t('trade.common.uploadScans')}
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
                  { label: t('trade.application.popup.documentsCompleteOption'), value: 'Y' },
                  { label: t('trade.application.popup.documentsIncompleteOption'), value: 'N' },
                ]}
              />
              {documents === 'N' && (
                <>
                  <TextArea
                    rows={3}
                    maxLength={1000}
                    showCount
                    placeholder={t('trade.application.popup.missingPlaceholder')}
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
                  {documents === 'Y' ? t('trade.application.popup.markComplete') : t('trade.application.popup.markIncomplete')}
                </ActionButton>
              </div>
            </div>
          )}
        </section>

        {(detail.steps?.length ?? 0) > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>{t('trade.application.popup.approvalProgress')}</div>
            <ApprovalStepsTable steps={detail.steps ?? []} />
          </section>
        )}

        {(detail.histories?.length ?? 0) > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>{t('trade.application.popup.processingHistory')}</div>
            <DataTable<TradeApplicationHistory>
              rowKey={(r) => `${r.srvcPrcsSttsCd}-${r.prcsDt}`}
              columns={historyColumns(t)}
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
          title={t('trade.application.popup.receipt')}
          confirmText={t('trade.application.popup.receipt')}
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
          title={t('trade.common.changeOfficerTitle')}
          confirmText={t('trade.common.change')}
          details={[...details, { label: t('trade.common.currentOfficer'), value: detail.tkcgEmpNm || detail.tkcgEmpNo || '-' }]}
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
          warning={
            detail.activePurchaseCtrtCd
              ? t('trade.application.popup.purchaseRunningRequest', { no: detail.activePurchaseCtrtNo || detail.activePurchaseCtrtCd })
              : undefined
          }
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
      {subPopup === 'member' && detail.mbrNo && (
        <MemberDetailModal visible member={memberItemFor(detail.mbrNo, detail.mbrNm)} onClose={() => setSubPopup(null)} />
      )}
      {subPopup === 'cancel' && (
        <Popup
          open
          width={560}
          title={t('trade.application.popup.cancelApplication')}
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
          confirmText={t('trade.common.submit')}
          confirmDanger
          confirmLoading={cancel.isPending}
          confirmDisabled={!cancelReason.trim() || !cancelConfirmed}
        >
          <div className={styles.notice}>{t('messages.trade.cancelHint')}</div>
          <TextArea
            rows={4}
            maxLength={1000}
            showCount
            placeholder={t('trade.application.popup.cancelReasonPlaceholder')}
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
  if (files.length === 0) return <div className={styles.notice}>{t('trade.application.popup.noScans')}</div>;
  const open = (url: string) => openFile.mutate(url, { onError: (error) => toast.error(errorMessage(error, t('messages.api.requestFailed'))) });
  return (
    <ul className={styles.files}>
      {files.map((file) => (
        <li key={`${file.fileUnqId}-${file.fileSeq}`} className={styles.fileItem}>
          <span>{file.fileNm || file.fileUnqId}</span>
          {file.fileSz !== undefined && <span className={styles.fileSize}>{formatAmount(Math.ceil(file.fileSz / 1024))} KB</span>}
          {file.previewUrl && (
            <button type="button" className={styles.officerLink} onClick={() => open(file.previewUrl as string)}>
              {t('trade.common.preview')}
            </button>
          )}
          {file.downloadUrl && (
            <button type="button" className={styles.officerLink} onClick={() => open(file.downloadUrl as string)}>
              {t('trade.common.download')}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
