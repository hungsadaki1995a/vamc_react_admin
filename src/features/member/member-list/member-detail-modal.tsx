import { useState } from 'react';
import { Modal, Select, message } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { getMember } from '@/api/generated/sdk.gen';
import type { MemberItem, MemberClassification } from './member.types';
import styles from './member-detail-modal.module.scss';

interface MemberDetailModalProps {
  visible: boolean;
  member: MemberItem | null;
  onClose: () => void;
  onStatusChange?: (memberId: string, newAccountStatus: MemberItem['accountStatus']) => void;
  onApprovalChange?: (memberId: string, newApprovalStatus: MemberItem['approvalStatus']) => void;
  onEdit?: (member: MemberItem) => void;
}

function formatDateSlash(val?: string, fallback = '-'): string {
  if (!val || val === '-') return fallback;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) return val.replace(/-/g, '/');
  const d = dayjs(val);
  return d.isValid() ? d.format('DD/MM/YYYY') : val;
}

function formatDateHyphen(val?: string, fallback = '-'): string {
  if (!val || val === '-') return fallback;
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) return val;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val.replace(/\//g, '-');
  const d = dayjs(val);
  return d.isValid() ? d.format('DD-MM-YYYY') : val;
}

export default function MemberDetailModal({
  visible,
  member,
  onClose,
  onApprovalChange,
  onEdit,
}: MemberDetailModalProps) {
  const [classificationOverride, setClassificationOverride] = useState<MemberClassification | null>(null);

  // Fetch complete member profile details from API if memberCode is available
  const { data: apiDetail } = useQuery({
    queryKey: ['memberDetail', member?.memberCode],
    queryFn: async () => {
      if (!member?.memberCode) return null;
      try {
        const res = await getMember({
          path: { mbrNo: member.memberCode },
          throwOnError: true,
        });
        return res.data?.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: visible && !!member?.memberCode,
  });

  if (!member) return null;

  // Basic info fields
  const memberCode = apiDetail?.basic?.mbrNo || member.memberCode || '-';
  const memberType = apiDetail?.basic?.mbrTypeNm || member.memberType || '-';
  const currentClassification =
    classificationOverride ||
    (apiDetail?.basic?.mbrSttsNm as MemberClassification) ||
    member.memberClassification ||
    'Verified';

  const applicationId =
    apiDetail?.basic?.lgnId ||
    (member.applicationId && !member.applicationId.includes('...') ? member.applicationId : '-');

  const approvalDate = formatDateSlash(
    apiDetail?.basic?.aprvDt || (member.approvalDate !== '-' ? member.approvalDate : undefined),
  );

  const accountStatus = apiDetail?.basic?.acntSttsCd || member.accountStatus || 'Active';
  const membershipPayment =
    apiDetail?.basic?.mbrshpPayYn === 'Y'
      ? 'Paid'
      : apiDetail?.basic?.mbrshpPayYn === 'N'
      ? 'Unpaid'
      : '-';

  const membershipExpiryDate = formatDateSlash(apiDetail?.basic?.mbrshpEndDt);

  // Account info fields
  const accountId =
    apiDetail?.account?.lgnId ||
    (member.applicationId && !member.applicationId.includes('...') ? member.applicationId : '-');

  const phoneNumber =
    apiDetail?.account?.telno ||
    apiDetail?.account?.rawTelno ||
    (member.phone && !member.phone.includes('...') ? member.phone : '-');

  const emailAddress =
    apiDetail?.account?.emlAddr ||
    apiDetail?.account?.rawEmlAddr ||
    (member.email && !member.email.includes('...') ? member.email : '-');

  // ID info fields
  const idType = apiDetail?.identity?.uiiSeNm || apiDetail?.identity?.uiiSeCd || '-';
  const fullName = apiDetail?.identity?.fullNm || member.memberName || '-';
  const dateOfBirth = formatDateHyphen(apiDetail?.identity?.brdt);
  const gender = apiDetail?.identity?.gndrCd === 'F' ? 'Female' : apiDetail?.identity?.gndrCd === 'M' ? 'Male' : '-';
  const nationality = apiDetail?.identity?.ntnCd || '-';
  const cccdNumber = apiDetail?.identity?.uiiNo || apiDetail?.identity?.rawUiiNo || '-';
  const issuingAuthority = apiDetail?.identity?.uiiIssuInstNm || '-';
  const dateOfIssue = formatDateHyphen(apiDetail?.identity?.uiiIssuDt);
  const expiryDate = formatDateHyphen(apiDetail?.identity?.uiiExpryDt);

  const attachments: string[] =
    apiDetail?.identity?.files && apiDetail.identity.files.length > 0
      ? apiDetail.identity.files.map((f) => f.fileNm || 'ID_Document.jpg')
      : [];

  // Address fields
  const permProvince = apiDetail?.permanentAddress?.mctpvNm || '-';
  const permDistrict = apiDetail?.permanentAddress?.distNm || '-';
  const permDetailAddress = apiDetail?.permanentAddress?.daddr || '-';

  const currProvince = apiDetail?.currentAddress?.mctpvNm || '-';
  const currDistrict = apiDetail?.currentAddress?.distNm || '-';
  const currDetailAddress = apiDetail?.currentAddress?.daddr || '-';

  const handleApprovalRequest = () => {
    onApprovalChange?.(member.id, 'Requested');
    message.success('Approval request submitted successfully');
  };

  const handleClassificationChange = (value: MemberClassification) => {
    setClassificationOverride(value);
    message.info(`Member classification changed to ${value}`);
  };

  const handleEditClick = () => {
    message.info('Member information edit mode');
    onEdit?.(member);
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={980}
      title={null}
      footer={null}
      destroyOnClose
      styles={{
        body: {
          borderRadius: 8,
        },
      }}
    >
      <div className={styles.modalContent}>
        {/* Modal Main Heading */}
        <h1 className={styles.modalTitle}>Member Info Detail</h1>

        {/* ── 1. Basic Information ────────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>1</span>
            <span className={styles.sectionTitle}>Basic Information</span>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.detailTable}>
              <tbody>
                <tr>
                  <td className={styles.labelCell} style={{ width: '13%' }}>
                    Member Code
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {memberCode}
                  </td>
                  <td className={styles.labelCell} style={{ width: '13%' }}>
                    Member Type
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {memberType}
                  </td>
                  <td className={styles.labelCell} style={{ width: '14%' }}>
                    Member Classification
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    <div className={styles.classificationControl}>
                      <Select
                        value={currentClassification}
                        onChange={handleClassificationChange}
                        style={{ width: 130 }}
                        options={[
                          { value: 'Verified', label: 'Verified' },
                          { value: 'Pending (Approval)', label: 'Pending (Approval)' },
                          { value: 'Pending (Payment)', label: 'Pending (Payment)' },
                          { value: 'Rejected', label: 'Rejected' },
                        ]}
                      />
                      <button
                        type="button"
                        className={styles.btnApprovalRequest}
                        onClick={handleApprovalRequest}
                      >
                        Approval Request
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={styles.labelCell}>Application ID</td>
                  <td className={styles.valueCell}>{applicationId}</td>
                  <td className={styles.labelCell}>Approval Date</td>
                  <td className={styles.valueCell}>{approvalDate}</td>
                  <td className={styles.labelCell}>Account Status</td>
                  <td className={styles.valueCell}>{accountStatus}</td>
                </tr>
                <tr>
                  <td className={styles.labelCell}>Membership Payment</td>
                  <td className={styles.valueCell} colSpan={3}>
                    {membershipPayment}
                  </td>
                  <td className={styles.labelCell}>Membership Expiry Date</td>
                  <td className={styles.valueCell}>{membershipExpiryDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 2. Account Information ──────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>2</span>
            <span className={styles.sectionTitle}>Account Information</span>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.detailTable}>
              <tbody>
                <tr>
                  <td className={styles.labelCell} style={{ width: '13%' }}>
                    ID
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {accountId}
                  </td>
                  <td className={styles.labelCell} style={{ width: '13%' }}>
                    Phone Number
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {phoneNumber}
                  </td>
                  <td className={styles.labelCell} style={{ width: '14%' }}>
                    Email Address
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {emailAddress}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 3. ID Information ───────────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>3</span>
            <span className={styles.sectionTitle}>ID Information</span>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.detailTable}>
              <tbody>
                <tr>
                  <td className={styles.labelCell} style={{ width: '13%' }}>
                    ID Type
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {idType}
                  </td>
                  <td className={styles.labelCell} style={{ width: '13%' }}>
                    Full Name
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {fullName}
                  </td>
                  <td className={styles.labelCell} style={{ width: '14%' }}>
                    Date of Birth
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {dateOfBirth}
                  </td>
                </tr>
                <tr>
                  <td className={styles.labelCell}>Gender</td>
                  <td className={styles.valueCell}>{gender}</td>
                  <td className={styles.labelCell}>Nationality</td>
                  <td className={styles.valueCell}>{nationality}</td>
                  <td className={styles.labelCell}>CCCD Number</td>
                  <td className={styles.valueCell}>{cccdNumber}</td>
                </tr>
                <tr>
                  <td className={styles.labelCell}>Issuing Authority</td>
                  <td className={styles.valueCell}>{issuingAuthority}</td>
                  <td className={styles.labelCell}>Date of Issue</td>
                  <td className={styles.valueCell}>{dateOfIssue}</td>
                  <td className={styles.labelCell}>Expiry Date</td>
                  <td className={styles.valueCell}>{expiryDate}</td>
                </tr>
                <tr>
                  <td className={styles.labelCell}>Attachments</td>
                  <td className={styles.valueCell} colSpan={5}>
                    <div className={styles.attachmentsList}>
                      {attachments.length > 0 ? (
                        attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={`#${file}`}
                            className={styles.attachmentItem}
                            onClick={(e) => {
                              e.preventDefault();
                              message.info(`Viewing attachment: ${file}`);
                            }}
                          >
                            {file}
                          </a>
                        ))
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 4. Address Information ──────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>4</span>
            <span className={styles.sectionTitle}>Address Information</span>
          </div>

          {/* Subheading: Permanent Residence */}
          <div className={styles.subSectionTitle}>Permanent Residence</div>
          <div className={styles.tableContainer}>
            <table className={styles.detailTable}>
              <tbody>
                <tr>
                  <td className={styles.labelCell} style={{ width: '13%' }}>
                    Province / City
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {permProvince}
                  </td>
                  <td className={styles.labelCell} style={{ width: '13%' }}>
                    District
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {permDistrict}
                  </td>
                  <td className={styles.labelCell} style={{ width: '14%' }}>
                    Detailed Address
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {permDetailAddress}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Subheading: Current Residential Address */}
          <div className={styles.subSectionTitle}>Current Residential Address</div>
          <div className={styles.tableContainer}>
            <table className={styles.detailTable}>
              <tbody>
                <tr>
                  <td className={styles.labelCell} style={{ width: '13%' }}>
                    Province / City
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {currProvince}
                  </td>
                  <td className={styles.labelCell} style={{ width: '13%' }}>
                    District
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {currDistrict}
                  </td>
                  <td className={styles.labelCell} style={{ width: '14%' }}>
                    Detailed Address
                  </td>
                  <td className={styles.valueCell} style={{ width: '20%' }}>
                    {currDetailAddress}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer Actions ──────────────────────────────────────────────── */}
        <div className={styles.footerActions}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.btnEdit} onClick={handleEditClick}>
            Edit
          </button>
        </div>
      </div>
    </Modal>
  );
}
