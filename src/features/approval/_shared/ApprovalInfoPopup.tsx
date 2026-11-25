import { useTranslation } from 'react-i18next';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import Popup from '@/components/common/popup/Popup';
import { APPROVAL_STAGE_LABELS, approvalStageOf } from '@/api/common/approval-api';
import { formatDateTime } from '@/utils/date-format';
import { ApprovalStepsTable, ApprovalSummary, SessionStatusBadge } from './ApprovalParts';
import type { ApprovalDetailRow } from './ApprovalParts';
import { useApprovalDetail } from './use-approval';
import styles from './approval-popups.module.scss';

// Approval Information popup (VPA020400P01): stage, status, steps timeline (who / when / comment) and the
// rejection reason of one session (GET /api/v1/approvals/{atrzHstryId}).

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
      title="Approval Information"
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
                { label: 'Approval Stage', value: APPROVAL_STAGE_LABELS[approvalStageOf(session.atrzProcCd)] },
                { label: 'Process', value: session.atrzProcNm || session.atrzProcCd },
                { label: 'Status', value: <SessionStatusBadge status={session.atrzSttsCd} /> },
                { label: 'Target', value: target ?? session.atrzTrgtId ?? '-' },
                {
                  label: 'Requested',
                  value: session.rtsoEmpNo ? `${requester ?? session.rtsoEmpNo} · ${formatDateTime(session.rtsoDt)}` : '-',
                },
                ...(session.atrzCmptnDt ? [{ label: 'Closed At', value: formatDateTime(session.atrzCmptnDt) }] : []),
                ...details,
              ]}
            />
            <ApprovalStepsTable steps={steps} />
            {rejected?.comment && (
              <div className={styles.field}>
                <span className={styles.label}>Rejection Reason</span>
                <div className={styles.rejection}>{rejected.comment}</div>
              </div>
            )}
          </>
        )}
      </LoadingSpinner>
    </Popup>
  );
}
