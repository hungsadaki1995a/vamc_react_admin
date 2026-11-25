import { useState } from 'react';
import { PaperClipOutlined } from '@ant-design/icons';
import ActionButton from '@/components/common/actions/ActionButton';
import AppTooltip from '@/components/common/tooltip/AppTooltip';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import Popup from '@/components/common/popup/Popup';
import TextArea from '@/components/inputs/TextArea';
import dayjs from 'dayjs';
import { useNotify } from '@/hooks/use-notify';
import { errorMessage } from '@/utils/system-utils';
import { buildFeeHistoryRows } from './member-fee-history';
import { useMemberFeePayments } from './use-member-fee';
import type { MemberAddressDto, MemberAttachmentDto, PendingRequest } from '@/api/generated/types.gen';
import type { ApprovalCandidate } from '@/api/member/member-approval-api';
import { DELETION_BLOCK_REASONS } from '@/api/member/member-deletion-api';

import type { MemberItem, MemberStatus } from './member.types';
import {
  useMemberDetail,
  useUnlockMember,
  useResendTempPassword,
  useOpenAttachment,
} from './use-members';
import AppSelect from '@/components/inputs/AppSelect';
import {
  useDecideMemberRequest,
  useDeletionApprovers,
  useRequestMemberDeletion,
  useRequestMemberRestoration,
  useRestorationApprovers,
} from './use-member-deletion';
import styles from './member-detail-modal.module.scss';

interface MemberDetailModalProps {
  visible: boolean;
  member: MemberItem | null;
  onClose: () => void;
  onStatusChange?: (memberId: string, newAccountStatus: MemberItem['accountStatus']) => void;
  onApprovalChange?: (memberId: string, newApprovalStatus: MemberItem['approvalStatus']) => void;
  onEdit?: (member: MemberItem) => void;
}

function formatDateHyphen(val?: string, fallback = '-'): string {
  if (!val || val === '-') return fallback;
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) return val;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val.replace(/\//g, '-');
  const d = dayjs(val);
  return d.isValid() ? d.format('DD-MM-YYYY') : val;
}

function formatDeadline(val?: string): { text: string; isDanger: boolean } {
  const formatted = formatDateHyphen(val);
  if (formatted === '-') return { text: '-', isDanger: false };
  const [d, m, y] = formatted.split('-');
  const target = dayjs(`${y}-${m}-${d}`);
  if (!target.isValid()) return { text: formatted, isDanger: false };
  const diffDays = target.startOf('day').diff(dayjs().startOf('day'), 'day');
  const label = diffDays >= 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
  return { text: `${formatted} (${label})`, isDanger: diffDays <= 3 };
}

function approverOptions(approvers: ApprovalCandidate[]) {
  return approvers.map((a) => ({
    value: a.empNo,
    label: `${a.empNm} (${a.empNo})${a.roleNm ? ` · ${a.roleNm}` : ''}`,
  }));
}

