import { useState } from 'react';
import { Modal, Select, message } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { getMember } from '@/api/generated/sdk.gen';
import type { MemberItem, MemberClassification } from './member.types';
import styles from './MemberDetailModal.module.css';

interface MemberDetailModalProps {
  visible: boolean;
  member: MemberItem | null;
  onClose: () => void;
  onStatusChange?: (memberId: string, newAccountStatus: MemberItem['accountStatus']) => void;
  onApprovalChange?: (memberId: string, newApprovalStatus: MemberItem['approvalStatus']) => void;
  onEdit?: (member: MemberItem) => void;
}

function formatDateSlash(val?: string, fallback = '01/03/2026'): string {
  if (!val || val === '-') return fallback;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) return val.replace(/-/g, '/');
  const d = dayjs(val);
  return d.isValid() ? d.format('DD/MM/YYYY') : val;
}

function formatDateHyphen(val?: string, fallback = '01-02-2021'): string {
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
  const memberCode = apiDetail?.basic?.mbrNo || member.memberCode || 'M1788698085437';
  const memberType = apiDetail?.basic?.mbrTypeNm || member.memberType || 'General';
  const currentClassification =
    classificationOverride ||
    (apiDetail?.basic?.mbrSttsNm as MemberClassification) ||
    member.memberClassification ||
    'Verified';

  const applicationId =
    apiDetail?.basic?.lgnId ||
    (member.applicationId && !member.applicationId.includes('...') ? member.applicationId : '84031123456');

  const approvalDate = formatDateSlash(
    apiDetail?.basic?.aprvDt || (member.approvalDate !== '-' ? member.approvalDate : undefined),
    '01/03/2026',
  );

  const accountStatus = apiDetail?.basic?.acntSttsCd || member.accountStatus || 'Active';
  const membershipPayment =
    apiDetail?.basic?.mbrshpPayYn === 'Y'
      ? 'Paid'
      : apiDetail?.basic?.mbrshpPayYn === 'N'
      ? 'Unpaid'
      : 'Unpaid';

  const membershipExpiryDate = formatDateSlash(apiDetail?.basic?.mbrshpEndDt, '01/03/2027');

  // Account info fields
  const accountId =
    apiDetail?.account?.lgnId ||
    (member.applicationId && !member.applicationId.includes('...') ? member.applicationId : '840901234567');

  const phoneNumber =
    apiDetail?.account?.telno ||
    apiDetail?.account?.rawTelno ||
    (member.phone && !member.phone.includes('...') ? member.phone : '+84 0900000019');

  const emailAddress =
    apiDetail?.account?.emlAddr ||
    apiDetail?.account?.rawEmlAddr ||
    (member.email && !member.email.includes('...') ? member.email : 'demo_user_019@example.com');

  // ID info fields
  const idType = apiDetail?.identity?.uiiSeNm || apiDetail?.identity?.uiiSeCd || 'CCCD';
  const fullName = apiDetail?.identity?.fullNm || member.memberName || 'Nguyễn Văn Minh';
  const dateOfBirth = formatDateHyphen(apiDetail?.identity?.brdt, '12-08-1990');
  const gender = apiDetail?.identity?.gndrCd === 'F' ? 'Female' : 'Male';
  const nationality = apiDetail?.identity?.ntnCd || 'Vietnamese';
  const cccdNumber = apiDetail?.identity?.uiiNo || apiDetail?.identity?.rawUiiNo || '012345678901';
  const issuingAuthority = apiDetail?.identity?.uiiIssuInstNm || 'Cục Cảnh sát QLHC';
  const dateOfIssue = formatDateHyphen(apiDetail?.identity?.uiiIssuDt, '01-02-2021');
  const expiryDate = formatDateHyphen(apiDetail?.identity?.uiiExpryDt, '01-02-2036');

  const attachments: string[] =
    apiDetail?.identity?.files && apiDetail.identity.files.length > 0
      ? apiDetail.identity.files.map((f) => f.fileNm || 'ID_Document.jpg')
      : ['ID_Front.jpg', 'ID_Back.jpg'];

  // Address fields
  const permProvince = apiDetail?.permanentAddress?.mctpvNm || 'Hà Nội';
  const permDistrict = apiDetail?.permanentAddress?.distNm || 'Cầu Giấy';
  const permDetailAddress = apiDetail?.permanentAddress?.daddr || 'Số 10, Ngõ 25, Phường Dịch Vọng';

  const currProvince = apiDetail?.currentAddress?.mctpvNm || 'Hà Nội';
  const currDistrict = apiDetail?.currentAddress?.distNm || 'Cầu Giấy';
  const currDetailAddress = apiDetail?.currentAddress?.daddr || 'Phường Bến Nghé';

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
                      {attachments.map((file, idx) => (
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
                      ))}
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
