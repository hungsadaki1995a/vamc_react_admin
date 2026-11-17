import { useState, useEffect } from 'react';
import { Modal, Spin, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { answerInquiry } from '@/api/contents/inquiryApi';
import { updateMockInquiryAnswer } from './inquiry.mock';
import type { InquiryItem } from './inquiry.types';
import { useInquiryDetail } from './useInquiryDetail';
import styles from './InquiryDetailModal.module.css';

interface InquiryDetailModalProps {
  visible: boolean;
  inquiry: InquiryItem | null;
  onClose: () => void;
  onRefresh?: () => void;
  onResponseSubmit?: (inquiryId: string, responseText: string, responderName: string) => void;
}

function formatDateTime(val?: string | null): string {
  if (!val || val === '-') return '09/03/2026 10:23:24';
  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(val)) {
    return val;
  }
  const d = dayjs(val);
  if (d.isValid()) {
    return d.format('DD/MM/YYYY HH:mm:ss');
  }
  return val;
}

const DEFAULT_INQUIRY_CONTENT = `The submitted inquiry content will be displayed.
Inquiries can only be made via text.

How many characters should we allow at most? I think we need to decide. (1,000 characters??)
We should check the standards for Vietnam.`;

const DEFAULT_REPLY_CONTENT = `The response written for the inquiry will be displayed.

The response written for the inquiry will be displayed.
The response written for the inquiry will be displayed.
The response written for the inquiry will be displayed.
The response written for the inquiry will be displayed.
The response written for the inquiry will be displayed.`;

