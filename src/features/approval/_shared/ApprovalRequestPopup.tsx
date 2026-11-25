import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Popup from '@/components/common/popup/Popup';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import TextArea from '@/components/inputs/TextArea';
import { useNotify } from '@/hooks/use-notify';
import { useAuthStore } from '@/stores/auth-store';
import { APPROVAL_STAGE_LABELS, approvalStageOf, approverStepOf } from '@/api/common/approval-api';
import type { ApprovalRequestBody } from '@/api/common/approval-api';
import { errorMessage } from '@/utils/system-utils';
import { ApprovalSummary, EmployeePickField } from './ApprovalParts';
import type { ApprovalDetailRow } from './ApprovalParts';
import styles from './approval-popups.module.scss';

// Approval Request popup (VPA020100P01). The calling screen owns the endpoint (POST …/approval of an
// application, contract, annex, termination or report) and passes it as `onSubmit`; this popup collects the
// approver (candidates of the process' approver step), the comment and the confirmation.

export interface ApprovalRequestPopupProps {
  /** Process of the request, e.g. PROC_DSPSL_MDT_RCPT; decides the title and the approver step. */
  atrzProcCd: string;
  /** Session already open for the target (application approvals), so candidates follow its role snapshot. */
  atrzHstryId?: string;
  title?: string;
  /** Business detail of the target (code, member, NPL, value, …). */
  details?: ApprovalDetailRow[];
  /** Sends the request; resolve on success (the caller shows the toast and closes), reject to keep the popup. */
  onSubmit: (body: ApprovalRequestBody) => Promise<unknown>;
  onClose: () => void;
}

export default function ApprovalRequestPopup({
  atrzProcCd,
  atrzHstryId,
  title,
  details = [],
  onSubmit,
  onClose,
}: ApprovalRequestPopupProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const me = useAuthStore((s) => s.user);
  const [approverEmpNo, setApproverEmpNo] = useState('');
  const [comment, setComment] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approverError, setApproverError] = useState('');

  const stageLabel = APPROVAL_STAGE_LABELS[approvalStageOf(atrzProcCd)];

  const handleSubmit = async () => {
    if (!approverEmpNo) {
      setApproverError(t('messages.approval.approverRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ approverEmpNo, comment: comment.trim() || undefined });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popup
      open
      width={640}
      title={title ?? `Request ${stageLabel}`}
      footerAlign="right"
      onCancel={onClose}
      cancelText={t('messages.dialog.cancel')}
      onConfirm={() => void handleSubmit()}
      confirmText="Submit"
      confirmLoading={submitting}
      confirmDisabled={!confirmed || !approverEmpNo}
    >
      <ApprovalSummary
        rows={[
          { label: 'Approval Stage', value: stageLabel },
          { label: 'Requester', value: me ? `${me.usrNm ?? ''} (${me.usrId})` : '-' },
          ...details,
        ]}
      />
      <div className={styles.field}>
        <label className={`${styles.label} ${styles.required}`}>Approver</label>
        <EmployeePickField
          value={approverEmpNo}
          onChange={(empNo) => {
            setApproverEmpNo(empNo);
            setApproverError('');
          }}
          source={{ type: 'candidates', atrzProcCd, stpNo: approverStepOf(atrzProcCd), atrzHstryId }}
          placeholder="Select the approver"
          searchTitle="Approver Search"
        />
        {approverError && <div className={styles.error}>{approverError}</div>}
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Comment</label>
        <TextArea rows={3} maxLength={1000} showCount value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      <div className={styles.confirmRow}>
        <AppCheckbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}>
          {t('messages.approval.confirmRequest')}
        </AppCheckbox>
      </div>
    </Popup>
  );
}
