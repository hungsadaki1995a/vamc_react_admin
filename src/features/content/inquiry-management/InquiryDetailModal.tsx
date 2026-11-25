import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ContentFile, NotificationChannel } from '@/api/contents/inquiry-api';
import ActionButton from '@/components/common/actions/ActionButton';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import { useNotify } from '@/hooks/use-notify';
import { ApiError } from '@/lib/api/error';
import RichTextEditor from '@/features/content/_shared/RichTextEditor';
import { originalFileName, useDownloadContentFile } from '@/features/content/_shared/use-content-files';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { formatSysDateTime } from '@/utils/system-utils';
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

const CHANNEL_LABELS: Record<string, string> = { EMAIL: 'Email', ZALO: 'Zalo' };

/** "Email, Zalo" — the channels used once answered, the ones the answer will use before; "-" when none. */
function channelText(channels?: NotificationChannel[]): string {
  const labels = (channels ?? []).map((code) => CHANNEL_LABELS[code] ?? code);
  return labels.length > 0 ? labels.join(', ') : '-';
}

export default function InquiryDetailModal({ visible, inquiry, onClose, onRefresh }: InquiryDetailModalProps) {
  const { t } = useTranslation();
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
  const attachments = detail?.attachments ?? [];
  const contact = [detail?.inquirerEmail, detail?.inquirerPhone].filter(Boolean).join(', ') || '-';
  const answeredBy = detail?.ansEmpNo || inquiry.ansEmpNo;

  const close = () => {
    setDraft({ text: '' });
    setError(undefined);
    onClose();
  };

  const handleAnswer = async () => {
    const text = answerText.trim();
    if (!text) {
      setError(t('messages.content.inquiry.answerRequired'));
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
    toast.success(t('messages.content.inquiry.answered'));
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
          {/* Login ID of General / Full members; "-" for non-members and Temporary members. */}
          <SysField label="Customer">{detail?.customerLoginId || inquiry.customerLoginId || '-'}</SysField>
          <SysField label="Inquirer">{detail?.inquirerNm || inquiry.inquirerNm || '-'}</SysField>
          <SysField label="Email, Mobile">{contact}</SysField>
          <SysField label="Answer Notification">{channelText(detail?.notificationChannels)}</SysField>
          <SysField label="Registered Date">{formatSysDateTime(detail?.crtDt || inquiry.crtDt)}</SysField>
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
              <div
                className={styles.answer}
                // Sent answers are editor HTML (older ones plain text).
                // eslint-disable-next-line react/no-danger -- sanitized with DOMPurify
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail?.answer || inquiry.responseContent || '-') }}
              />
            ) : (
              <div className={styles.answerEditor}>
                <RichTextEditor
                  ariaLabel="Answer"
                  placeholder="Enter the answer."
                  invalid={Boolean(error)}
                  value={answerText}
                  onChange={(html) => {
                    setDraft({ key: pstNo, text: html });
                    if (error) setError(undefined);
                  }}
                />
              </div>
            )}
          </SysField>
          {answered && (
            <SysField label="Answered Date" span="full">
              {`${formatSysDateTime(detail?.answeredAt || inquiry.answeredAt)}${answeredBy ? ` (${answeredBy})` : ''}`}
            </SysField>
          )}
        </SysFieldGrid>
      </LoadingSpinner>
    </SysFormModal>
  );
}