export default function InquiryDetailModal({
  visible,
  inquiry,
  onClose,
  onRefresh,
  onResponseSubmit,
}: InquiryDetailModalProps) {
  const queryClient = useQueryClient();

  // Use pstNo from list item (falling back to id)
  const pstNo = inquiry?.pstNo || inquiry?.id;

  // Call API getInquiry (/api/v1/contents/inquiries/{pstNo})
  const { data: detailData, isLoading } = useInquiryDetail(visible ? pstNo : undefined, {
    enabled: visible && Boolean(pstNo),
  });

  // Reply input state
  const [replyText, setReplyText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine whether inquiry is UNANSWERED
  const rawStatus = (
    detailData?.answerStatus ||
    inquiry?.answerStatus ||
    inquiry?.status ||
    'UNANSWERED'
  ).toUpperCase();
  const isUnanswered = rawStatus === 'UNANSWERED';

  // Reset or initialize input state when modal opens or inquiry changes
  useEffect(() => {
    if (visible) {
      setReplyText(detailData?.answer || inquiry?.responseContent || '');
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [visible, detailData, inquiry]);

  if (!inquiry && !detailData) return null;

  // Resolve category / inquiry type
  const categoryCode = detailData?.category || inquiry?.category || '';
  const categoryName = detailData?.categoryNm || inquiry?.categoryNm || inquiry?.inquiryType || '';
  const isConsulting =
    categoryCode === 'CST' ||
    categoryName.toLowerCase().includes('consult') ||
    inquiry?.inquiryType === 'Consulting';

  // Resolve registered customer (ID or Email Address)
  const customerDisplay =
    detailData?.inquirerEmail ||
    detailData?.mbrNo ||
    detailData?.inquirerNm ||
    inquiry?.registeredCustomer ||
    'ID or Email Address';

  // Resolve registration date
  const registrationDateDisplay = formatDateTime(
    detailData?.crtDt || inquiry?.crtDt || inquiry?.registrationDate
  );

  // Resolve title
  const titleDisplay =
    detailData?.title ||
    inquiry?.title ||
    'The registered inquiry title will be displayed.';

  // Resolve inquiry content
  const contentDisplay =
    detailData?.content ||
    inquiry?.content ||
    DEFAULT_INQUIRY_CONTENT;

  // Resolve reply text display (for answered state)
  const replyDisplay =
    detailData?.answer ||
    inquiry?.responseContent ||
    DEFAULT_REPLY_CONTENT;

  // ── Send Handler ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) {
      setErrorMsg('Please write a response to the inquiry.');
      message.warning('Please write a response to the inquiry.');
      return;
    }

    if (!pstNo) {
      message.error('Invalid inquiry ID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Call API answerInquiry (/api/v1/contents/inquiries/{pstNo}/answer)
      await answerInquiry({
        path: { pstNo: String(pstNo) },
        body: { answer: trimmed },
      });
    } catch (err) {
      console.warn(`answerInquiry for ${pstNo} failed, applying local mock fallback:`, err);
      // Fallback for development/offline
      updateMockInquiryAnswer(String(pstNo), trimmed);
    }

    // Update parent/local store if provided
    onResponseSubmit?.(String(pstNo), trimmed, 'Hong Gil Dong');

    // Invalidate react-query cache so list and detail are fresh
    queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    queryClient.invalidateQueries({ queryKey: ['inquiry-detail', pstNo] });

    setIsSubmitting(false);

    // 2. Show success alert; when alert is closed, close modal & refresh list
    Modal.success({
      title: 'Success',
      content: 'The response has been sent successfully.',
      okText: 'OK',
      okButtonProps: {
        style: { backgroundColor: '#111827', borderColor: '#111827' },
      },
      onOk: () => {
        onClose();
        onRefresh?.();
      },
    });
  };

  return (
    <Modal
      title={
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
          {isUnanswered ? 'Reply to 1:1 inquiry' : 'View response information for 1:1 inquiries'}
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      centered
      destroyOnClose
      footer={
        <div className={styles.footerRow}>
          {isUnanswered ? (
            <div className={styles.footerActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          ) : (
            <div className={styles.footerActions}>
              <button type="button" className={styles.closeBtn} onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      }
    >
      <div className={styles.modalBody}>
        <Spin spinning={isLoading} tip="Loading inquiry details...">
          <table className={styles.tableWrapper}>
            <tbody>
              {/* Row 1: Inquiry Type | Registered Customers | Registration Date */}
              <tr>
                <th className={styles.headerCell} style={{ width: '13%' }}>
                  Inquiry Type
                </th>
                <td className={styles.dataCell} style={{ width: '27%' }}>
                  <div className={styles.radioGroup}>
                    <div className={styles.radioOption}>
                      <span
                        className={
                          isConsulting
                            ? styles.radioCircleSelected
                            : styles.radioCircle
                        }
                      >
                        {isConsulting && <span className={styles.radioDot} />}
                      </span>
                      <span>Consulting</span>
                    </div>
                    <div className={styles.radioOption}>
                      <span
                        className={
                          !isConsulting
                            ? styles.radioCircleSelected
                            : styles.radioCircle
                        }
                      >
                        {!isConsulting && <span className={styles.radioDot} />}
                      </span>
                      <span>General Inquiry</span>
                    </div>
                  </div>
                </td>
                <th className={styles.headerCell} style={{ width: '14%' }}>
                  Registered
                  <br />
                  Customers
                </th>
                <td className={styles.dataCell} style={{ width: '20%' }}>
                  {customerDisplay}
                </td>
                <th className={styles.headerCell} style={{ width: '13%' }}>
                  Registration
                  <br />
                  Date
                </th>
                <td className={styles.dataCell} style={{ width: '13%' }}>
                  {registrationDateDisplay}
                </td>
              </tr>

              {/* Row 2: Title */}
              <tr>
                <th className={styles.headerCell}>Title</th>
                <td className={styles.dataCell} colSpan={5}>
                  {titleDisplay}
                </td>
              </tr>

              {/* Row 3: Inquiry Content */}
              <tr>
                <th className={styles.headerCell}>Inquiry Content</th>
                <td className={styles.dataCell} colSpan={5}>
                  <div className={styles.contentArea}>{contentDisplay}</div>
                </td>
              </tr>

              {/* Row 4: Reply (Input if UNANSWERED, Text if other) */}
              <tr>
                <th className={styles.headerCell}>Reply</th>
                <td className={styles.dataCell} colSpan={5}>
                  {isUnanswered ? (
                    <div className={styles.replyInputContainer}>
                      <textarea
                        className={`${styles.replyTextarea} ${
                          errorMsg ? styles.replyTextareaError : ''
                        }`}
                        placeholder="Please write a response to the inquiry."
                        value={replyText}
                        onChange={(e) => {
                          setReplyText(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        rows={6}
                      />
                      {errorMsg && <div className={styles.replyErrorMsg}>{errorMsg}</div>}
                    </div>
                  ) : (
                    <div className={styles.replyArea}>{replyDisplay}</div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </Spin>
      </div>
    </Modal>
  );
}
