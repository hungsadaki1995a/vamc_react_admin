import { useState } from 'react';
import StatusBadge, { type StatusBadgeColor } from '@/components/common/badge/StatusBadge';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import Popup from '@/components/common/popup/Popup';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { MEMBER_JOIN_OFFICER_STEP } from '@/api/member/member-approval-api';
import type { ApprovalStage, MemberApprovalContext, YesNo } from '@/api/member/member-approval-api';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import {
  useApproveMemberApplication,
  useAssignMemberOfficer,
  useCheckMemberDocuments,
  useCompleteMemberSignup,
  useMemberApprovalCandidates,
  useMemberApprovalContext,
  useReceiveMemberApplication,
} from './use-member-approval';
import styles from './member-approval-modal.module.scss';

// Member sign-up popup (ADF1234 P08–P12). Two steps (decided 2026-11-22):
//   1 receiver: Receive → Check documents (complete / supplement request) → Assign the officer in charge;
//   2 officer in charge: SGDN member code + fee terms → Complete.
// No approval and no rejection. The server decides which action is open to the signed-in employee
// (`availableAction`); the popup only shows that form.

type FieldKey = 'supplementNote' | 'assigneeEmpNo' | 'sgdnMbrCd';

interface ApprovalFormState {
  documents: YesNo;
  supplementNote: string;
  assigneeEmpNo: string;
  sgdnMbrCd: string;
  feeExempt: YesNo;
  feePaid: YesNo;
  comment: string;
}

const STAGE_BADGE: Record<ApprovalStage, { label: string; color: StatusBadgeColor }> = {
  NOT_RECEIVED: { label: 'Not Received', color: 'orange' },
  REQUESTED: { label: 'In Processing', color: 'blue' },
  IN_PROGRESS: { label: 'Waiting for Approver', color: 'green' },
  APPROVED: { label: 'Completed', color: 'violet' },
  REJECTED: { label: 'Closed', color: 'red' },
};

const STEP_NAMES: Record<string, string> = { RCPT: 'Receipt', PRCS: 'Officer in Charge', '1ST_ATRZ': 'Approval' };

const YES_NO_OPTIONS: { label: string; value: YesNo }[] = [
  { label: 'Yes', value: 'Y' },
  { label: 'No', value: 'N' },
];

const APPROVAL_MESSAGES = {
  title: 'Member Sign-up',
  loadFailed: 'The sign-up information could not be loaded.',
  viewOnly: 'No action is open to you at this step.',
  noPermission: 'You do not have write permission on this menu.',
  receiveHint: 'You will check the original documents and assign the officer in charge after receiving.',
  assignHint: 'The documents are complete. Assign the officer in charge who registers the SGDN member code.',
  legacyHint: 'This application was received before the approval step was removed and still waits for its approver.',
  sgdnFormat: 'Enter 1 to 10 characters: letters, digits, . _ / -',
  received: 'The application was received.',
  documentsComplete: 'The documents were marked complete.',
  supplementRequested: 'The supplement request was sent to the applicant.',
  assigned: 'The officer in charge was assigned.',
  completed: 'The member sign-up was completed.',
  approved: 'The application was approved.',
} as const;

const CONFIRM_TEXT: Record<string, string> = {
  RECEIVE: 'Receive',
  ASSIGN: 'Assign',
  REQUEST: 'Complete',
  DECIDE: 'Approve',
};

const SGDN_CODE_PATTERN = /^[A-Za-z0-9._/-]{1,10}$/;

function initialState(): ApprovalFormState {
  return {
    documents: 'Y',
    supplementNote: '',
    assigneeEmpNo: '',
    sgdnMbrCd: '',
    feeExempt: 'N',
    feePaid: 'N',
    comment: '',
  };
}

interface MemberApprovalModalProps {
  /** null = closed. */
  mbrNo: string | null;
  memberName?: string;
  canWrite: boolean;
  onClose: () => void;
}

/** Loads the approval context, then mounts the form of the open action. */
export default function MemberApprovalModal({ mbrNo, memberName, canWrite, onClose }: MemberApprovalModalProps) {
  const { data: context, isFetching, isError } = useMemberApprovalContext(mbrNo);

  if (mbrNo === null) return null;

  if (!context) {
    return (
      <Popup open title={APPROVAL_MESSAGES.title} width={560} onCancel={onClose} cancelText="Close">
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? APPROVAL_MESSAGES.loadFailed : null}</div>
        </LoadingSpinner>
      </Popup>
    );
  }

  // Remount when the step changes, so a finished action never leaves its values in the next form.
  return (
    <ApprovalForm
      key={`${context.mbrNo}:${context.stage}:${context.nowStpNo ?? 0}:${context.availableAction}`}
      context={context}
      memberName={memberName}
      canWrite={canWrite}
      onClose={onClose}
    />
  );
}

