import { useTranslation } from 'react-i18next';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import Popup from '@/components/common/popup/Popup';
import { approvalStageOf } from '@/api/common/approval-api';
import { codeLabel } from '@/lib/i18n/code-label';
import { formatDateTime } from '@/utils/date-format';
import { ApprovalStepsTable, ApprovalSummary, SessionStatusBadge } from './ApprovalParts';
import { targetSummaryRows } from './approval-target';
import type { ApprovalDetailRow } from './ApprovalParts';
import { useApprovalDetail } from './use-approval';
import styles from './approval-popups.module.scss';

// Approval Information popup (VPA020400P01): stage, status, steps timeline (who / when / comment) and the
// rejection reason of one session (GET /api/v1/approvals/{atrzHstryId}). The business rows come from the server's
// target summary; `details` of the caller are used only when the server sends none.

export interface ApprovalInfoPopupProps {
  atrzHstryId: string;
  details?: ApprovalDetailRow[];
  /** Readable number of the target (the session only knows its key). */
  target?: string;
  onClose: () => void;
}

export default function ApprovalInfoPopup({ atrzHstryId, details = [], target, onClose }: ApprovalInfoPopupProps) {
  const { t } = useTranslation();
  const { data: session, isFetching, isError } = useApprovalDetail(atrzHstryId);
  const steps = session?.steps ?? [];
  const requester = steps.find((s) => s.empNo === session?.rtsoEmpNo)?.empNm;
  const rejected = steps.find((s) => s.status === 'REJECTED');

  return (
    <Popup
      open
      width={820}
      title={t('approval.info.title')}
      footerAlign="right"
      onCancel={onClose}
      hideCancel
      onConfirm={onClose}
      confirmText={t('messages.dialog.close')}
    >
      <LoadingSpinner spinning={isFetching && !session}>
        {!session ? (
          <div className={styles.loading}>{isError ? t('messages.approval.loadFailed') : null}</div>
        ) : (
          <>
            <ApprovalSummary
              rows={[
                { label: t('approval.fields.approvalStage'), value: codeLabel('approval.stages', approvalStageOf(session.atrzProcCd)) },
                { label: t('approval.fields.process'), value: session.atrzProcNm || session.atrzProcCd },
                { label: t('approval.fields.status'), value: <SessionStatusBadge status={session.atrzSttsCd} /> },
                { label: t('approval.fields.target'), value: session.atrzTrgtNo ?? target ?? session.atrzTrgtId ?? '-' },
                {
                  label: t('approval.fields.requested'),
                  value: session.rtsoEmpNo ? `${requester ?? session.rtsoEmpNo} · ${formatDateTime(session.rtsoDt)}` : '-',
                },
                ...(session.atrzCmptnDt ? [{ label: t('approval.fields.closedAt'), value: formatDateTime(session.atrzCmptnDt) }] : []),
                ...(session.target ? targetSummaryRows(session.target) : details),
              ]}
            />
            <ApprovalStepsTable steps={steps} />
            {rejected?.comment && (
              <div className={styles.field}>
                <span className={styles.label}>{t('approval.fields.rejectionReason')}</span>
                <div className={styles.rejection}>{rejected.comment}</div>
              </div>
            )}
          </>
        )}
      </LoadingSpinner>
    </Popup>
  );
}
