import { useState, useEffect, useRef } from 'react';
import { Form, Upload } from 'antd';
import ActionButton from '@/components/common/actions/ActionButton';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import Popup from '@/components/common/popup/Popup';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import AppDatePicker from '@/components/inputs/AppDatePicker';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import type { FormInstance } from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { MEMBER_FEE_ERRORS } from '@/api/member/member-fee-api';
import { apiErrorCode, errorMessage } from '@/utils/system-utils';
import { buildFeeHistoryRows, nextPeriodStart } from './member-fee-history';
import { useMemberFeePayments, useRegisterMembershipPayment } from './use-member-fee';

/** E06 of the member management system messages. */
const E06_PERIOD_OVERLAP = 'E06: This overlaps an existing membership period. Please check the start date.';
import { useNotify } from '@/hooks/use-notify';
import { MEMBER_JOIN_OFFICER_STEP } from '@/api/member/member-approval-api';
import { useAssignMemberOfficer, useMemberApprovalCandidates } from './use-member-approval';
import type {
  CreateMemberRequest,
  UpdateMemberRequest,
  MemberAttachmentDto,
  MemberDetailResponse,
} from '@/api/generated/types.gen';

import type { MemberItem, MemberType, MemberGrade, MemberStatus } from './member.types';
import {
  useMemberDetail,
  useCreateMember,
  useUpdateMember,
  useActiveProvinces,
  useActiveDistricts,
  useUploadMemberDocument,
  useRemoveMemberDocument,
  useOpenAttachment,
} from './use-members';
import type { MemberDocumentSlot, MemberDocumentType } from './use-members';
import styles from './member-detail-modal.module.scss';

