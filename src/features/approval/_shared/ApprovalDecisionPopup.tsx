import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActionButton from '@/components/common/actions/ActionButton';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import Popup from '@/components/common/popup/Popup';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import TextArea from '@/components/inputs/TextArea';
import { useNotify } from '@/hooks/use-notify';
import { useAuthStore } from '@/stores/auth-store';
import { approvalStageOf } from '@/api/common/approval-api';
import { codeLabel } from '@/lib/i18n/code-label';
import { formatDateTime } from '@/utils/date-format';
import { errorMessage } from '@/utils/system-utils';
import { ApprovalSummary } from './ApprovalParts';
import { targetSummaryRows } from './approval-target';
import type { ApprovalDetailRow } from './ApprovalParts';
import { useApprovalDetail, useApproveApproval, useRejectApproval } from './use-approval';
import styles from './approval-popups.module.scss';

// Approve (VPA020200P01) / Reject (VPA020300P01) popups of the approver. [Return] on the approve popup opens the
// reject form (Q-U6: same meaning as reject with a reason). Both need the confirmation tick; reject needs a reason.

export type ApprovalDecision = 'approve' | 'reject';

export interface ApprovalDecisionPopupProps {
  atrzHstryId: string;
  mode: ApprovalDecision;
  /** Business detail of the target supplied by the caller. */
  details?: ApprovalDetailRow[];
  /** Readable number of the target (the session only knows its key). */
  target?: string;
  onClose: () => void;
  /** Called after a successful decision (the popup closes itself through `onClose`). */
  onDone?: (decision: ApprovalDecision) => void;
}

export default function ApprovalDecisionPopup({ atrzHstryId, mode, details = [], target, onClose, onDone }: ApprovalDecisionPopupProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const me = useAuthStore((s) => s.user);
  const { data: session, isFetching } = useApprovalDetail(atrzHstryId);
  const approve = useApproveApproval();
  const reject = useRejectApproval();
  const [decision, setDecision] = useState<ApprovalDecision>(mode);
  const [text, setText] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const isReject = decision === 'reject';
  const pending = approve.isPending || reject.isPending;
  const stage = approvalStageOf(session?.atrzProcCd);
  const stageLabel = codeLabel('approval.stages', stage);
  // Flow docs (contract 13-2, termination): the approver of a signing step confirms with [Signing Complete].
  const approveText = stage === 'SIGN' || stage === 'END_SIGN' ? t('approval.decision.signingComplete') : t('approval.decision.confirm');
  const requester = session?.steps?.find((s) => s.empNo === session.rtsoEmpNo)?.empNm;

  const switchTo = (next: ApprovalDecision) => {
    setDecision(next);
    setText('');
    setConfirmed(false);
  };

  const handleSubmit = async () => {
    try {
      const response = isReject
        ? await reject.mutateAsync({ atrzHstryId, rjctRsn: text })
        : await approve.mutateAsync({ atrzHstryId, cmntCn: text });
      toast.success(response.message || t(isReject ? 'messages.approval.rejected' : 'messages.approval.approved'));
      onDone?.(decision);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const canSubmit = confirmed && (!isReject || text.trim().length > 0);

  const footer = (
    <div className={styles.footer}>
      {!isReject && (
        <span className={styles.footerLeft}>
          <ActionButton intent="danger" appearance="outlined" disabled={pending} onClick={() => switchTo('reject')}>
            {t('approval.decision.return')}
          </ActionButton>
        </span>
      )}
      <ActionButton action="cancel" intent="primary" appearance="outlined" onClick={onClose}>
        {t('messages.dialog.cancel')}
      </ActionButton>
      <ActionButton
        action="confirm"
        intent={isReject ? 'danger' : 'primary'}
        appearance="filled"
        loading={pending}
        disabled={!canSubmit}
        onClick={() => void handleSubmit()}
      >
        {isReject ? t('approval.decision.submit') : approveText}
      </ActionButton>
    </div>
  );

  return (
    <Popup open width={640} title={isReject ? t('approval.decision.reject') : t('approval.decision.approve')} onCancel={onClose} footer={footer}>
      <LoadingSpinner spinning={isFetching && !session}>
        <ApprovalSummary
          rows={[
            { label: t('approval.fields.process'), value: session?.atrzProcNm || stageLabel },
            { label: t('approval.fields.target'), value: session?.atrzTrgtNo ?? target ?? session?.atrzTrgtId ?? '-' },
            {
              label: t('approval.fields.requester'),
              value: session?.rtsoEmpNo ? `${requester ?? session.rtsoEmpNo} · ${formatDateTime(session.rtsoDt)}` : '-',
            },
            { label: t('approval.fields.approver'), value: me ? `${me.usrNm ?? ''} (${me.usrId})` : '-' },
            // Business content of the target from the server; the caller's rows only when it sends none.
            ...(session?.target ? targetSummaryRows(session.target) : details),
          ]}
        />
      </LoadingSpinner>
      <div className={styles.field}>
        <label className={`${styles.label} ${isReject ? styles.required : ''}`}>{isReject ? t('approval.fields.rejectionReason') : t('approval.fields.opinion')}</label>
        <TextArea
          rows={4}
          maxLength={1000}
          showCount
          placeholder={isReject ? t('messages.approval.reasonRequired') : undefined}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className={styles.confirmRow}>
        <AppCheckbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}>
          {t(isReject ? 'messages.approval.confirmReject' : 'messages.approval.confirmApprove')}
        </AppCheckbox>
      </div>
    </Popup>
  );
}