/** Pending deletion / restoration request; its approver approves or rejects it here (no approval inbox screen). */
function PendingRequestPanel({
  title,
  request,
  canDecide,
  approveText,
  deciding,
  onDecide,
}: {
  title: string;
  request: PendingRequest;
  canDecide: boolean;
  approveText: string;
  deciding: boolean;
  onDecide: (approve: boolean, text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState('');
  const decide = async (approve: boolean) => {
    if (await onDecide(approve, text.trim())) setText('');
  };
  return (
    <div className={styles.restorePanel}>
      <div>
        <strong>{title}</strong>
        {` by ${request.requesterNm || request.requesterEmpNo || '-'}`}
        {request.requestedAt ? ` on ${dayjs(request.requestedAt).format('DD-MM-YYYY HH:mm')}` : ''}
        {` · approver ${request.approverNm || request.approverEmpNo || '-'}`}
      </div>
      {canDecide && (
        <div className={styles.restoreDecision}>
          <TextArea
            rows={2}
            maxLength={500}
            placeholder="Comment (required to reject)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className={styles.restoreDecisionButtons}>
            <ActionButton action="cancel" disabled={deciding} onClick={() => void decide(false)}>
              Reject
            </ActionButton>
            <ActionButton intent="primary" appearance="filled" disabled={deciding} onClick={() => void decide(true)}>
              {approveText}
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusClass(status: MemberStatus): string {
  if (status === 'Active') return styles.statusActive;
  if (status === 'Pending Approval' || status === 'Supplement Requested') return styles.statusPending;
  if (status === 'Rejected') return styles.statusRejected;
  if (status === 'Deleted') return styles.statusDeleted;
  return styles.statusLocked;
}

function AttachmentRows({
  files,
  onPreview,
}: {
  files?: MemberAttachmentDto[];
  onPreview: (file: MemberAttachmentDto) => void;
}) {
  if (!files || files.length === 0) return null;
  return (
    <tr>
      <td className={styles.labelCell}>Attachments</td>
      <td className={styles.valueCell} colSpan={5}>
        <div className={styles.attachmentsList}>
          {files.map((file, idx) => (
            <a
              key={file.fileUnqId || idx}
              href={file.previewUrl || file.downloadUrl || '#'}
              className={styles.attachmentItem}
              onClick={(e) => {
                e.preventDefault();
                onPreview(file);
              }}
            >
              <PaperClipOutlined />
              <span>{file.fileNm || 'Attachment'}</span>
            </a>
          ))}
        </div>
      </td>
    </tr>
  );
}

function AddressTable({
  title,
  address,
  files,
  onPreview,
}: {
  title: string;
  address?: MemberAddressDto;
  files?: MemberAttachmentDto[];
  onPreview?: (file: MemberAttachmentDto) => void;
}) {
  return (
    <>
      <div className={styles.subSectionTitle}>{title}</div>
      <div className={styles.tableContainer}>
        <table className={styles.detailTable}>
          <tbody>
            <tr>
              <td className={styles.labelCell}>Province / City</td>
              <td className={styles.valueCell}>{address?.mctpvNm || '-'}</td>
              <td className={styles.labelCell}>District</td>
              <td className={styles.valueCell}>{address?.distNm || '-'}</td>
            </tr>
            <tr>
              <td className={styles.labelCell}>Detailed Address</td>
              <td className={styles.valueCell} colSpan={3}>
                {address?.daddr || '-'}
              </td>
            </tr>
            {files && files.length > 0 && onPreview && (
              <tr>
                <td className={styles.labelCell}>Attachments</td>
                <td className={styles.valueCell} colSpan={3}>
                  <div className={styles.attachmentsList}>
                    {files.map((file, idx) => (
                      <a
                        key={file.fileUnqId || idx}
                        href={file.previewUrl || file.downloadUrl || '#'}
                        className={styles.attachmentItem}
                        onClick={(e) => {
                          e.preventDefault();
                          onPreview(file);
                        }}
                      >
                        <PaperClipOutlined />
                        <span>{file.fileNm || 'Attachment'}</span>
                      </a>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function MemberDetailModal({
  visible,
  member,
  onClose,
  onStatusChange,
  onEdit,
}: MemberDetailModalProps) {
  const { toast } = useNotify();

  // Sub-modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteApprover, setDeleteApprover] = useState<string | undefined>();

  const { data: apiDetail, isLoading } = useMemberDetail(member?.memberCode, visible);
  const { mutate: unlockMember, isPending: isUnlocking } = useUnlockMember();
  const { mutate: openAttachment } = useOpenAttachment();
  const { mutate: resendPassword, isPending: isResending } = useResendTempPassword();
  // Decided 2026-11-23: the Staff in Charge requests the deletion, the chosen approver decides
  const deletion = useRequestMemberDeletion();
  const { data: deleteApprovers = [], isFetching: isLoadingDeleteApprovers } = useDeletionApprovers(deleteModalOpen);
  // Decided 2026-11-23: restore within one year of the deletion, through the chosen approver (C05)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreApprover, setRestoreApprover] = useState<string | undefined>();
  const restoration = useRequestMemberRestoration();
  const { data: restoreApprovers = [], isFetching: isLoadingApprovers } = useRestorationApprovers(restoreModalOpen);
  // The approver decides a pending deletion / restoration here: there is no separate approval inbox screen
  const decideRequest = useDecideMemberRequest();
  // Every payment, newest first (Q-M7); one row from the current period while the server keeps no history
  const { data: feePayments } = useMemberFeePayments(visible && member ? member.memberCode : null);

  if (!member) return null;

  const mbrNo = apiDetail?.basic?.mbrNo || apiDetail?.mbrNo || member.memberCode;
  const sgdnMbrCode = apiDetail?.basic?.sgdnMbrCd || member.sgdnMemberCode || '-';

  const typeCd = (apiDetail?.basic?.mbrTypeCd || apiDetail?.mbrTypeCd || '').toUpperCase();
  const memberTypeLabel =
    typeCd === 'O' || member.memberType === 'Organization'
      ? 'Organization'
      : typeCd === 'F' || member.memberType === 'Foreigner'
        ? 'Foreigner'
        : 'Individual';
  const isOrganization = memberTypeLabel === 'Organization';
  const isForeigner = memberTypeLabel === 'Foreigner';

  const grdCd = (apiDetail?.basic?.mbrGrdCd || '').toUpperCase();
  const memberGradeLabel =
    grdCd === 'F' || member.memberGrade === 'Full'
      ? 'Full Member'
      : grdCd === 'G' || member.memberGrade === 'General'
        ? 'General Member'
        : 'Temporary Member';
  const isTemporary = memberGradeLabel === 'Temporary Member';

  const statusValue: MemberStatus =
    apiDetail?.deletion || member.memberGrade === 'Deleted' || member.status === 'Deleted'
      ? 'Deleted'
      : apiDetail?.basic?.acntSttsCd === 'LOCKED' || apiDetail?.acntSttsCd === 'LOCKED'
        ? 'Locked'
        : member.status || 'Active';
  const isDeleted = statusValue === 'Deleted';
  // Restore: until the retention end (deleted + 1 year), unless a request already waits for approval
  const retentionEnd = apiDetail?.deletion?.rtnEndDt || member.retentionEndDate;
  const withinRetention = !!retentionEnd && !dayjs(retentionEnd).isBefore(dayjs().startOf('day'), 'day');
  const restoreState: 'restorable' | 'pending' | 'expired' = apiDetail?.deletion?.restorable
    ? 'restorable'
    : withinRetention
      ? 'pending'
      : 'expired';
  const isLocked = statusValue === 'Locked';
  const isRejected = statusValue === 'Rejected';

  const signUpChannel = member.signUpChannel || '-';
  const isOffline = signUpChannel === 'Offline';

  const approvalDate = isTemporary
    ? '-'
    : formatDateHyphen(apiDetail?.basic?.aprvDt || member.approvalDate);
  const termsAgreementDate = formatDateHyphen(apiDetail?.basic?.aplyDt || member.applicationDate);
  const staffInCharge = apiDetail?.basic?.officerNm || member.assignee || '-';
  const rejectionReason = apiDetail?.basic?.splmntRqstCn || '-';
  const paymentDeadline = formatDeadline(member.paymentDeadline || apiDetail?.basic?.mbrshpPayDueDt);
  // Payment deadline (decided 2026-11-23): sign-up / re-application + 15 days, applications in Pending Approval only
  const hasPaymentDeadline = isTemporary && statusValue === 'Pending Approval' && paymentDeadline.text !== '-';

  const paymentHistoryRows = buildFeeHistoryRows(feePayments, apiDetail?.basic);

  // Account Info
  const loginId = apiDetail?.account?.lgnId || member.loginId || '-';
  const phonePrefix = apiDetail?.account?.intlTelnoNtnNo ? `${apiDetail.account.intlTelnoNtnNo} ` : '';
  const phoneNumber = apiDetail?.account?.telno
    ? `${phonePrefix}${apiDetail.account.telno}`
    : member.phone || '-';
  const emailAddress = apiDetail?.account?.emlAddr || member.email || '-';

  // Individual / Foreigner ID Info
  const idType = apiDetail?.identity?.uiiSeNm || apiDetail?.identity?.uiiSeCd || '-';
  const isCmnd = (apiDetail?.identity?.uiiSeCd || '').toUpperCase() === 'CMND';
  const isPassport = (apiDetail?.identity?.uiiSeCd || '').toUpperCase() === 'PSPT';
  const idFiles = apiDetail?.identity?.files || apiDetail?.files?.filter((f) =>
    ['ID_CARD_FRONT', 'ID_CARD_BACK', 'PASSPORT'].includes((f.docType || '').toUpperCase()),
  );

  // Organization Info
  const corp = apiDetail?.corporate;
  const legalRep = apiDetail?.legalRepresentative;
  const agent = apiDetail?.authorizedAgent;
  const poaFiles = apiDetail?.files?.filter(
    (f) => (f.docType || '').toUpperCase() === 'POWER_OF_ATTORNEY',
  );


  const handlePreviewFile = (file: MemberAttachmentDto) => {
    const url = file.previewUrl || file.downloadUrl;
    if (url) {
      // The attachment API needs the bearer token: a plain window.open(url) is answered 401
      openAttachment(url, { onError: () => toast.error(`Failed to open ${file.fileNm || 'file'}.`) });
    } else {
      toast.info(`Preview unavailable for ${file.fileNm || 'file'}`);
    }
  };

  const handleUnlock = () => {
    unlockMember(mbrNo, {
      onSuccess: () => {
        toast.success('Account unlocked and changed to Active.');
        onStatusChange?.(member.id, 'Active');
      },
      onError: () => {
        toast.error('Failed to unlock account.');
      },
    });
  };

  const handleResendTempPassword = () => {
    resendPassword(mbrNo, {
      onSuccess: () => {
        toast.success('A new temporary password has been sent.');
      },
      onError: () => {
        toast.error('Cannot resend temporary password (member may have already set a password).');
      },
    });
  };

  const handleOpenDelete = () => {
    setDeleteReason('');
    setDeleteApprover(undefined);
    setDeleteModalOpen(true);
  };

  const handleSubmitDelete = async () => {
    if (!deleteReason.trim()) {
      toast.error('Please enter a deletion reason.');
      return;
    }
    if (!deleteApprover) {
      toast.error('Please select an approver.');
      return;
    }
    try {
      await deletion.mutateAsync({ mbrNo, reason: deleteReason.trim(), approverEmpNo: deleteApprover });
      toast.success('The deletion request was sent to the approver.');
      setDeleteModalOpen(false);
    } catch (error) {
      // MBR017 / MBR018 / E09 / request pending (409), MBR014 (not the officer in charge): the server says which
      toast.error(errorMessage(error));
    }
  };

  const handleOpenRestore = () => {
    setRestoreApprover(undefined);
    setRestoreModalOpen(true);
  };

  const handleSubmitRestore = async () => {
    if (!restoreApprover) {
      toast.error('Please select an approver.');
      return;
    }
    try {
      await restoration.mutateAsync({ mbrNo, approverEmpNo: restoreApprover });
      toast.success('The restoration request was sent to the approver.');
      setRestoreModalOpen(false);
    } catch (error) {
      // Past one year, request already open, contact or Login ID (MBR019) reused, MBR014: the server says which
      toast.error(errorMessage(error));
    }
  };

  const pendingRestoration = apiDetail?.deletion?.pendingRestoration ?? null;
  const canDecideRestoration = !!pendingRestoration && apiDetail?.deletion?.canDecideRestoration === true;
  const deletionRequest = isDeleted ? null : apiDetail?.deletionRequest ?? null;
  const canDecideDeletion = !!deletionRequest && apiDetail?.canDecideDeletion === true;
  // Until the detail loads the server has not said whether the member is deletable
  const deletable = apiDetail?.deletable === true;
  const deleteBlockedReason = deletable
    ? undefined
    : !apiDetail
      ? 'Loading member details'
      : (apiDetail.deletionBlockCd && DELETION_BLOCK_REASONS[apiDetail.deletionBlockCd]) ||
        'This member cannot be deleted';

  /** Returns true once decided; the popup then closes so the refreshed list shows the new status. */
  const handleDecide = async (
    request: PendingRequest,
    approve: boolean,
    text: string,
    done: { approved: string; rejected: string },
  ): Promise<boolean> => {
    if (!request.atrzHstryId) return false;
    if (!approve && !text) {
      toast.error('Please enter the rejection reason.');
      return false;
    }
    try {
      await decideRequest.mutateAsync({ atrzHstryId: request.atrzHstryId, approve, text });
      toast.success(approve ? done.approved : done.rejected);
      // The popup shows the list row it was opened with: close it so the refreshed list shows the new status
      onClose();
      return true;
    } catch (error) {
      // e.g. past one year of the deletion the restoration is refused and nothing changes
      toast.error(errorMessage(error));
      return false;
    }
  };

  const sectionAccountNum = 3;
  const sectionNextNum = 4;

  return (
    <>
      <Popup
        open={visible}
        onCancel={onClose}
        width={1200}
        title="Member Details"
        footer={null}
      >
        <div className={styles.modalContent}>
          {/* Header */}
          <div className={styles.modalHeaderRow}>
            <h1 className={styles.modalTitle}>Member Details</h1>
            {isDeleted && restoreState === 'restorable' && (
              <ActionButton intent="secondary" appearance="filled" onClick={handleOpenRestore}>
                Restore
              </ActionButton>
            )}
            {isDeleted && restoreState !== 'restorable' && (
              <span className={styles.restoreHint}>
                {restoreState === 'pending'
                  ? 'A restoration request is waiting for approval.'
                  : 'More than one year has passed since the deletion: the member can no longer be restored.'}
              </span>
            )}
          </div>

          {isDeleted && pendingRestoration && (
            <PendingRequestPanel
              title="Restoration requested"
              request={pendingRestoration}
              canDecide={canDecideRestoration}
              approveText="Approve Restoration"
              deciding={decideRequest.isPending}
              onDecide={(approve, text) =>
                handleDecide(pendingRestoration, approve, text, {
                  approved: 'The member was restored.',
                  rejected: 'The restoration request was rejected.',
                })
              }
            />
          )}

          {deletionRequest && (
            <PendingRequestPanel
              title="Deletion requested"
              request={deletionRequest}
              canDecide={canDecideDeletion}
              approveText="Approve Deletion"
              deciding={decideRequest.isPending}
              onDecide={(approve, text) =>
                handleDecide(deletionRequest, approve, text, {
                  approved: 'The member was deleted.',
                  rejected: 'The deletion request was rejected.',
                })
              }
            />
          )}

          <LoadingSpinner spinning={isLoading}>
            <div className={styles.modalBodyScroll}>
              {/* ── 1. Basic Information ────────────────────────────────────── */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionBadge}>1</span>
                  <span className={styles.sectionTitle}>Basic Information</span>
                </div>
                <div className={styles.tableContainer}>
                  <table className={styles.detailTable}>
                    <tbody>
                      <tr>
                        <td className={styles.labelCell}>Member Code</td>
                        <td className={styles.valueCell}>{mbrNo}</td>
                        <td className={styles.labelCell}>SGDN Member Code</td>
                        <td className={styles.valueCell}>{sgdnMbrCode}</td>
                        <td className={styles.labelCell}>Member Type</td>
                        <td className={styles.valueCell}>{memberTypeLabel}</td>
                      </tr>
                      <tr>
                        <td className={styles.labelCell}>Member Grade</td>
                        <td className={styles.valueCell}>{memberGradeLabel}</td>
                        <td className={styles.labelCell}>Status</td>
                        <td className={styles.valueCell}>
                          <div className={styles.inlineGroup}>
                            <span className={`${styles.statusLabel} ${getStatusClass(statusValue)}`}>
                              {statusValue}
                            </span>
                            {isLocked && (
                              <button
                                type="button"
                                className={styles.inlineActionBtn}
                                disabled={isUnlocking}
                                onClick={handleUnlock}
                              >
                                Unlock
                              </button>
                            )}
                          </div>
                        </td>
                        <td className={styles.labelCell}>Sign-up Channel</td>
                        <td className={styles.valueCell}>{signUpChannel}</td>
                      </tr>
                      <tr>
                        <td className={styles.labelCell}>Approval Date</td>
                        <td className={styles.valueCell}>{approvalDate}</td>
                        <td className={styles.labelCell}>Terms Agreement Date</td>
                        <td className={styles.valueCell}>{termsAgreementDate}</td>
                        <td className={styles.labelCell}>Staff in Charge</td>
                        <td className={styles.valueCell}>{staffInCharge}</td>
                      </tr>
                      {isRejected && (
                        <tr>
                          <td className={styles.labelCell}>Rejection Reason</td>
                          <td className={styles.valueCell} colSpan={5}>
                            {rejectionReason}
                          </td>
                        </tr>
                      )}
                      {hasPaymentDeadline && (
                        <tr>
                          <td className={styles.labelCell}>Payment Deadline</td>
                          <td className={styles.valueCell} colSpan={5}>
                            <span className={paymentDeadline.isDanger ? styles.deadlineDanger : undefined}>
                              {paymentDeadline.text}
                            </span>
                          </td>
                        </tr>
                      )}
                      {isDeleted && (
                        <>
                          <tr>
                            <td className={styles.labelCell}>Deleted Date</td>
                            <td className={styles.valueCell}>
                              {formatDateHyphen(apiDetail?.deletion?.delDt || member.deletedDate)}
                            </td>
                            <td className={styles.labelCell}>Retention End Date</td>
                            <td className={styles.valueCell}>
                              {formatDateHyphen(apiDetail?.deletion?.rtnEndDt || member.retentionEndDate)}
                            </td>
                            {/* Deletions since 2026-11-22 have no approver; the requester is the deleting officer */}
                            <td className={styles.labelCell}>Requester / Approver</td>
                            <td className={styles.valueCell}>
                              {`${apiDetail?.deletion?.requesterNm || '-'} / ${apiDetail?.deletion?.approverNm || '-'}`}
                            </td>
                          </tr>
                          <tr>
                            <td className={styles.labelCell}>Deletion Reason</td>
                            <td className={styles.valueCell} colSpan={5}>
                              {apiDetail?.deletion?.delRsn || '-'}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── 2. Membership Information ───────────────────────────────── */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionBadge}>2</span>
                  <span className={styles.sectionTitle}>Membership Information</span>
                </div>
                <div className={styles.subSectionTitle}>Payment History</div>
                <div className={styles.tableContainer}>
                  {paymentHistoryRows.length > 0 ? (
                    <table className={styles.historyTable}>
                      <thead>
                        <tr>
                          <th className="w-[60px]">No</th>
                          <th className="w-[140px]">Type</th>
                          <th>Membership Period</th>
                          <th className="w-[160px]">Payment Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistoryRows.map((row) => (
                          <tr key={row.no}>
                            <td className="text-center">{row.no}</td>
                            <td className="text-center">{row.type}</td>
                            <td className="text-center">
                              <span>{`${row.startDate} ~ ${row.endDate}`}</span>
                              {row.isCurrent && <span className={styles.currentBadge}>Current</span>}
                            </td>
                            <td className="text-center">{row.paymentDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className={styles.emptyHistory}>No membership history.</div>
                  )}
                </div>
              </div>

              {/* ── 3. Account Information ──────────────────────────────────── */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionBadge}>{sectionAccountNum}</span>
                  <span className={styles.sectionTitle}>
                    {isOrganization ? 'Account Information (Contact Person)' : 'Account Information'}
                  </span>
                </div>
                <div className={styles.tableContainer}>
                  <table className={styles.detailTable}>
                    <tbody>
                      <tr>
                        <td className={styles.labelCell}>Login ID</td>
                        <td className={styles.valueCell}>
                          <div className={styles.inlineGroup}>
                            <span>{loginId}</span>
                            {isOffline && !isDeleted && (
                              <button
                                type="button"
                                className={styles.inlineActionBtn}
                                disabled={isResending}
                                onClick={handleResendTempPassword}
                              >
                                Resend Temporary Password
                              </button>
                            )}
                          </div>
                        </td>
                        <td className={styles.labelCell}>Phone Number</td>
                        <td className={styles.valueCell}>{phoneNumber}</td>
                        <td className={styles.labelCell}>Email Address</td>
                        <td className={styles.valueCell}>{emailAddress}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Individual / Foreigner Sections ─────────────────────────── */}
              {!isOrganization ? (
                <>
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionBadge}>{sectionNextNum}</span>
                      <span className={styles.sectionTitle}>ID Card Information</span>
                    </div>
                    <div className={styles.tableContainer}>
                      <table className={styles.detailTable}>
                        <tbody>
                          <tr>
                            <td className={styles.labelCell}>Full Name</td>
                            <td className={styles.valueCell}>
                              {apiDetail?.identity?.fullNm || member.memberName || '-'}
                            </td>
                            <td className={styles.labelCell}>Date of Birth</td>
                            <td className={styles.valueCell}>
                              {formatDateHyphen(apiDetail?.identity?.brdt)}
                            </td>
                            <td className={styles.labelCell}>Gender</td>
                            <td className={styles.valueCell}>
                              {apiDetail?.identity?.gndrCd === 'F'
                                ? 'Female'
                                : apiDetail?.identity?.gndrCd === 'M'
                                  ? 'Male'
                                  : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td className={styles.labelCell}>Nationality</td>
                            <td className={styles.valueCell}>{apiDetail?.identity?.ntnCd || '-'}</td>
                            <td className={styles.labelCell}>ID Card Type</td>
                            <td className={styles.valueCell}>{idType}</td>
                            <td className={styles.labelCell}>ID Card Number</td>
                            <td className={styles.valueCell}>
                              {apiDetail?.identity?.uiiNo || apiDetail?.identity?.rawUiiNo || '-'}
                            </td>
                          </tr>
                          <tr>
                            <td className={styles.labelCell}>Issuing Authority</td>
                            <td className={styles.valueCell}>{apiDetail?.identity?.uiiIssuInstNm || '-'}</td>
                            <td className={styles.labelCell}>Issue Date</td>
                            <td className={styles.valueCell}>
                              {formatDateHyphen(apiDetail?.identity?.uiiIssuDt)}
                            </td>
                            {!isCmnd ? (
                              <>
                                <td className={styles.labelCell}>Expiry Date</td>
                                <td className={styles.valueCell}>
                                  {formatDateHyphen(apiDetail?.identity?.uiiExpryDt)}
                                </td>
                              </>
                            ) : (
                              <td className={styles.valueCell} colSpan={2} />
                            )}
                          </tr>
                          <AttachmentRows files={idFiles} onPreview={handlePreviewFile} />
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionBadge}>{sectionNextNum + 1}</span>
                      <span className={styles.sectionTitle}>Address Information</span>
                    </div>
                    {isForeigner && isPassport ? (
                      apiDetail?.currentAddress?.mctpvNm ? (
                        <AddressTable title="Vietnam Address" address={apiDetail.currentAddress} />
                      ) : (
                        <>
                          <div className={styles.subSectionTitle}>Overseas Address</div>
                          <div className={styles.tableContainer}>
                            <table className={styles.detailTable}>
                              <tbody>
                                <tr>
                                  <td className={`${styles.labelCell} w-[15%]!`}>
                                    Address
                                  </td>
                                  <td className={styles.valueCell}>
                                    {apiDetail?.permanentAddress?.daddr ||
                                      apiDetail?.currentAddress?.daddr ||
                                      '-'}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </>
                      )
                    ) : isPassport ? (
                      <AddressTable title="Place of Origin" address={apiDetail?.permanentAddress} />
                    ) : (
                      <>
                        <AddressTable title="Place of Residence" address={apiDetail?.currentAddress} />
                        <AddressTable title="Place of Origin" address={apiDetail?.permanentAddress} />
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* ── Organization Sections ───────────────────────────────────── */
                <>
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionBadge}>4</span>
                      <span className={styles.sectionTitle}>Company Information</span>
                    </div>
                    <div className={styles.tableContainer}>
                      <table className={styles.detailTable}>
                        <tbody>
                          <tr>
                            <td className={styles.labelCell}>Company Name</td>
                            <td className={styles.valueCell}>
                              {corp?.orgnzNm || member.companyName || '-'}
                            </td>
                            <td className={styles.labelCell}>Charter Capital (VND)</td>
                            <td className={styles.valueCell}>
                              {corp?.chrtrCptlAmt !== undefined
                                ? corp.chrtrCptlAmt.toLocaleString()
                                : '-'}
                            </td>
                            <td className={styles.labelCell}>Legal Document Type</td>
                            <td className={styles.valueCell}>
                              {corp?.lglDcmntSeNm || corp?.lglDcmntSeCd || '-'}
                            </td>
                          </tr>
                          <tr>
                            <td className={styles.labelCell}>Enterprise Code (MST)</td>
                            <td className={styles.valueCell}>{corp?.mstNo || corp?.rawMstNo || '-'}</td>
                            <td className={styles.labelCell}>Issuing Authority</td>
                            <td className={styles.valueCell}>{corp?.issuInstNm || '-'}</td>
                            <td className={styles.labelCell}>Issue Date</td>
                            <td className={styles.valueCell}>{formatDateHyphen(corp?.issuDt)}</td>
                          </tr>
                          {corp?.lglDcmntSeCd === 'I' && (
                            <tr>
                              <td className={styles.labelCell}>Project Code</td>
                              <td className={styles.valueCell} colSpan={5}>
                                {corp?.orgnzBrno || '-'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <AddressTable
                      title="Company Address"
                      address={corp?.headOfficeAddress}
                      files={corp?.files}
                      onPreview={handlePreviewFile}
                    />
                  </div>

                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionBadge}>5</span>
                      <span className={styles.sectionTitle}>Legal Representative Information</span>
                    </div>
                    <div className={styles.tableContainer}>
                      <table className={styles.detailTable}>
                        <tbody>
                          <tr>
                            <td className={styles.labelCell}>Full Name</td>
                            <td className={styles.valueCell}>{legalRep?.fullNm || '-'}</td>
                            <td className={styles.labelCell}>Position</td>
                            <td className={styles.valueCell} colSpan={3}>
                              {legalRep?.jbpsNm || '-'}
                            </td>
                          </tr>
                          <tr>
                            <td className={styles.labelCell}>ID Card Type</td>
                            <td className={styles.valueCell}>{legalRep?.uiiSeCd || '-'}</td>
                            <td className={styles.labelCell}>ID Card Number</td>
                            <td className={styles.valueCell}>
                              {legalRep?.uiiNo || legalRep?.rawUiiNo || '-'}
                            </td>
                            <td className={styles.labelCell}>Issuing Authority</td>
                            <td className={styles.valueCell}>{legalRep?.issuInstNm || '-'}</td>
                          </tr>
                          <tr>
                            <td className={styles.labelCell}>Issue Date</td>
                            <td
                              className={styles.valueCell}
                              colSpan={(legalRep?.uiiSeCd || '').toUpperCase() === 'CMND' ? 5 : 1}
                            >
                              {formatDateHyphen(legalRep?.issuDt)}
                            </td>
                            {(legalRep?.uiiSeCd || '').toUpperCase() !== 'CMND' && (
                              <>
                                <td className={styles.labelCell}>Expiry Date</td>
                                <td className={styles.valueCell} colSpan={3}>
                                  {formatDateHyphen(legalRep?.expryDt)}
                                </td>
                              </>
                            )}
                          </tr>
                          <AttachmentRows files={legalRep?.files} onPreview={handlePreviewFile} />
                        </tbody>
                      </table>
                    </div>
                    <AddressTable title="Legal Representative Address" address={legalRep?.address} />
                  </div>

                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionBadge}>6</span>
                      <span className={styles.sectionTitle}>
                        Contact Person (Authorized Representative) Information
                      </span>
                    </div>
                    <div className={styles.tableContainer}>
                      <table className={styles.detailTable}>
                        <tbody>
                          <tr>
                            <td className={styles.labelCell}>Applied by Legal Representative</td>
                            <td className={styles.valueCell} colSpan={agent ? 1 : 5}>
                              {apiDetail?.selfApplyYn || '-'}
                            </td>
                            {agent && (
                              <>
                                <td className={styles.labelCell}>Full Name</td>
                                <td className={styles.valueCell} colSpan={3}>
                                  {agent.fullNm || '-'}
                                </td>
                              </>
                            )}
                          </tr>
                          {agent && (
                            <>
                              <tr>
                                <td className={styles.labelCell}>ID Card Type</td>
                                <td className={styles.valueCell}>{agent.uiiSeCd || '-'}</td>
                                <td className={styles.labelCell}>ID Card Number</td>
                                <td className={styles.valueCell}>
                                  {agent.uiiNo || agent.rawUiiNo || '-'}
                                </td>
                                <td className={styles.labelCell}>Issuing Authority</td>
                                <td className={styles.valueCell}>{agent.issuInstNm || '-'}</td>
                              </tr>
                              <tr>
                                <td className={styles.labelCell}>Issue Date</td>
                                <td className={styles.valueCell}>{formatDateHyphen(agent.issuDt)}</td>
                                <td className={styles.labelCell}>Expiry Date</td>
                                <td className={styles.valueCell} colSpan={3}>
                                  {formatDateHyphen(agent.expryDt)}
                                </td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {(agent?.address || (agent?.files && agent.files.length > 0)) && (
                      <AddressTable
                        title="Contact Person Address"
                        address={agent?.address}
                        files={agent?.files}
                        onPreview={handlePreviewFile}
                      />
                    )}
                  </div>

                  {poaFiles && poaFiles.length > 0 && (
                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <span className={styles.sectionBadge}>7</span>
                        <span className={styles.sectionTitle}>Power of Attorney</span>
                      </div>
                      <div className={styles.tableContainer}>
                        <table className={styles.detailTable}>
                          <tbody>
                            <AttachmentRows files={poaFiles} onPreview={handlePreviewFile} />
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </LoadingSpinner>

          {/* Fixed Bottom Footer */}
          <div className={styles.footerActions}>
            {!isDeleted && (
              <AppTooltip variant="default" description={deleteBlockedReason}>
                {/* A disabled button fires no mouse events: the wrapper keeps the tooltip working */}
                <span className={styles.deleteTrigger}>
                  <ActionButton
                    action="deleteRow"
                    className={styles.btnDelete}
                    disabled={!deletable}
                    onClick={handleOpenDelete}
                  >
                    Delete
                  </ActionButton>
                </span>
              </AppTooltip>
            )}
            <div className={styles.footerRight}>
              <ActionButton action="cancel" className={styles.btnCancel} onClick={onClose}>
                Cancel
              </ActionButton>
              {!isDeleted && (
                <ActionButton
                  intent="primary"
                  appearance="filled"
                  className={styles.btnEdit}
                  onClick={() => onEdit?.(member)}
                >
                  Edit
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      </Popup>

      {/* Deletion Request Popup (C04): the chosen approver deletes; soft delete, the data is kept for reporting */}
      <Popup
        open={deleteModalOpen}
        title="Request Member Deletion"
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleSubmitDelete}
        confirmText="Request Deletion"
        confirmLoading={deletion.isPending}
        confirmDanger
        footerAlign="right"
      >
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1 font-medium">Deletion Reason *</div>
            <TextArea
              rows={3}
              maxLength={500}
              showCount
              placeholder="Enter deletion reason (up to 500 characters)"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-1 font-medium">Approver *</div>
            <AppSelect<string>
              className="w-full"
              placeholder="Select an approver"
              loading={isLoadingDeleteApprovers}
              value={deleteApprover}
              onChange={setDeleteApprover}
              options={approverOptions(deleteApprovers)}
            />
          </div>
          <div className={styles.deleteNotice}>
            Once the approver approves, the member is deleted and can no longer log in. Within one year it can be
            restored through an approver; after that it cannot be restored. The data is kept for reporting.
          </div>
        </div>
      </Popup>

      {/* Restoration Request Popup (C05): approved by the chosen approver, within one year of the deletion */}
      <Popup
        open={restoreModalOpen}
        title="Request Member Restoration"
        onCancel={() => setRestoreModalOpen(false)}
        onConfirm={handleSubmitRestore}
        confirmText="Request Restoration"
        confirmLoading={restoration.isPending}
        footerAlign="right"
      >
        <div className="flex flex-col gap-3">
          <div className={styles.deleteNotice}>
            Once approved, the member account returns to the previous status and the member can log in again.
            Restorable until {formatDateHyphen(apiDetail?.deletion?.rtnEndDt || member.retentionEndDate)}.
          </div>
          <div>
            <div className="mb-1 font-medium">Approver *</div>
            <AppSelect<string>
              className="w-full"
              placeholder="Select an approver"
              loading={isLoadingApprovers}
              value={restoreApprover}
              onChange={setRestoreApprover}
              options={approverOptions(restoreApprovers)}
            />
          </div>
        </div>
      </Popup>
    </>
  );
}