interface ApprovalFormProps {
  context: MemberApprovalContext;
  memberName?: string;
  canWrite: boolean;
  onClose: () => void;
}

function ApprovalForm({ context, memberName, canWrite, onClose }: ApprovalFormProps) {
  const { toast } = useNotify();
  const action = canWrite ? context.availableAction : 'VIEW';
  // Candidates of this member's session (its role snapshot), not of the process as currently configured
  const { data: candidates = NO_CANDIDATES } = useMemberApprovalCandidates(
    action === 'ASSIGN' ? MEMBER_JOIN_OFFICER_STEP : null,
    context.atrzHstryId ?? null,
  );
  const receive = useReceiveMemberApplication();
  const checkDocuments = useCheckMemberDocuments();
  const assign = useAssignMemberOfficer();
  const complete = useCompleteMemberSignup();
  const approve = useApproveMemberApplication();
  const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();
  const [values, setValues] = useState<ApprovalFormState>(initialState);

  const pending = receive.isPending || checkDocuments.isPending || assign.isPending || complete.isPending || approve.isPending;
  const stage = STAGE_BADGE[context.stage] ?? { label: context.stage, color: 'gray' as StatusBadgeColor };
  const candidateOptions = candidates.map((candidate) => ({
    label: candidate.jbpsNm ? `${candidate.empNm} (${candidate.jbpsNm})` : candidate.empNm,
    value: candidate.empNo,
  }));
  const holderLabel = context.nowStpNo === 1 ? 'Receiver' : 'Officer in Charge';

  const patch = (value: Partial<ApprovalFormState>, key?: FieldKey) => {
    setValues((prev) => ({ ...prev, ...value }));
    if (key) clearError(key);
  };

  const validate = (): boolean => {
    if (action === 'CHECK_DOCUMENTS' && values.documents === 'N') return checkRequired(values, ['supplementNote']);
    if (action === 'ASSIGN') return checkRequired(values, ['assigneeEmpNo']);
    if (action === 'REQUEST') {
      if (!checkRequired(values, ['sgdnMbrCd'])) return false;
      if (!SGDN_CODE_PATTERN.test(values.sgdnMbrCd.trim())) {
        setError('sgdnMbrCd', APPROVAL_MESSAGES.sgdnFormat);
        return false;
      }
    }
    return true;
  };

  const run = async (): Promise<string> => {
    const mbrNo = context.mbrNo;
    if (action === 'RECEIVE') {
      await receive.mutateAsync(mbrNo);
      return APPROVAL_MESSAGES.received;
    }
    if (action === 'CHECK_DOCUMENTS') {
      const isComplete = values.documents === 'Y';
      await checkDocuments.mutateAsync({ mbrNo, complete: isComplete, note: values.supplementNote.trim() });
      return isComplete ? APPROVAL_MESSAGES.documentsComplete : APPROVAL_MESSAGES.supplementRequested;
    }
    if (action === 'ASSIGN') {
      await assign.mutateAsync({ mbrNo, assigneeEmpNo: values.assigneeEmpNo });
      return APPROVAL_MESSAGES.assigned;
    }
    if (action === 'REQUEST') {
      await complete.mutateAsync({
        mbrNo,
        request: {
          sgdnMbrCd: values.sgdnMbrCd.trim(),
          mbrshpFeeExmpYn: values.feeExempt,
          // An exempt member has no fee to pay.
          mbrshpPayYn: values.feeExempt === 'Y' ? 'N' : values.feePaid,
        },
      });
      return APPROVAL_MESSAGES.completed;
    }
    await approve.mutateAsync({ atrzHstryId: context.atrzHstryId as string, comment: values.comment.trim() });
    return APPROVAL_MESSAGES.approved;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    try {
      toast.success(await run());
      onClose();
    } catch (error) {
      const fieldMap = { supplementNote: 'supplementNote', assigneeEmpNo: 'assigneeEmpNo', sgdnMbrCd: 'sgdnMbrCd' } as const;
      if (!applyApiError(error, {}, fieldMap)) toast.error(errorMessage(error));
    }
  };

  const confirmText =
    action === 'CHECK_DOCUMENTS'
      ? values.documents === 'N' ? 'Request Supplement' : 'Documents Complete'
      : CONFIRM_TEXT[action];

  return (
    <Popup
      open
      title={APPROVAL_MESSAGES.title}
      width={560}
      footerAlign="right"
      onCancel={onClose}
      cancelText={action === 'VIEW' ? 'Close' : 'Cancel'}
      onConfirm={action === 'VIEW' ? undefined : handleConfirm}
      confirmText={confirmText}
      confirmLoading={pending}
    >
      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          Member: <span className={styles.memberName}>{memberName || '-'}</span> ({context.mbrNo})
        </div>
        <div className={styles.summaryRow}>
          Current Status: <StatusBadge color={stage.color}>{stage.label}</StatusBadge>
        </div>
        {context.assignee?.empNm && (
          <div className={styles.summaryRow}>
            {holderLabel}: {context.assignee.empNm}
          </div>
        )}
        {context.approver?.empNm && <div className={styles.summaryRow}>Approver: {context.approver.empNm}</div>}
      </div>

      {context.steps && context.steps.length > 0 && (
        <ul className={styles.steps}>
          {context.steps.map((step) => (
            <li key={step.stpNo} className={styles.step}>
              <span className={styles.stepName}>
                {step.stpNo}. {STEP_NAMES[step.stpNm] ?? step.stpNm}
              </span>
              <span className={styles.stepActor}>{step.empNm ?? '-'}</span>
              <StatusBadge color={stepColor(step.status)}>{step.status}</StatusBadge>
              {step.comment && <span className={styles.stepComment}>{step.comment}</span>}
            </li>
          ))}
        </ul>
      )}

      {action === 'VIEW' && (
        <div className={styles.notice}>
          {canWrite || context.availableAction === 'VIEW' ? APPROVAL_MESSAGES.viewOnly : APPROVAL_MESSAGES.noPermission}
        </div>
      )}

      {action === 'RECEIVE' && <div className={styles.notice}>{APPROVAL_MESSAGES.receiveHint}</div>}

      {action === 'CHECK_DOCUMENTS' && (
        <>
          <div className={styles.field}>
            <span className={styles.label}>Original Documents</span>
            <AppRadio.Group
              value={values.documents}
              onChange={(event) => patch({ documents: event.target.value as YesNo })}
              options={[
                { label: 'Complete', value: 'Y' },
                { label: 'Incomplete (request supplement)', value: 'N' },
              ]}
            />
          </div>
          {values.documents === 'N' && (
            <div className={styles.field}>
              <label className={`${styles.label} ${styles.required}`}>Supplement Request</label>
              <TextArea
                rows={3}
                maxLength={1000}
                placeholder="Describe what the applicant must supplement"
                value={values.supplementNote}
                onChange={(event) => patch({ supplementNote: event.target.value }, 'supplementNote')}
              />
              {errors.supplementNote && <div className={styles.error}>{errors.supplementNote}</div>}
            </div>
          )}
        </>
      )}

      {action === 'ASSIGN' && (
        <>
          <div className={styles.notice}>{APPROVAL_MESSAGES.assignHint}</div>
          <div className={styles.field}>
            <label className={`${styles.label} ${styles.required}`}>Officer in Charge</label>
            <AppSelect
              className={styles.control}
              placeholder="Select the officer in charge"
              value={values.assigneeEmpNo || undefined}
              options={candidateOptions}
              onChange={(value) => patch({ assigneeEmpNo: String(value) }, 'assigneeEmpNo')}
            />
            {errors.assigneeEmpNo && <div className={styles.error}>{errors.assigneeEmpNo}</div>}
          </div>
        </>
      )}

      {action === 'REQUEST' && (
        <>
          <div className={styles.field}>
            <label className={`${styles.label} ${styles.required}`}>SGDN Member Code</label>
            <TextInput
              maxLength={10}
              value={values.sgdnMbrCd}
              onChange={(event) => patch({ sgdnMbrCd: event.target.value }, 'sgdnMbrCd')}
            />
            {errors.sgdnMbrCd && <div className={styles.error}>{errors.sgdnMbrCd}</div>}
          </div>
          <div className={styles.grid}>
            <div className={styles.field}>
              <span className={styles.label}>Membership Fee Exempt</span>
              <AppRadio.Group
                value={values.feeExempt}
                options={YES_NO_OPTIONS}
                onChange={(event) => patch({ feeExempt: event.target.value as YesNo })}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Membership Fee Paid</span>
              <AppRadio.Group
                value={values.feeExempt === 'Y' ? 'N' : values.feePaid}
                options={YES_NO_OPTIONS}
                disabled={values.feeExempt === 'Y'}
                onChange={(event) => patch({ feePaid: event.target.value as YesNo })}
              />
            </div>
          </div>
        </>
      )}

      {action === 'DECIDE' && (
        <>
          <div className={styles.notice}>{APPROVAL_MESSAGES.legacyHint}</div>
          <div className={styles.field}>
            <label className={styles.label}>Comment</label>
            <TextArea
              rows={3}
              maxLength={1000}
              value={values.comment}
              onChange={(event) => patch({ comment: event.target.value })}
            />
          </div>
        </>
      )}
    </Popup>
  );
}

/** Stable empty list while the candidates load. */
const NO_CANDIDATES: never[] = [];

function stepColor(status: string): StatusBadgeColor {
  if (status === 'APPROVED') return 'green';
  if (status === 'REJECTED') return 'red';
  if (status === 'WAITING') return 'gray';
  return 'blue';
}
