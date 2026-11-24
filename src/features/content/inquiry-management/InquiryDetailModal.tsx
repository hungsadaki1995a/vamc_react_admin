import { useState } from 'react';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ContentFile } from '@/api/contents/post-api';
import ActionButton from '@/components/common/actions/ActionButton';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import TextArea from '@/components/inputs/TextArea';
import { useNotify } from '@/hooks/use-notify';
import { ApiError } from '@/lib/api/error';
import { originalFileName, useDownloadContentFile } from '@/features/content/_shared/use-content-files';
import { SysField, SysFieldGrid, SysFormModal } from '@/features/system/_shared/SysFormUi';
import { formatSysDateTime } from '@/features/system/_shared/system-utils';
import type { InquiryItem } from './inquiry.types';
import { useAnswerInquiry, useInquiryDetail } from './use-inquiry-detail';
import styles from './inquiry-detail-modal.module.scss';

// Direct Inquiry Management - Answer (VPA070400P01). The inquiry is read only; an answer is written once
// and cannot be edited after it is sent, so an answered inquiry opens read only with [Close].

interface InquiryDetailModalProps {
  visible: boolean;
  inquiry: InquiryItem | null;
  onClose: () => void;
  onRefresh?: () => void;
}

const MESSAGES = {
  /** E01 */
  answerRequired: 'Answer is required.',
  answered: 'The answer has been sent.',
} as const;

/** The detail API returns full attachment rows (fileSeq, fileNm …) although its hand-written type is narrower. */
function attachmentsOf(raw: unknown): ContentFile[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Partial<ContentFile>[]).filter(
    (file): file is ContentFile => Boolean(file.fileUnqId && file.fileSeq !== undefined && file.fileNm),
  );
}

export default function InquiryDetailModal({ visible, inquiry, onClose, onRefresh }: InquiryDetailModalProps) {
  const { toast } = useNotify();
  const pstNo = inquiry?.pstNo || inquiry?.id;
  const { data: detail, isLoading } = useInquiryDetail(visible ? pstNo : undefined, {
    enabled: visible && Boolean(pstNo),
  });
  const answerInquiry = useAnswerInquiry();
  const downloadFile = useDownloadContentFile();

  // Draft per inquiry, so opening another inquiry starts empty.
  const [draft, setDraft] = useState<{ key?: string; text: string }>({ text: '' });
  const [error, setError] = useState<string>();
  const answerText = draft.key === pstNo ? draft.text : '';

  if (!visible || !inquiry) return null;

  const answered = (detail?.answerStatus || inquiry.answerStatus || 'UNANSWERED').toUpperCase() === 'ANSWERED';
  const attachments = attachmentsOf(detail?.attachments);
  const contact = [detail?.inquirerEmail, detail?.inquirerPhone].filter(Boolean).join(', ') || '-';
  const answeredBy = detail?.ansEmpNm || detail?.ansEmpNo || inquiry.ansEmpNm || inquiry.ansEmpNo;

  const close = () => {
    setDraft({ text: '' });
    setError(undefined);
    onClose();
  };

  const handleAnswer = async () => {
    const text = answerText.trim();
    if (!text) {
      setError(MESSAGES.answerRequired);
      return;
    }
    if (!pstNo) return;
    try {
      // The hook refreshes the list and this detail on success.
      await answerInquiry.mutateAsync({ pstNo: String(pstNo), answer: text });
    } catch (err) {
      toast.error(ApiError.from(err).message);
      return;
    }
    toast.success(MESSAGES.answered);
    close();
    onRefresh?.();
  };

  const handleDownload = async (file: ContentFile) => {
    try {
      await downloadFile.mutateAsync(file);
    } catch (err) {
      toast.error(ApiError.from(err).message);
    }
  };

  return (
    <SysFormModal
      open
      title="Direct Inquiry Answer"
      width={1200}
      onCancel={close}
      onSubmit={answered ? undefined : handleAnswer}
      submitText="Answer"
      submitting={answerInquiry.isPending}
    >
      <LoadingSpinner spinning={isLoading}>
        <SysFieldGrid columns={2}>
          <SysField label="Inquiry Type">{detail?.categoryNm || inquiry.categoryNm || '-'}</SysField>
          <SysField label="Customer">{detail?.mbrNo || inquiry.mbrNo || '-'}</SysField>
          <SysField label="Inquirer">{detail?.inquirerNm || inquiry.inquirerNm || '-'}</SysField>
          <SysField label="Email, Mobile">{contact}</SysField>
          <SysField label="Registered Date">{formatSysDateTime(detail?.crtDt || inquiry.crtDt)}</SysField>
          <SysField label="Answered Date">
            {answered
              ? `${formatSysDateTime(detail?.answeredAt || inquiry.answeredAt)}${answeredBy ? ` (${answeredBy})` : ''}`
              : '-'}
          </SysField>
          <SysField label="Inquiry Title" span="full">
            {detail?.title || inquiry.title || '-'}
          </SysField>
          {attachments.length > 0 && (
            <SysField label="Attachments" span="full">
              <ul className={styles.files}>
                {attachments.map((file) => (
                  <li key={`${file.fileUnqId}-${file.fileSeq}`} className={styles.file}>
                    <FileTextOutlined className={styles.fileIcon} />
                    <span className={styles.fileName}>{originalFileName(file.fileNm)}</span>
                    <ActionButton
                      intent="icon"
                      size="small"
                      icon={<DownloadOutlined />}
                      title="Download"
                      aria-label={`Download ${originalFileName(file.fileNm)}`}
                      onClick={() => handleDownload(file)}
                    />
                  </li>
                ))}
              </ul>
            </SysField>
          )}
          <SysField label="Inquiry Content" span="full">
            <div className={styles.content}>{detail?.content || inquiry.content || ''}</div>
          </SysField>
          <SysField label="Answer" required={!answered} span="full" error={error}>
            {answered ? (
              <div className={styles.answer}>{detail?.answer || inquiry.responseContent || '-'}</div>
            ) : (
              <TextArea
                className={styles.answerInput}
                placeholder="Enter the answer."
                value={answerText}
                onChange={(e) => {
                  setDraft({ key: pstNo, text: e.target.value });
                  if (error) setError(undefined);
                }}
              />
            )}
          </SysField>
        </SysFieldGrid>
      </LoadingSpinner>
    </SysFormModal>
  );
}