export interface MemberFormModalProps {
  visible: boolean;
  mode?: 'register' | 'edit';
  member?: MemberItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UploadedFileItem {
  /** Group id of a stored attachment, or the file id of an upload of this session. */
  fileUnqId: string;
  fileNm: string;
  url?: string;
  /** Set for a file uploaded in this session: the slot it was stored in. */
  slot?: MemberDocumentSlot;
}

type DocumentSection = 'id' | 'corp' | 'agent' | 'poa';

/** BIZ_LICENSE and POA take several files; the ID slots take one each. */
const MAX_FILES_PER_MULTI_SLOT = 5;

/**
 * Slot of the next upload of a section, or null when the section is full.
 * An ID document is either a passport (one file) or a card with a front and a back.
 */
function nextDocumentSlot(section: DocumentSection, files: UploadedFileItem[], passport: boolean): MemberDocumentSlot | null {
  const used = files.map((f) => f.slot);
  if (section === 'corp' || section === 'poa') {
    const slot: MemberDocumentSlot = section === 'corp' ? 'BIZ_LICENSE' : 'POA';
    return used.filter((u) => u === slot).length < MAX_FILES_PER_MULTI_SLOT ? slot : null;
  }
  const [front, back, pass]: MemberDocumentSlot[] =
    section === 'id' ? ['ID_FRONT', 'ID_BACK', 'PASSPORT'] : ['AUTH_REP_ID_FRONT', 'AUTH_REP_ID_BACK', 'AUTH_REP_PASSPORT'];
  if (passport) return pass;
  if (!used.includes(front)) return front;
  if (!used.includes(back)) return back;
  return null;
}

/** Attachments of the request: only files uploaded in this session, a card side sent as FRONT / BACK. */
function toDocumentAttachments(files: UploadedFileItem[]): { fileId: string; side?: string }[] {
  return files
    .filter((f) => f.slot)
    .map((f) => ({
      fileId: f.fileUnqId,
      ...(f.slot?.endsWith('_FRONT') ? { side: 'FRONT' } : f.slot?.endsWith('_BACK') ? { side: 'BACK' } : {}),
    }));
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];

function parseDateValue(val?: string): dayjs.Dayjs | null {
  if (!val || val === '-') return null;
  const parsed = dayjs(val, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']);
  return parsed.isValid() ? parsed : null;
}

function formatCapitalVnd(val?: string | number): string {
  const digits = String(val ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseCapitalNumber(val?: string): number | undefined {
  const digits = String(val ?? '').replace(/\D/g, '');
  return digits ? Number(digits) : undefined;
}

function formatDeadline(val?: string): { text: string; isDanger: boolean } {
  const d = parseDateValue(val);
  if (!d) return { text: '-', isDanger: false };
  const diffDays = d.startOf('day').diff(dayjs().startOf('day'), 'day');
  const label = diffDays >= 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
  return { text: `${d.format('DD-MM-YYYY')} (${label})`, isDanger: diffDays <= 3 };
}

function mapAttachmentList(files?: MemberAttachmentDto[]): UploadedFileItem[] {
  return (files ?? [])
    .filter((f) => Boolean(f.fileUnqId || f.fileNm))
    .map((f) => ({
      fileUnqId: f.fileUnqId || '',
      fileNm: f.fileNm || 'Document',
      url: f.previewUrl || f.downloadUrl,
    }));
}

interface AddressFieldsProps {
  form: FormInstance;
  prefix: string;
  disabled?: boolean;
  optional?: boolean;
}

function CascadedAddressRows({ form, prefix, disabled = false, optional = false }: AddressFieldsProps) {
  const provinceCode = Form.useWatch([prefix, 'mctpvCd'], form) as string | undefined;
  const districtCode = Form.useWatch([prefix, 'distCd'], form) as string | undefined;
  const detailAddr = Form.useWatch([prefix, 'daddr'], form) as string | undefined;

  const { data: provinces = [], isLoading: loadingProv } = useActiveProvinces(true);
  const { data: districts = [], isLoading: loadingDist } = useActiveDistricts(provinceCode);

  const anyPartial = optional && Boolean(provinceCode || districtCode || detailAddr?.trim());
  const isRequired = !optional || anyPartial;

  return (
    <>
      <tr>
        <td className={styles.labelCell}>
          Province / City{isRequired && <span className={styles.requiredMark}>*</span>}
        </td>
        <td className={styles.valueCell}>
          <Form.Item
            name={[prefix, 'mctpvCd']}
            className={styles.formItemCompact}
            rules={isRequired ? [{ required: true, message: 'E01: Province / City is required' }] : []}
          >
            <AppSelect
              showSearch
              allowClear
              disabled={disabled}
              loading={loadingProv}
              placeholder="Select Province / City"
              optionFilterProp="label"
              onChange={() => form.setFieldValue([prefix, 'distCd'], undefined)}
              options={provinces.map((p) => ({
                value: p.mctpvCd,
                label: p.mctpvNm || p.mctpvCd,
              }))}
            />
          </Form.Item>
        </td>
        <td className={styles.labelCell}>
          District{isRequired && <span className={styles.requiredMark}>*</span>}
        </td>
        <td className={styles.valueCell}>
          <Form.Item
            name={[prefix, 'distCd']}
            className={styles.formItemCompact}
            rules={isRequired ? [{ required: true, message: 'E01: District is required' }] : []}
          >
            <AppSelect
              showSearch
              allowClear
              disabled={disabled || !provinceCode}
              loading={loadingDist}
              placeholder="Select District"
              optionFilterProp="label"
              options={districts.map((d) => ({
                value: d.distCd,
                label: d.distNm || d.distCd,
              }))}
            />
          </Form.Item>
        </td>
      </tr>
      <tr>
        <td className={styles.labelCell}>
          Detailed Address{isRequired && <span className={styles.requiredMark}>*</span>}
        </td>
        <td className={styles.valueCell} colSpan={3}>
          <Form.Item
            name={[prefix, 'daddr']}
            className={styles.formItemCompact}
            rules={isRequired ? [{ required: true, message: 'E01: Detailed Address is required' }] : []}
          >
            <TextInput
              disabled={disabled}
              placeholder="Ward, street name, house number"
            />
          </Form.Item>
        </td>
      </tr>
    </>
  );
}

interface AttachmentFieldRowProps {
  files: UploadedFileItem[];
  guideText?: string;
  required?: boolean;
  disabled?: boolean;
  uploading?: boolean;
  onUpload: (file: File) => void;
  onRemove: (idx: number) => void;
  onOpen: (url: string) => void;
}

function AttachmentFieldRow({
  files,
  guideText,
  required = false,
  disabled = false,
  uploading = false,
  onUpload,
  onRemove,
  onOpen,
}: AttachmentFieldRowProps) {
  return (
    <tr>
      <td className={styles.labelCell}>
        Attachments ({files.length}){required && <span className={styles.requiredMark}>*</span>}
      </td>
      <td className={styles.valueCell} colSpan={5}>
        <div className={styles.uploadRow}>
          {!disabled && (
            <Upload
              showUploadList={false}
              accept=".jpg,.jpeg,.png,.pdf"
              beforeUpload={(file) => {
                onUpload(file);
                return false;
              }}
            >
              <ActionButton size="small" icon={<UploadOutlined />} loading={uploading}>
                Upload File
              </ActionButton>
            </Upload>
          )}
          {guideText && <span className={styles.uploadGuide}>{guideText}</span>}
        </div>
        <div className={`${styles.attachmentsList} ${files.length > 0 ? 'mt-1.5!' : 'mt-1!'}`}>
          {files.length > 0 ? (
            files.map((f, idx) => (
              <div key={`${f.fileUnqId}-${idx}`} className={styles.inlineGroup}>
                <a
                  href={f.url || '#'}
                  className={styles.attachmentItem}
                  onClick={(e) => {
                    e.preventDefault();
                    if (f.url) onOpen(f.url);
                  }}
                >
                  <PaperClipOutlined />
                  <span>{f.fileNm}</span>
                </a>
                {!disabled && (
                  <DeleteOutlined
                    className="text-red-500! cursor-pointer text-[12px]!"
                    onClick={() => onRemove(idx)}
                  />
                )}
              </div>
            ))
          ) : (
            <span className={styles.uploadGuide}>No files attached.</span>
          )}
        </div>
      </td>
    </tr>
  );
}

/** Stable empty list while the officer candidates load. */
const NO_OFFICERS: never[] = [];

/** "Name (EMP0000001)"; empty when no officer is assigned. */
function formatOfficer(name?: string, empNo?: string) {
  if (!empNo) return '';
  return name ? `${name} (${empNo})` : empNo;
}

function buildInitialFormState(
  isEdit: boolean,
  apiDetail: MemberDetailResponse | null | undefined,
  member: MemberItem | null,
) {
  if (!isEdit || !apiDetail || !member) {
    return {
      initialValues: {
        memberType: 'General',
        memberGrade: 'Temporary',
        status: 'Pending Approval',
        termsAgreementDate: dayjs(),
        phoneCountry: '+84',
        idCardType: 'CCCD',
        nationality: 'VNM',
        foreignerAddressType: 'VN',
        legalDocType: 'B',
        legalRepIdType: 'CCCD',
        agentIdType: 'CCCD',
        selfApplyYn: 'N',
      },
      idFiles: [] as UploadedFileItem[],
      corpFiles: [] as UploadedFileItem[],
      agentFiles: [] as UploadedFileItem[],
      poaFiles: [] as UploadedFileItem[],
    };
  }

  const typeCd = (apiDetail.basic?.mbrTypeCd || apiDetail.mbrTypeCd || '').toUpperCase();
  const mappedType: MemberType =
    typeCd === 'O' ? 'Organization' : typeCd === 'F' ? 'Foreigner' : 'General';
  const grdCd = (apiDetail.basic?.mbrGrdCd || '').toUpperCase();
  const mappedGrade: MemberGrade =
    grdCd === 'F' ? 'Full' : grdCd === 'G' ? 'General' : 'Temporary';
  const mappedStatus: MemberStatus =
    apiDetail.basic?.acntSttsCd === 'LOCKED' || apiDetail.acntSttsCd === 'LOCKED'
      ? 'Locked'
      : member.status || 'Active';

  const idTypeCode = apiDetail.identity?.uiiSeCd || (mappedType === 'Foreigner' ? 'PSPT' : 'CCCD');
  const isOverseas =
    mappedType === 'Foreigner' &&
    !apiDetail.currentAddress?.mctpvCd &&
    Boolean(apiDetail.permanentAddress?.daddr);


  return {
    initialValues: {
      sgdnMbrCd: apiDetail.basic?.sgdnMbrCd || member.sgdnMemberCode || '',
      memberType: mappedType,
      memberGrade: mappedGrade,
      status: mappedStatus,
      termsAgreementDate: parseDateValue(apiDetail.basic?.aplyDt || member.applicationDate) || dayjs(),
      staffInCharge: apiDetail.basic?.officerEmpNo || undefined,
      rejectionReason: apiDetail.basic?.splmntRqstCn || '',
      phoneCountry: apiDetail.account?.intlTelnoNtnNo || '+84',
      phone: (apiDetail.account?.rawTelno || apiDetail.account?.telno || '').replace(/\D/g, ''),
      email: apiDetail.account?.rawEmlAddr || apiDetail.account?.emlAddr || '',
      idCardType: idTypeCode,
      fullName: apiDetail.identity?.fullNm || member.memberName || '',
      dateOfBirth: parseDateValue(apiDetail.identity?.brdt),
      gender: apiDetail.identity?.gndrCd || 'M',
      nationality: mappedType === 'General' ? 'VNM' : apiDetail.identity?.ntnCd || '',
      idNumber: apiDetail.identity?.rawUiiNo || apiDetail.identity?.uiiNo || '',
      issuingAuthority: apiDetail.identity?.uiiIssuInstNm || '',
      issueDate: parseDateValue(apiDetail.identity?.uiiIssuDt),
      expiryDate: parseDateValue(apiDetail.identity?.uiiExpryDt),
      foreignerAddressType: isOverseas ? 'OVERSEAS' : 'VN',
      overseasAddress: isOverseas ? apiDetail.permanentAddress?.daddr || '' : '',
      resAddr: apiDetail.currentAddress || {},
      origAddr: apiDetail.permanentAddress || {},
      companyName: apiDetail.corporate?.orgnzNm || member.companyName || '',
      charterCapital: formatCapitalVnd(apiDetail.corporate?.chrtrCptlAmt),
      legalDocType: apiDetail.corporate?.lglDcmntSeCd || 'B',
      mstNo: apiDetail.corporate?.rawMstNo || apiDetail.corporate?.mstNo || '',
      projectCode: apiDetail.corporate?.orgnzBrno || '',
      corpIssuingAuthority: apiDetail.corporate?.issuInstNm || '',
      corpIssueDate: parseDateValue(apiDetail.corporate?.issuDt),
      corpEffectiveDate: parseDateValue(apiDetail.corporate?.efctDt),
      corpAddr: apiDetail.corporate?.headOfficeAddress || {},
      legalRepName: apiDetail.legalRepresentative?.fullNm || '',
      legalRepPosition: apiDetail.legalRepresentative?.jbpsNm || '',
      legalRepIdType: apiDetail.legalRepresentative?.uiiSeCd || 'CCCD',
      legalRepIdNumber:
        apiDetail.legalRepresentative?.rawUiiNo || apiDetail.legalRepresentative?.uiiNo || '',
      legalRepIssuingAuthority: apiDetail.legalRepresentative?.issuInstNm || '',
      legalRepIssueDate: parseDateValue(apiDetail.legalRepresentative?.issuDt),
      legalRepExpiryDate: parseDateValue(apiDetail.legalRepresentative?.expryDt),
      legalRepAddr: apiDetail.legalRepresentative?.address || {},
      selfApplyYn: apiDetail.selfApplyYn === 'Y' ? 'Y' : 'N',
      agentName: apiDetail.authorizedAgent?.fullNm || '',
      agentIdType: apiDetail.authorizedAgent?.uiiSeCd || 'CCCD',
      agentIdNumber: apiDetail.authorizedAgent?.rawUiiNo || apiDetail.authorizedAgent?.uiiNo || '',
      agentIssuingAuthority: apiDetail.authorizedAgent?.issuInstNm || '',
      agentIssueDate: parseDateValue(apiDetail.authorizedAgent?.issuDt),
      agentExpiryDate: parseDateValue(apiDetail.authorizedAgent?.expryDt),
      agentAddr: apiDetail.authorizedAgent?.address || {},
    },
    idFiles: mapAttachmentList(
      apiDetail.identity?.files ||
        apiDetail.files?.filter((f) =>
          ['ID_CARD_FRONT', 'ID_CARD_BACK', 'PASSPORT'].includes((f.docType || '').toUpperCase()),
        ),
    ),
    corpFiles: mapAttachmentList(apiDetail.corporate?.files),
    agentFiles: mapAttachmentList(apiDetail.authorizedAgent?.files),
    poaFiles: mapAttachmentList(
      apiDetail.files?.filter((f) => (f.docType || '').toUpperCase() === 'POWER_OF_ATTORNEY'),
    ),
  };
}

export default function NewMemberModal({
  visible,
  mode = 'register',
  member = null,
  onClose,
  onSuccess,
}: MemberFormModalProps) {
  const isEdit = mode === 'edit' && Boolean(member);
  // Edit loads the decrypted values: saving masked phone / ID numbers back would corrupt them
  const { data: apiDetail, isLoading: isLoadingDetail } = useMemberDetail(
    member?.memberCode,
    visible && isEdit,
    true,
  );

  if (!visible) return null;

  return (
    <MemberFormModalContent
      key={`${mode}-${member?.memberCode ?? 'new'}-${apiDetail?.mbrNo ?? 'init'}`}
      visible={visible}
      isEdit={isEdit}
      member={member}
      apiDetail={apiDetail}
      isLoadingDetail={isLoadingDetail}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function MemberFormModalContent({
  visible,
  isEdit,
  member,
  apiDetail,
  isLoadingDetail,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  isEdit: boolean;
  member: MemberItem | null;
  apiDetail: MemberDetailResponse | null | undefined;
  isLoadingDetail: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { toast, dialog } = useNotify();
  const [form] = Form.useForm();
  const initial = buildInitialFormState(isEdit, apiDetail, member);

  const { mutateAsync: createMemberMutate, isPending: isCreating } = useCreateMember();
  const { mutateAsync: updateMemberMutate, isPending: isUpdating } = useUpdateMember();
  const { mutateAsync: uploadDocumentMutate, isPending: isUploading } = useUploadMemberDocument();
  const { mutate: removeDocumentMutate } = useRemoveMemberDocument();
  const { mutate: openAttachmentMutate } = useOpenAttachment();
  // Upload session of this popup (one per member type); its id goes with create / update
  const documentSession = useRef<{ id: string; type: MemberDocumentType } | null>(null);

  // Form watches
  const memberType = (Form.useWatch('memberType', form) as MemberType | undefined) || 'General';
  const memberGrade = (Form.useWatch('memberGrade', form) as MemberGrade | undefined) || 'Temporary';
  const statusVal = (Form.useWatch('status', form) as MemberStatus | undefined) || 'Pending Approval';
  const idCardType = (Form.useWatch('idCardType', form) as string | undefined) || 'CCCD';
  const legalDocType = (Form.useWatch('legalDocType', form) as string | undefined) || 'B';
  const legalRepIdType = (Form.useWatch('legalRepIdType', form) as string | undefined) || 'CCCD';
  const agentIdType = (Form.useWatch('agentIdType', form) as string | undefined) || 'CCCD';
  const phoneInput = (Form.useWatch('phone', form) as string | undefined) || '';
  const phoneCountry = (Form.useWatch('phoneCountry', form) as string | undefined) || '+84';
  const sameAsResidence = Boolean(Form.useWatch('sameAsResidence', form));
  const foreignerAddressType =
    (Form.useWatch('foreignerAddressType', form) as 'VN' | 'OVERSEAS' | undefined) || 'VN';
  const selfApplyYn = (Form.useWatch('selfApplyYn', form) as 'Y' | 'N' | undefined) || 'N';

  // Attachments per section
  const [idFiles, setIdFiles] = useState<UploadedFileItem[]>(initial.idFiles);
  const [corpFiles, setCorpFiles] = useState<UploadedFileItem[]>(initial.corpFiles);
  const [agentFiles, setAgentFiles] = useState<UploadedFileItem[]>(initial.agentFiles);
  const [poaFiles, setPoaFiles] = useState<UploadedFileItem[]>(initial.poaFiles);

  // Staff in Charge (2026-11-23): chosen here among the sign-up officer candidates, changeable later. With the
  // member's session the server lists the roles snapshotted for it, the same roles it checks on save.
  const currentOfficerEmpNo = apiDetail?.basic?.officerEmpNo || undefined;
  const { data: officerCandidates = NO_OFFICERS, isFetching: isLoadingOfficers } = useMemberApprovalCandidates(
    visible ? MEMBER_JOIN_OFFICER_STEP : null,
    apiDetail?.basic?.atrzHstryId ?? null,
  );
  const officerOptions = officerCandidates.map((c) => ({
    value: c.empNo,
    label: formatOfficer(c.jbpsNm ? `${c.empNm} · ${c.jbpsNm}` : c.empNm, c.empNo),
  }));
  // The current officer stays visible even when no longer among the candidates
  if (currentOfficerEmpNo && !officerOptions.some((o) => o.value === currentOfficerEmpNo)) {
    officerOptions.unshift({
      value: currentOfficerEmpNo,
      label: formatOfficer(apiDetail?.basic?.officerNm, currentOfficerEmpNo),
    });
  }
  const assignOfficer = useAssignMemberOfficer();

  // Membership fee: history from the server (one derived row while it keeps none); Register Payment saves at once
  const feeMbrNo = isEdit && member ? member.memberCode : null;
  const { data: feePayments } = useMemberFeePayments(feeMbrNo);
  const paymentHistory = buildFeeHistoryRows(feePayments, apiDetail?.basic);
  const registerPayment = useRegisterMembershipPayment(feeMbrNo);
  const [payType, setPayType] = useState<'Paid' | 'Exempt'>('Paid');
  const [payStartDate, setPayStartDate] = useState<dayjs.Dayjs | null>(() =>
    nextPeriodStart(buildFeeHistoryRows(undefined, apiDetail?.basic)),
  );
  const [payDate, setPayDate] = useState<dayjs.Dayjs | null>(dayjs());

  const isLockedReadOnly = isEdit && statusVal === 'Locked';
  // Register Payment: active members, and Temporary members in Pending Approval / Supplement Requested (2026-11-23)
  const serverGrdCd = (apiDetail?.basic?.mbrGrdCd || '').toUpperCase();
  const serverSttsCd = (apiDetail?.basic?.mbrSttsCd || apiDetail?.mbrSttsCd || '').toUpperCase();
  const isTemporaryApplicant = serverGrdCd === 'T' && (serverSttsCd === 'P' || serverSttsCd === 'U');
  const canRegisterPayment = isEdit && !isLockedReadOnly && (serverSttsCd === 'S' || isTemporaryApplicant);
  // Effective / reissue date: editable only once the backend stores it (schema/44); otherwise it would be dropped
  const canEditEffectiveDate = isEdit && apiDetail?.corporate?.efctDtEnabled === true;
  const isOrganization = memberType === 'Organization';
  const isForeigner = memberType === 'Foreigner';

  // Sync Place of Origin when Same as Place of Residence is checked
  const resAddrWatch = Form.useWatch('resAddr', form);
  useEffect(() => {
    if (sameAsResidence && resAddrWatch) {
      form.setFieldValue('origAddr', { ...resAddrWatch });
    }
  }, [sameAsResidence, resAddrWatch, form]);

  const sectionFiles: Record<DocumentSection, [UploadedFileItem[], React.Dispatch<React.SetStateAction<UploadedFileItem[]>>]> = {
    id: [idFiles, setIdFiles],
    corp: [corpFiles, setCorpFiles],
    agent: [agentFiles, setAgentFiles],
    poa: [poaFiles, setPoaFiles],
  };

  const currentTypeCd = (): MemberDocumentType => (isOrganization ? 'O' : isForeigner ? 'F' : 'P');

  /** Drops the upload session (member type changed, popup closed without saving). */
  const cancelDocumentSession = () => {
    const session = documentSession.current;
    documentSession.current = null;
    if (session) removeDocumentMutate({ sessionId: session.id });
  };

  /** Closing without saving leaves no upload session behind. */
  const handleClose = () => {
    cancelDocumentSession();
    onClose();
  };

  const handleOpenAttachment = (url: string) => {
    openAttachmentMutate(url, { onError: () => toast.error('Failed to open the file.') });
  };

  const handleRemoveFile = (section: DocumentSection, idx: number) => {
    const [files, setter] = sectionFiles[section];
    const target = files[idx];
    const session = documentSession.current;
    if (target?.slot && session) removeDocumentMutate({ sessionId: session.id, fileId: target.fileUnqId });
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  const validateAndUpload = async (file: File, section: DocumentSection, isOcrTrigger = false) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext) || file.size > MAX_FILE_BYTES) {
      toast.error('E04: Only JPG, PNG, or PDF files up to 10MB are allowed.');
      return;
    }

    const [files, setter] = sectionFiles[section];
    const passport = section === 'id' ? isForeigner || idCardType === 'PSPT' : agentIdType === 'PSPT';
    // Stored files of an edited member are replaced by the first new upload, so only new files count
    const slot = nextDocumentSlot(section, files.filter((f) => f.slot), passport);
    if (!slot) {
      toast.error('E04: This section already has all its files. Remove one before uploading another.');
      return;
    }

    const doUpload = async () => {
      try {
        const typeCd = currentTypeCd();
        if (documentSession.current && documentSession.current.type !== typeCd) cancelDocumentSession();
        const { regSessionId, uploaded } = await uploadDocumentMutate({
          sessionId: documentSession.current?.id,
          mbrTypeCd: typeCd,
          slot,
          file,
        });
        documentSession.current = { id: regSessionId, type: typeCd };
        setter((prev) => [
          ...prev.filter((f) => f.slot && f.fileUnqId !== uploaded.replacedFileId),
          { fileUnqId: uploaded.fileId, fileNm: file.name, slot },
        ]);
        if (isOcrTrigger) {
          toast.info('E05: AI OCR auto-fill is unavailable. Please enter or verify fields manually.');
        }
      } catch {
        toast.error('Failed to upload file.');
      }
    };

    if (isEdit && files.some((f) => !f.slot)) {
      dialog.confirm({
        title: 'Attach Document (C02)',
        content: 'The new document replaces the documents currently stored for this section. Continue?',
        onOk: doUpload,
      });
    } else {
      await doUpload();
    }
  };

  const handleMemberTypeChange = (nextType: MemberType) => {
    const prevType = form.getFieldValue('memberType');
    if (prevType === nextType) return;
    dialog.confirm({
      title: 'Change Member Type (C03)',
      content: 'Changing Member Type will reset identity information and attachments. Continue?',
      onOk: () => {
        form.setFieldsValue({
          memberType: nextType,
          idCardType: nextType === 'Foreigner' ? 'PSPT' : 'CCCD',
          nationality: nextType === 'General' ? 'VNM' : '',
          fullName: undefined,
          dateOfBirth: null,
          idNumber: undefined,
          issuingAuthority: undefined,
          issueDate: null,
          expiryDate: null,
          resAddr: {},
          origAddr: {},
        });
        setIdFiles([]);
        setCorpFiles([]);
        setAgentFiles([]);
        setPoaFiles([]);
        cancelDocumentSession();
      },
    });
  };

  const handleIdCardTypeChange = (nextIdType: string) => {
    dialog.confirm({
      title: 'Change ID Card Type (C03)',
      content: 'Changing ID Card Type will reset ID card information and attachments. Continue?',
      onOk: () => {
        form.setFieldsValue({
          idCardType: nextIdType,
          idNumber: undefined,
          issuingAuthority: undefined,
          issueDate: null,
          expiryDate: null,
        });
        setIdFiles([]);
      },
    });
  };

  const handleSelfApplyChange = (val: 'Y' | 'N') => {
    form.setFieldValue('selfApplyYn', val);
    if (val === 'Y') {
      form.setFieldsValue({
        agentName: form.getFieldValue('legalRepName'),
        agentIdType: form.getFieldValue('legalRepIdType'),
        agentIdNumber: form.getFieldValue('legalRepIdNumber'),
        agentIssuingAuthority: form.getFieldValue('legalRepIssuingAuthority'),
        agentIssueDate: form.getFieldValue('legalRepIssueDate'),
        agentExpiryDate: form.getFieldValue('legalRepExpiryDate'),
        agentAddr: { ...(form.getFieldValue('legalRepAddr') || {}) },
      });
    }
  };

  const handleRegisterPayment = async () => {
    if (!feeMbrNo) return;
    if (!payStartDate) {
      toast.error('E01: Please select Membership Period start date.');
      return;
    }
    if (payType === 'Paid' && !payDate) {
      toast.error('E01: Please select Payment Date.');
      return;
    }
    const endD = payStartDate.add(1, 'year').subtract(1, 'day');
    const overlaps = paymentHistory.some((row) => {
      const rStart = dayjs(row.startDate, 'DD-MM-YYYY', true);
      const rEnd = dayjs(row.endDate, 'DD-MM-YYYY', true);
      if (!rStart.isValid() || !rEnd.isValid()) return false;
      return !endD.isBefore(rStart, 'day') && !payStartDate.isAfter(rEnd, 'day');
    });
    if (overlaps) {
      toast.error(E06_PERIOD_OVERLAP);
      return;
    }
    try {
      await registerPayment.mutateAsync({
        payType: payType === 'Exempt' ? 'EXEMPT' : 'PAID',
        periodStartDate: payStartDate.format('YYYY-MM-DD'),
        paymentDate: payType === 'Exempt' ? undefined : payDate!.format('YYYY-MM-DD'),
      });
      if (isTemporaryApplicant) {
        // A Temporary member stays T and becomes Full once its documents pass
        toast.success('Membership payment registered. The member becomes a Full Member once the documents pass.');
      } else {
        toast.success('Membership payment registered.');
        form.setFieldValue('memberGrade', 'Full');
      }
      setPayStartDate(endD.add(1, 'day'));
      setPayDate(dayjs());
    } catch (err) {
      // The server checks the overlap too (MBR016), e.g. when the history was changed in another tab
      toast.error(apiErrorCode(err) === MEMBER_FEE_ERRORS.periodOverlap ? E06_PERIOD_OVERLAP : errorMessage(err));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isOrganization && poaFiles.length === 0) {
        toast.error('E01: Power of Attorney attachment is required.');
        return;
      }

      const typeCd =
        values.memberType === 'Organization' ? 'O' : values.memberType === 'Foreigner' ? 'F' : 'P';

      if (!isEdit) {
        const payload: CreateMemberRequest = {
          mbrTypeCd: typeCd,
          regSessionId: documentSession.current?.id,
          lgnId: values.phone,
          intlTelnoNtnNo: values.phoneCountry || '+84',
          mbrTelno: values.phone,
          mbrEmlAddr: values.email,
          mbrNm: isOrganization ? values.companyName : values.fullName,
          contact: { phoneNumber: values.phone, email: values.email },
          account: { loginId: values.phone },
          ...(isOrganization
            ? {
                mstNo: values.mstNo,
                orgnzBrno: values.projectCode,
                mctpvCd: values.corpAddr?.mctpvCd,
                distCd: values.corpAddr?.distCd,
                mbrDaddr1: values.corpAddr?.daddr,
                organization: {
                  organizationName: values.companyName,
                  registeredCapital: parseCapitalNumber(values.charterCapital),
                  capitalCurrency: 'VND',
                  businessAddress: {
                    provinceCode: values.corpAddr?.mctpvCd,
                    wardCode: values.corpAddr?.distCd,
                    addressLine: values.corpAddr?.daddr,
                  },
                  registrationDocument: {
                    documentType: values.legalDocType,
                    taxNumber: values.mstNo,
                    registrationNumber: values.projectCode,
                    registrationPlace: values.corpIssuingAuthority,
                    issueDate: values.corpIssueDate?.format('YYYY-MM-DD'),
                    attachments: toDocumentAttachments(corpFiles),
                  },
                  authorizationDocument: { attachments: toDocumentAttachments(poaFiles) },
                  legalRepresentative: {
                    fullName: values.legalRepName,
                    position: values.legalRepPosition,
                    identityDocument: {
                      documentType: values.legalRepIdType,
                      documentNumber: values.legalRepIdNumber,
                      issuePlace: values.legalRepIssuingAuthority,
                      issueDate: values.legalRepIssueDate?.format('YYYY-MM-DD'),
                      expiryDate: values.legalRepExpiryDate?.format('YYYY-MM-DD'),
                    },
                    address: {
                      provinceCode: values.legalRepAddr?.mctpvCd,
                      wardCode: values.legalRepAddr?.distCd,
                      addressLine: values.legalRepAddr?.daddr,
                    },
                  },
                  representativeMode: values.selfApplyYn === 'Y' ? 'LEGAL_REP' : 'AUTHORIZED',
                  authorizedRepresentative: {
                    fullName: values.agentName,
                    identityDocument: {
                      documentType: values.agentIdType,
                      documentNumber: values.agentIdNumber,
                      issuePlace: values.agentIssuingAuthority,
                      issueDate: values.agentIssueDate?.format('YYYY-MM-DD'),
                      expiryDate: values.agentExpiryDate?.format('YYYY-MM-DD'),
                      attachments: toDocumentAttachments(agentFiles),
                    },
                  },
                },
              }
            : {
                ntnCd: isForeigner ? values.nationality : 'VNM',
                uiiSeCd: values.idCardType,
                cccdNo: values.idCardType === 'CCCD' ? values.idNumber : undefined,
                ppNo: values.idCardType === 'PSPT' ? values.idNumber : undefined,
                brdt: values.dateOfBirth?.format('DDMMYYYY'),
                mctpvCd: values.resAddr?.mctpvCd || values.origAddr?.mctpvCd,
                distCd: values.resAddr?.distCd || values.origAddr?.distCd,
                mbrDaddr1:
                  foreignerAddressType === 'OVERSEAS'
                    ? values.overseasAddress
                    : values.resAddr?.daddr || values.origAddr?.daddr,
                individual: {
                  fullName: values.fullName,
                  dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
                  gender: values.gender,
                  nationalityCode: isForeigner ? values.nationality : 'VNM',
                  identityDocument: {
                    documentType: values.idCardType,
                    documentNumber: values.idNumber,
                    issuePlace: values.issuingAuthority,
                    issueDate: values.issueDate?.format('YYYY-MM-DD'),
                    expiryDate: values.expiryDate?.format('YYYY-MM-DD'),
                    attachments: toDocumentAttachments(idFiles),
                  },
                },
              }),
        };
        const created = await createMemberMutate(payload);
        documentSession.current = null;
        toast.success(`Member ${values.fullName || values.companyName} registered successfully.`);
        // Not received yet: the server receives the application and hands it to the officer at once
        if (created?.mbrNo && values.staffInCharge) await saveOfficer(created.mbrNo, values.staffInCharge);
      } else if (member) {
        // Files uploaded in this popup replace the stored document; they are sent with the session.
        // `regSessionId` is not in the generated types yet (regenerate with `pnpm api:generate`).
        const hasNewFiles = [idFiles, corpFiles, agentFiles, poaFiles].some((list) => list.some((f) => f.slot));
        const storedId = (list: UploadedFileItem[], idx = 0) => (list[idx]?.slot ? undefined : list[idx]?.fileUnqId);
        const payload: UpdateMemberRequest & { regSessionId?: string } = {
          regSessionId: hasNewFiles ? documentSession.current?.id : undefined,
          mbrNm: isOrganization ? values.companyName : values.fullName,
          intlTelnoNtnNo: values.phoneCountry || '+84',
          mbrTelno: values.phone,
          mbrEmlAddr: values.email,
          ...(isOrganization
            ? {
                orgnzNm: values.companyName,
                rgstCptl: parseCapitalNumber(values.charterCapital),
                chrtrCptlCrncCd: 'VND',
                lglDcmntSeCd: values.legalDocType,
                mstNo: values.mstNo,
                orgnzBrno: values.projectCode,
                lglDcmntIssuInstNm: values.corpIssuingAuthority,
                lglDcmntIssuDmy: values.corpIssueDate?.format('DDMMYYYY'),
                // Empty string clears the stored date; sent only where the column exists (schema/44)
                ...(canEditEffectiveDate
                  ? { lglDcmntEfctDmy: values.corpEffectiveDate?.format('DDMMYYYY') ?? '' }
                  : {}),
                mctpvCd: values.corpAddr?.mctpvCd,
                distCd: values.corpAddr?.distCd,
                mbrDaddr1: values.corpAddr?.daddr,
                rprsvNm: values.legalRepName,
                rprsvJbpsNm: values.legalRepPosition,
                rprsvUiiSeCd: values.legalRepIdType,
                rprsvUiiNo: values.legalRepIdNumber,
                rprsvUiiIssuInstNm: values.legalRepIssuingAuthority,
                rprsvUiiIssuDmy: values.legalRepIssueDate?.format('DDMMYYYY'),
                rprsvUiiExprDmy: values.legalRepExpiryDate?.format('DDMMYYYY'),
                rprsvMctpvCd: values.legalRepAddr?.mctpvCd,
                rprsvDistCd: values.legalRepAddr?.distCd,
                rprsvDaddr: values.legalRepAddr?.daddr,
                mndtrNm: values.agentName,
                dlgtUiiSeCd: values.agentIdType,
                dlgtUiiNo: values.agentIdNumber,
                dlgtUiiIssuInstNm: values.agentIssuingAuthority,
                dlgtUiiIssuDmy: values.agentIssueDate?.format('DDMMYYYY'),
                dlgtMctpvCd: values.agentAddr?.mctpvCd,
                dlgtDistCd: values.agentAddr?.distCd,
                dlgtDaddr: values.agentAddr?.daddr,
                evdncAtchFile: storedId(corpFiles),
                dlgtEvdncAtchFile: storedId(agentFiles),
                dlgtAtchFileId: storedId(poaFiles),
                ...(hasNewFiles
                  ? {
                      organization: {
                        registrationDocument: { attachments: toDocumentAttachments(corpFiles) },
                        authorizationDocument: { attachments: toDocumentAttachments(poaFiles) },
                        representativeMode: values.selfApplyYn === 'Y' ? 'LEGAL_REP' : 'AUTHORIZED',
                        authorizedRepresentative: {
                          fullName: values.agentName,
                          identityDocument: {
                            documentType: values.agentIdType,
                            attachments: toDocumentAttachments(agentFiles),
                          },
                        },
                      },
                    }
                  : {}),
              }
            : {
                brdt: values.dateOfBirth?.format('DDMMYYYY'),
                gndrCd: values.gender,
                ntnCd: isForeigner ? values.nationality : 'VNM',
                uiiSeCd: values.idCardType,
                cccdNo: values.idCardType === 'CCCD' ? values.idNumber : undefined,
                cmndNo: values.idCardType === 'CMND' ? values.idNumber : undefined,
                ppNo: values.idCardType === 'PSPT' ? values.idNumber : undefined,
                uiiIssuInstNm: values.issuingAuthority,
                uiiIssuDmy: values.issueDate?.format('DDMMYYYY'),
                uiiExpryDmy: values.expiryDate?.format('DDMMYYYY'),
                mctpvCd: values.resAddr?.mctpvCd,
                distCd: values.resAddr?.distCd,
                mbrDaddr1:
                  foreignerAddressType === 'OVERSEAS'
                    ? values.overseasAddress
                    : values.resAddr?.daddr,
                prmntMctpvCd: values.origAddr?.mctpvCd,
                prmntDistCd: values.origAddr?.distCd,
                prmntDaddr: values.origAddr?.daddr,
                file1UnqId: storedId(idFiles, 0),
                file2UnqId: storedId(idFiles, 1),
                ...(hasNewFiles
                  ? {
                      individual: {
                        identityDocument: {
                          documentType: values.idCardType,
                          attachments: toDocumentAttachments(idFiles),
                        },
                      },
                    }
                  : {}),
              }),
        };
        await updateMemberMutate({ mbrNo: member.memberCode, body: payload });
        documentSession.current = null;
        toast.success('Member information updated.');
        // Changed only after the member update succeeded; the new officer gets an e-mail
        if (values.staffInCharge && values.staffInCharge !== currentOfficerEmpNo) {
          await saveOfficer(member.memberCode, values.staffInCharge);
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        const firstField = (err as { errorFields: { name: (string | number)[] }[] }).errorFields[0];
        if (firstField) form.scrollToField(firstField.name);
      } else {
        toast.error(errorMessage(err, 'Failed to save member information.'));
      }
    }
  };

  /** The member itself is saved already: a refused officer change is reported, not thrown. */
  const saveOfficer = async (mbrNo: string, assigneeEmpNo: string) => {
    try {
      await assignOfficer.mutateAsync({ mbrNo, assigneeEmpNo });
      toast.success('The Staff in Charge was changed.');
    } catch (err) {
      toast.error(`The Staff in Charge could not be changed: ${errorMessage(err)}`);
    }
  };

  const deadlineInfo = formatDeadline(member?.paymentDeadline || apiDetail?.basic?.mbrshpPayDueDt);
  // Payment deadline (decided 2026-11-23): sign-up / re-application + 15 days, applications in Pending Approval only
  const hasPaymentDeadline = serverGrdCd === 'T' && serverSttsCd === 'P' && deadlineInfo.text !== '-';
  const computedPayEndDate = payStartDate ? payStartDate.add(1, 'year').subtract(1, 'day').format('DD-MM-YYYY') : '-';

  return (
    <>
      <Popup
        open={visible}
        onCancel={handleClose}
        width={1200}
        title={isEdit ? "Edit Member" : "Register Member"}
        footer={null}
      >
        <div className={styles.modalContent}>
          <div className={styles.modalHeaderRow}>
            <h1 className={styles.modalTitle}>{isEdit ? 'Edit Member' : 'Register Member'}</h1>
          </div>

          <LoadingSpinner spinning={isEdit && isLoadingDetail}>
            <Form
              form={form}
              layout="vertical"
              initialValues={initial.initialValues}
              scrollToFirstError
              disabled={isLockedReadOnly}
            >
              <div className={styles.modalBodyScroll}>
                {/* AI OCR Auto-fill Banner */}
                {!isLockedReadOnly && (
                  <div className={styles.ocrBanner}>
                    <div className={styles.ocrTextGroup}>
                      <span className={styles.ocrTitle}>AI OCR Auto-fill</span>
                      <span className={styles.ocrGuide}>
                        Attach a document to review the recognized values and apply them to the form. (JPG, PNG, PDF up to 10MB)
                      </span>
                    </div>
                    <Upload
                      multiple
                      showUploadList={false}
                      accept=".jpg,.jpeg,.png,.pdf"
                      beforeUpload={(file) => {
                        validateAndUpload(file, isOrganization ? 'corp' : 'id', true);
                        return false;
                      }}
                    >
                      <ActionButton type="primary" icon={<UploadOutlined />} loading={isUploading}>
                        Attach Document
                      </ActionButton>
                    </Upload>
                  </div>
                )}

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
                          <td className={styles.valueCell}>
                            {isEdit ? member?.memberCode || '-' : 'Auto-assigned on registration'}
                          </td>
                          <td className={styles.labelCell}>SGDN Member Code</td>
                          <td className={styles.valueCell}>
                            <Form.Item name="sgdnMbrCd" className={styles.formItemCompact}>
                              <TextInput placeholder="Enter SGDN Member Code" />
                            </Form.Item>
                          </td>
                          <td className={styles.labelCell}>
                            Member Type<span className={styles.requiredMark}>*</span>
                          </td>
                          <td className={styles.valueCell}>
                            {isEdit ? (
                              <span>
                                {memberType === 'General'
                                  ? 'Individual'
                                  : memberType === 'Foreigner'
                                    ? 'Foreigner'
                                    : 'Organization'}
                              </span>
                            ) : (
                              <Form.Item
                                name="memberType"
                                className={styles.formItemCompact}
                                rules={[{ required: true, message: 'E01: Member Type is required' }]}
                              >
                                <AppSelect
                                  onChange={(val) => handleMemberTypeChange(val as MemberType)}
                                  options={[
                                    { label: 'Individual', value: 'General' },
                                    { label: 'Foreigner', value: 'Foreigner' },
                                    { label: 'Organization', value: 'Organization' },
                                  ]}
                                />
                              </Form.Item>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className={styles.labelCell}>
                            Member Grade<span className={styles.requiredMark}>*</span>
                          </td>
                          <td className={styles.valueCell}>
                            <Form.Item
                              name="memberGrade"
                              className={styles.formItemCompact}
                              rules={[{ required: true, message: 'E01: Member Grade is required' }]}
                            >
                              <AppSelect
                                options={[
                                  { label: 'Temporary Member', value: 'Temporary' },
                                  { label: 'General Member', value: 'General' },
                                  { label: 'Full Member', value: 'Full' },
                                ]}
                              />
                            </Form.Item>
                          </td>
                          <td className={styles.labelCell}>
                            Status<span className={styles.requiredMark}>*</span>
                          </td>
                          <td className={styles.valueCell}>
                            {isLockedReadOnly ? (
                              <span className={`${styles.statusLabel} ${styles.statusLocked}`}>Locked</span>
                            ) : (
                              <Form.Item
                                name="status"
                                className={styles.formItemCompact}
                                rules={[{ required: true, message: 'E01: Status is required' }]}
                                onReset={() => undefined}
                              >
                                <AppSelect
                                  onChange={(val) => {
                                    if (val !== 'Rejected') form.setFieldValue('rejectionReason', '');
                                  }}
                                  options={[
                                    { label: 'Pending Approval', value: 'Pending Approval' },
                                    { label: 'Rejected', value: 'Rejected' },
                                    { label: 'Active', value: 'Active' },
                                  ]}
                                />
                              </Form.Item>
                            )}
                          </td>
                          <td className={styles.labelCell}>Sign-up Channel</td>
                          <td className={styles.valueCell}>
                            {isEdit ? member?.signUpChannel || '-' : 'Offline'}
                          </td>
                        </tr>
                        <tr>
                          <td className={styles.labelCell}>Approval Date</td>
                          <td className={styles.valueCell}>
                            {memberGrade === 'Temporary'
                              ? '-'
                              : member?.approvalDate && member.approvalDate !== '-'
                                ? member.approvalDate
                                : 'Auto-assigned on save'}
                          </td>
                          <td className={styles.labelCell}>
                            Terms Agreement Date<span className={styles.requiredMark}>*</span>
                          </td>
                          <td className={styles.valueCell}>
                            <Form.Item
                              name="termsAgreementDate"
                              className={styles.formItemCompact}
                              rules={[{ required: true, message: 'E01: Terms Agreement Date is required' }]}
                            >
                              <AppDatePicker format="DD-MM-YYYY" className="w-full" />
                            </Form.Item>
                          </td>
                          <td className={styles.labelCell}>
                            Staff in Charge{!isEdit && <span className={styles.requiredMark}>*</span>}
                          </td>
                          <td className={styles.valueCell}>
                            {/* Saved through the assignee API after the member itself (officer gets an e-mail) */}
                            <Form.Item
                              name="staffInCharge"
                              className={styles.formItemCompact}
                              rules={isEdit ? [] : [{ required: true, message: 'E01: Staff in Charge is required' }]}
                            >
                              <AppSelect<string>
                                showSearch
                                optionFilterProp="label"
                                placeholder={isEdit ? 'Not assigned yet' : 'Select Staff in Charge'}
                                loading={isLoadingOfficers}
                                options={officerOptions}
                              />
                            </Form.Item>
                          </td>
                        </tr>
                        {statusVal === 'Rejected' && (
                          <tr>
                            <td className={styles.labelCell}>
                              Rejection Reason<span className={styles.requiredMark}>*</span>
                            </td>
                            <td className={styles.valueCell} colSpan={5}>
                              <Form.Item
                                name="rejectionReason"
                                className={styles.formItemCompact}
                                rules={[{ required: true, message: 'E01: Rejection Reason is required' }]}
                              >
                                <TextArea
                                  rows={2}
                                  maxLength={500}
                                  showCount
                                  placeholder="Enter rejection reason (up to 500 characters)"
                                />
                              </Form.Item>
                            </td>
                          </tr>
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

                  {isEdit && hasPaymentDeadline && (
                    <div className="mb-2 text-[13px]">
                      <strong>Payment Deadline: </strong>
                      <span className={deadlineInfo.isDanger ? styles.deadlineDanger : undefined}>
                        {deadlineInfo.text}
                      </span>
                    </div>
                  )}

                  {!isEdit && (
                    <div className={styles.emptyHistory}>Payments can be registered after the member is registered.</div>
                  )}
                  {isEdit && !isLockedReadOnly && !canRegisterPayment && (
                    <div className={styles.emptyHistory}>
                      Payments can be registered for active members and for Temporary members in Pending Approval.
                    </div>
                  )}
                  {canRegisterPayment && (
                    <>
                      <div className={styles.subSectionTitle}>Register Payment</div>
                      <div className={styles.paymentFormBox}>
                        <div>
                          <div className="text-[12px] text-gray-700 mb-1">Type</div>
                          <AppRadio.Group
                            value={payType}
                            onChange={(e) => setPayType(e.target.value)}
                            options={[
                              { label: 'Paid', value: 'Paid' },
                              { label: 'Exempt', value: 'Exempt' },
                            ]}
                          />
                        </div>
                        <div>
                          <div className="text-[12px] text-gray-700 mb-1">
                            Membership Period
                          </div>
                          <div className={styles.inlineGroup}>
                            <AppDatePicker
                              format="DD-MM-YYYY"
                              value={payStartDate}
                              onChange={setPayStartDate}
                            />
                            <span>~</span>
                            <span>{computedPayEndDate}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[12px] text-gray-700 mb-1">
                            Payment Date
                          </div>
                          <AppDatePicker
                            format="DD-MM-YYYY"
                            value={payType === 'Exempt' ? null : payDate}
                            disabled={payType === 'Exempt'}
                            onChange={setPayDate}
                            className="w-full"
                          />
                        </div>
                        <ActionButton
                          type="primary"
                          disabled={registerPayment.isPending}
                          onClick={() => void handleRegisterPayment()}
                        >
                          Register Payment
                        </ActionButton>
                      </div>
                    </>
                  )}

                  <div className={styles.subSectionTitle}>Payment History</div>
                  <div className={styles.tableContainer}>
                    {paymentHistory.length > 0 ? (
                      <table className={styles.historyTable}>
                        <thead>
                          <tr>
                            <th className="w-[60px]">No</th>
                            <th className="w-[140px]">Type</th>
                            <th>Membership Period</th>
                            <th className="w-[140px]">Payment Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistory.map((row) => (
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
                    <span className={styles.sectionBadge}>3</span>
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
                            {isEdit
                              ? apiDetail?.account?.lgnId || member?.loginId || '-'
                              : phoneInput
                                ? `${phoneCountry}${phoneInput}`
                                : 'Auto-set to Phone Number'}
                          </td>
                          <td className={styles.labelCell}>
                            Phone Number<span className={styles.requiredMark}>*</span>
                          </td>
                          <td className={styles.valueCell}>
                            <div className={`${styles.inlineGroup} w-full`}>
                              <Form.Item name="phoneCountry" className={styles.formItemCompact}>
                                <AppSelect
                                  className="w-[85px]!"
                                  options={[
                                    { label: '+84', value: '+84' },
                                    { label: '+82', value: '+82' },
                                    { label: '+1', value: '+1' },
                                  ]}
                                />
                              </Form.Item>
                              <Form.Item
                                name="phone"
                                className={`${styles.formItemCompact} flex-1`}
                                rules={[
                                  { required: true, message: 'E01: Phone Number is required' },
                                  { pattern: /^\d{8,15}$/, message: 'E02: Invalid phone number format' },
                                ]}
                              >
                                <TextInput
                                  placeholder="Digits only"
                                  onChange={(e) => {
                                    form.setFieldValue('phone', e.target.value.replace(/\D/g, ''));
                                  }}
                                />
                              </Form.Item>
                            </div>
                          </td>
                          <td className={styles.labelCell}>
                            Email Address<span className={styles.requiredMark}>*</span>
                          </td>
                          <td className={styles.valueCell}>
                            <Form.Item
                              name="email"
                              className={styles.formItemCompact}
                              rules={[
                                { required: true, message: 'E01: Email Address is required' },
                                { type: 'email', message: 'E02: Invalid email address format' },
                              ]}
                            >
                              <TextInput placeholder="example@domain.com" />
                            </Form.Item>
                          </td>
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
                        <span className={styles.sectionBadge}>4</span>
                        <span className={styles.sectionTitle}>ID Card Information</span>
                      </div>
                      <div className={styles.tableContainer}>
                        <table className={styles.detailTable}>
                          <tbody>
                            <tr>
                              <td className={styles.labelCell}>
                                ID Card Type<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell} colSpan={5}>
                                {isForeigner ? (
                                  <span>Passport</span>
                                ) : (
                                  <Form.Item name="idCardType" className={styles.formItemCompact}>
                                    <AppRadio.Group
                                      onChange={(e) => handleIdCardTypeChange(e.target.value)}
                                      options={[
                                        { label: 'CCCD', value: 'CCCD' },
                                        { label: 'CMND', value: 'CMND' },
                                        { label: 'Passport', value: 'PSPT' },
                                      ]}
                                    />
                                  </Form.Item>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className={styles.labelCell}>
                                Full Name<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="fullName"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Full Name is required' }]}
                                >
                                  <TextInput placeholder="Full Name" />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                Date of Birth<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="dateOfBirth"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Date of Birth is required' }]}
                                >
                                  <AppDatePicker format="DD-MM-YYYY" className="w-full" />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                Gender<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="gender"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Gender is required' }]}
                                >
                                  <AppRadio.Group
                                    options={[
                                      { label: 'Male', value: 'M' },
                                      { label: 'Female', value: 'F' },
                                    ]}
                                  />
                                </Form.Item>
                              </td>
                            </tr>
                            <tr>
                              <td className={styles.labelCell}>
                                Nationality<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                {isForeigner ? (
                                  <Form.Item
                                    name="nationality"
                                    className={styles.formItemCompact}
                                    rules={[{ required: true, message: 'E01: Nationality is required' }]}
                                  >
                                    <AppSelect
                                      showSearch
                                      placeholder="Select Nationality"
                                      options={[
                                        { label: 'Korea (KOR)', value: 'KOR' },
                                        { label: 'Japan (JPN)', value: 'JPN' },
                                        { label: 'Singapore (SGP)', value: 'SGP' },
                                        { label: 'United States (USA)', value: 'USA' },
                                        { label: 'China (CHN)', value: 'CHN' },
                                      ]}
                                    />
                                  </Form.Item>
                                ) : (
                                  <span>Vietnamese</span>
                                )}
                              </td>
                              <td className={styles.labelCell}>
                                ID Card Number<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="idNumber"
                                  className={styles.formItemCompact}
                                  rules={[
                                    { required: true, message: 'E01: ID Card Number is required' },
                                    {
                                      validator: (_, val) => {
                                        if (!val) return Promise.resolve();
                                        if (idCardType === 'CCCD' && !/^\d{12}$/.test(val)) {
                                          return Promise.reject('E02: CCCD must be 12 digits');
                                        }
                                        if (idCardType === 'CMND' && !/^(\d{9}|\d{12})$/.test(val)) {
                                          return Promise.reject('E02: CMND must be 9 or 12 digits');
                                        }
                                        if (idCardType === 'PSPT' && !/^[A-Za-z0-9]+$/.test(val)) {
                                          return Promise.reject('E02: Passport must be alphanumeric');
                                        }
                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <TextInput placeholder="Enter ID Card Number" />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                Issuing Authority<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="issuingAuthority"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Issuing Authority is required' }]}
                                >
                                  <TextInput placeholder="Issuing Authority" />
                                </Form.Item>
                              </td>
                            </tr>
                            <tr>
                              <td className={styles.labelCell}>
                                Issue Date<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell} colSpan={idCardType === 'CMND' ? 5 : 1}>
                                <Form.Item
                                  name="issueDate"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Issue Date is required' }]}
                                >
                                  <AppDatePicker format="DD-MM-YYYY" className="w-full" />
                                </Form.Item>
                              </td>
                              {idCardType !== 'CMND' && (
                                <>
                                  <td className={styles.labelCell}>
                                    Expiry Date<span className={styles.requiredMark}>*</span>
                                  </td>
                                  <td className={styles.valueCell} colSpan={3}>
                                    <Form.Item
                                      name="expiryDate"
                                      className={styles.formItemCompact}
                                      rules={[{ required: true, message: 'E01: Expiry Date is required' }]}
                                    >
                                      <AppDatePicker format="DD-MM-YYYY" className="w-full" />
                                    </Form.Item>
                                  </td>
                                </>
                              )}
                            </tr>
                            <AttachmentFieldRow
                              files={idFiles}
                              guideText={
                                idCardType === 'PSPT'
                                  ? 'Please upload the photo page of the passport.'
                                  : 'Please upload both the front and back of the ID card.'
                              }
                              disabled={isLockedReadOnly}
                              uploading={isUploading}
                              onUpload={(f) => validateAndUpload(f, 'id', true)}
                              onRemove={(idx) => handleRemoveFile('id', idx)}
                              onOpen={handleOpenAttachment}
                            />
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <span className={styles.sectionBadge}>5</span>
                        <span className={styles.sectionTitle}>Address Information</span>
                      </div>

                      {isForeigner ? (
                        <>
                          <div className="mb-2">
                            <Form.Item name="foreignerAddressType" className={styles.formItemCompact}>
                              <AppRadio.Group
                                onChange={() => {
                                  form.setFieldsValue({ resAddr: {}, overseasAddress: '' });
                                }}
                                options={[
                                  { label: 'Vietnam Address', value: 'VN' },
                                  { label: 'Overseas Address', value: 'OVERSEAS' },
                                ]}
                              />
                            </Form.Item>
                          </div>
                          {foreignerAddressType === 'VN' ? (
                            <>
                              <div className={styles.subSectionTitle}>Vietnam Address</div>
                              <div className={styles.tableContainer}>
                                <table className={styles.detailTable}>
                                  <tbody>
                                    <CascadedAddressRows
                                      form={form}
                                      prefix="resAddr"
                                      disabled={isLockedReadOnly}
                                    />
                                  </tbody>
                                </table>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className={styles.subSectionTitle}>Overseas Address</div>
                              <div className={styles.tableContainer}>
                                <table className={styles.detailTable}>
                                  <tbody>
                                    <tr>
                                      <td className={styles.labelCell}>
                                        Address<span className={styles.requiredMark}>*</span>
                                      </td>
                                      <td className={styles.valueCell}>
                                        <Form.Item
                                          name="overseasAddress"
                                          className={styles.formItemCompact}
                                          rules={[{ required: true, message: 'E01: Address is required' }]}
                                        >
                                          <TextInput placeholder="Full address (street, city, state, country)" />
                                        </Form.Item>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                        </>
                      ) : idCardType === 'PSPT' ? (
                        <>
                          <div className={styles.subSectionTitle}>Place of Origin</div>
                          <div className={styles.tableContainer}>
                            <table className={styles.detailTable}>
                              <tbody>
                                <CascadedAddressRows
                                  form={form}
                                  prefix="origAddr"
                                  disabled={isLockedReadOnly}
                                  optional
                                />
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={styles.subSectionTitle}>Place of Residence</div>
                          <div className={styles.tableContainer}>
                            <table className={styles.detailTable}>
                              <tbody>
                                <CascadedAddressRows
                                  form={form}
                                  prefix="resAddr"
                                  disabled={isLockedReadOnly}
                                />
                              </tbody>
                            </table>
                          </div>

                          <div className={styles.subHeaderRow}>
                            <div className={`${styles.subSectionTitle} m-0!`}>
                              Place of Origin
                            </div>
                            <Form.Item
                              name="sameAsResidence"
                              valuePropName="checked"
                              className={styles.formItemCompact}
                            >
                              <AppCheckbox>Same as Place of Residence</AppCheckbox>
                            </Form.Item>
                          </div>
                          <div className={styles.tableContainer}>
                            <table className={styles.detailTable}>
                              <tbody>
                                <CascadedAddressRows
                                  form={form}
                                  prefix="origAddr"
                                  disabled={isLockedReadOnly || sameAsResidence}
                                />
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  /* ── Organization Sections ─────────────────────────────────── */
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
                              <td className={styles.labelCell}>
                                Company Name<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="companyName"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Company Name is required' }]}
                                >
                                  <TextInput placeholder="Company Name" />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                Charter Capital (VND)<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="charterCapital"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Charter Capital is required' }]}
                                >
                                  <TextInput
                                    placeholder="e.g. 10.000.000.000"
                                    suffix="VND"
                                    onChange={(e) => {
                                      form.setFieldValue('charterCapital', formatCapitalVnd(e.target.value));
                                    }}
                                  />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                Legal Document Type<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item name="legalDocType" className={styles.formItemCompact}>
                                  <AppSelect
                                    options={[
                                      { label: 'Business Registration Certificate', value: 'B' },
                                      { label: 'Investment Registration Certificate', value: 'I' },
                                    ]}
                                  />
                                </Form.Item>
                              </td>
                            </tr>
                            <tr>
                              <td className={styles.labelCell}>
                                Enterprise Code (MST)<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="mstNo"
                                  className={styles.formItemCompact}
                                  rules={[
                                    { required: true, message: 'E01: Enterprise Code (MST) is required' },
                                    {
                                      pattern: /^(\d{10}|\d{10}-\d{3}|\d{13})$/,
                                      message: 'E02: MST must be 10 or 13 digits',
                                    },
                                  ]}
                                >
                                  <TextInput placeholder="10 or 13 digits" />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                Issuing Authority<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="corpIssuingAuthority"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Issuing Authority is required' }]}
                                >
                                  <TextInput placeholder="Issuing Authority" />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                Issue Date<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="corpIssueDate"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Issue Date is required' }]}
                                >
                                  <AppDatePicker format="DD-MM-YYYY" className="w-full" />
                                </Form.Item>
                              </td>
                            </tr>
                            {canEditEffectiveDate && (
                              <tr>
                                <td className={styles.labelCell}>Effective / Reissue Date</td>
                                <td className={styles.valueCell} colSpan={5}>
                                  <Form.Item name="corpEffectiveDate" className={styles.formItemCompact}>
                                    <AppDatePicker format="DD-MM-YYYY" className="w-full" />
                                  </Form.Item>
                                </td>
                              </tr>
                            )}
                            {legalDocType === 'I' && (
                              <tr>
                                <td className={styles.labelCell}>
                                  Project Code<span className={styles.requiredMark}>*</span>
                                </td>
                                <td className={styles.valueCell} colSpan={5}>
                                  <Form.Item
                                    name="projectCode"
                                    className={styles.formItemCompact}
                                    rules={[{ required: true, message: 'E01: Project Code is required' }]}
                                  >
                                    <TextInput placeholder="Enter Project Code" />
                                  </Form.Item>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className={styles.subSectionTitle}>Company Address</div>
                      <div className={styles.tableContainer}>
                        <table className={styles.detailTable}>
                          <tbody>
                            <CascadedAddressRows
                              form={form}
                              prefix="corpAddr"
                              disabled={isLockedReadOnly}
                            />
                            <AttachmentFieldRow
                              files={corpFiles}
                              disabled={isLockedReadOnly}
                              uploading={isUploading}
                              onUpload={(f) => validateAndUpload(f, 'corp', true)}
                              onRemove={(idx) => handleRemoveFile('corp', idx)}
                              onOpen={handleOpenAttachment}
                            />
                          </tbody>
                        </table>
                      </div>
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
                              <td className={styles.labelCell}>
                                Full Name<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="legalRepName"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Full Name is required' }]}
                                >
                                  <TextInput placeholder="Full Name" />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                Position<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell} colSpan={3}>
                                <Form.Item
                                  name="legalRepPosition"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Position is required' }]}
                                >
                                  <TextInput placeholder="Position" />
                                </Form.Item>
                              </td>
                            </tr>
                            <tr>
                              <td className={styles.labelCell}>
                                ID Card Type<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item name="legalRepIdType" className={styles.formItemCompact}>
                                  <AppSelect
                                    options={[
                                      { label: 'CCCD', value: 'CCCD' },
                                      { label: 'CMND', value: 'CMND' },
                                      { label: 'Passport', value: 'PSPT' },
                                    ]}
                                  />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                ID Card Number<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="legalRepIdNumber"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: ID Card Number is required' }]}
                                >
                                  <TextInput placeholder="ID Card Number" />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                Issuing Authority<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="legalRepIssuingAuthority"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Issuing Authority is required' }]}
                                >
                                  <TextInput placeholder="Issuing Authority" />
                                </Form.Item>
                              </td>
                            </tr>
                            <tr>
                              <td className={styles.labelCell}>
                                Issue Date<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell} colSpan={legalRepIdType === 'CMND' ? 5 : 1}>
                                <Form.Item
                                  name="legalRepIssueDate"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Issue Date is required' }]}
                                >
                                  <AppDatePicker format="DD-MM-YYYY" className="w-full" />
                                </Form.Item>
                              </td>
                              {legalRepIdType !== 'CMND' && (
                                <>
                                  <td className={styles.labelCell}>
                                    Expiry Date<span className={styles.requiredMark}>*</span>
                                  </td>
                                  <td className={styles.valueCell} colSpan={3}>
                                    <Form.Item
                                      name="legalRepExpiryDate"
                                      className={styles.formItemCompact}
                                      rules={[{ required: true, message: 'E01: Expiry Date is required' }]}
                                    >
                                      <AppDatePicker format="DD-MM-YYYY" className="w-full" />
                                    </Form.Item>
                                  </td>
                                </>
                              )}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className={styles.subSectionTitle}>Legal Representative Address</div>
                      <div className={styles.tableContainer}>
                        <table className={styles.detailTable}>
                          <tbody>
                            <CascadedAddressRows
                              form={form}
                              prefix="legalRepAddr"
                              disabled={isLockedReadOnly}
                            />
                          </tbody>
                        </table>
                      </div>
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
                              <td className={styles.valueCell}>
                                <Form.Item name="selfApplyYn" className={styles.formItemCompact}>
                                  <AppRadio.Group
                                    onChange={(e) => handleSelfApplyChange(e.target.value)}
                                    options={[
                                      { label: 'Y', value: 'Y' },
                                      { label: 'N', value: 'N' },
                                    ]}
                                  />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                Full Name<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell} colSpan={3}>
                                <Form.Item
                                  name="agentName"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Full Name is required' }]}
                                >
                                  <TextInput disabled={selfApplyYn === 'Y'} placeholder="Full Name" />
                                </Form.Item>
                              </td>
                            </tr>
                            <tr>
                              <td className={styles.labelCell}>
                                ID Card Type<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item name="agentIdType" className={styles.formItemCompact}>
                                  <AppSelect
                                    disabled={selfApplyYn === 'Y'}
                                    options={[
                                      { label: 'CCCD', value: 'CCCD' },
                                      { label: 'CMND', value: 'CMND' },
                                      { label: 'Passport', value: 'PSPT' },
                                    ]}
                                  />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                ID Card Number<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="agentIdNumber"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: ID Card Number is required' }]}
                                >
                                  <TextInput disabled={selfApplyYn === 'Y'} placeholder="ID Card Number" />
                                </Form.Item>
                              </td>
                              <td className={styles.labelCell}>
                                Issuing Authority<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell}>
                                <Form.Item
                                  name="agentIssuingAuthority"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Issuing Authority is required' }]}
                                >
                                  <TextInput disabled={selfApplyYn === 'Y'} placeholder="Issuing Authority" />
                                </Form.Item>
                              </td>
                            </tr>
                            <tr>
                              <td className={styles.labelCell}>
                                Issue Date<span className={styles.requiredMark}>*</span>
                              </td>
                              <td className={styles.valueCell} colSpan={agentIdType === 'CMND' ? 5 : 1}>
                                <Form.Item
                                  name="agentIssueDate"
                                  className={styles.formItemCompact}
                                  rules={[{ required: true, message: 'E01: Issue Date is required' }]}
                                >
                                  <AppDatePicker
                                    disabled={selfApplyYn === 'Y'}
                                    format="DD-MM-YYYY"
                                    className="w-full"
                                  />
                                </Form.Item>
                              </td>
                              {agentIdType !== 'CMND' && (
                                <>
                                  <td className={styles.labelCell}>
                                    Expiry Date<span className={styles.requiredMark}>*</span>
                                  </td>
                                  <td className={styles.valueCell} colSpan={3}>
                                    <Form.Item
                                      name="agentExpiryDate"
                                      className={styles.formItemCompact}
                                      rules={[{ required: true, message: 'E01: Expiry Date is required' }]}
                                    >
                                      <AppDatePicker
                                        disabled={selfApplyYn === 'Y'}
                                        format="DD-MM-YYYY"
                                        className="w-full"
                                      />
                                    </Form.Item>
                                  </td>
                                </>
                              )}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className={styles.subSectionTitle}>Contact Person Address</div>
                      <div className={styles.tableContainer}>
                        <table className={styles.detailTable}>
                          <tbody>
                            <CascadedAddressRows
                              form={form}
                              prefix="agentAddr"
                              disabled={isLockedReadOnly || selfApplyYn === 'Y'}
                            />
                            <AttachmentFieldRow
                              files={agentFiles}
                              disabled={isLockedReadOnly}
                              uploading={isUploading}
                              onUpload={(f) => validateAndUpload(f, 'agent')}
                              onRemove={(idx) => handleRemoveFile('agent', idx)}
                              onOpen={handleOpenAttachment}
                            />
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <span className={styles.sectionBadge}>7</span>
                        <span className={styles.sectionTitle}>Power of Attorney</span>
                      </div>
                      <div className={styles.tableContainer}>
                        <table className={styles.detailTable}>
                          <tbody>
                            <AttachmentFieldRow
                              files={poaFiles}
                              required
                              disabled={isLockedReadOnly}
                              uploading={isUploading}
                              onUpload={(f) => validateAndUpload(f, 'poa')}
                              onRemove={(idx) => handleRemoveFile('poa', idx)}
                              onOpen={handleOpenAttachment}
                            />
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Form>
          </LoadingSpinner>

          {/* Fixed Bottom Footer */}
          <div className={styles.footerActions}>
            <div className={styles.footerRight}>
              <ActionButton action="cancel" onClick={handleClose}>Cancel</ActionButton>
              {!isLockedReadOnly && (
                <ActionButton intent="primary" appearance="filled" disabled={isCreating || isUpdating || assignOfficer.isPending} onClick={handleSubmit}>{isEdit ? 'Save' : 'Register'}</ActionButton>
              )}
            </div>
          </div>
        </div>
      </Popup>
    </>
  );
}
