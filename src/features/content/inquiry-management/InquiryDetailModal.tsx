import { useState } from 'react';
import { Modal, Spin } from 'antd';
import dayjs from 'dayjs';
import { useNotify } from '@/hooks/use-notify';
import { ApiError } from '@/lib/api/error';
import type { InquiryItem } from './inquiry.types';
import { useAnswerInquiry, useInquiryDetail } from './use-inquiry-detail';
import styles from './inquiry-detail-modal.module.scss';

interface InquiryDetailModalProps {
  visible: boolean;
  inquiry: InquiryItem | null;
  onClose: () => void;
  onRefresh?: () => void;
}

function formatDateTime(val?: string | null): string {
  if (!val || val === '-') return '-';
  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(val)) {
    return val;
  }
  const d = dayjs(val);
  if (d.isValid()) {
    return d.format('DD/MM/YYYY HH:mm:ss');
  }
  return val;
}

export default function InquiryDetailModal({
  visible,
  inquiry,
  onClose,
  onRefresh,
}: InquiryDetailModalProps) {
  const { toast, dialog } = useNotify();

  // Use pstNo from list item (falling back to id)
  const pstNo = inquiry?.pstNo || inquiry?.id;

  // Call API getInquiry (/api/v1/contents/inquiries/{pstNo})
  const { data: detailData, isLoading } = useInquiryDetail(visible ? pstNo : undefined, {
    enabled: visible && Boolean(pstNo),
  });

  // Reply draft per inquiry (null means fall back to server answer)
  const [draftState, setDraftState] = useState<{ key?: string; text: string }>({ text: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const answerInquiry = useAnswerInquiry();
  const isSubmitting = answerInquiry.isPending;

  const replyText = draftState.key === pstNo
    ? draftState.text
    : (detailData?.answer || inquiry?.responseContent || '');
  const setReplyText = (text: string) => setDraftState({ key: pstNo, text });

  // Determine whether inquiry is UNANSWERED
  const rawStatus = (
    detailData?.answerStatus ||
    inquiry?.answerStatus ||
    inquiry?.status ||
    'UNANSWERED'
  ).toUpperCase();
  const isUnanswered = rawStatus === 'UNANSWERED';

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
    '-';

  // Resolve registration date
  const registrationDateDisplay = formatDateTime(
    detailData?.crtDt || inquiry?.crtDt || inquiry?.registrationDate
  );

  // Resolve title
  const titleDisplay =
    detailData?.title ||
    inquiry?.title ||
    '-';

  // Resolve inquiry content
  const contentDisplay =
    detailData?.content ||
    inquiry?.content ||
    '';

  // Resolve reply text display (for answered state)
  const replyDisplay =
    detailData?.answer ||
    inquiry?.responseContent ||
    '';

  // ── Send Handler ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) {
      setErrorMsg('Please write a response to the inquiry.');
      toast.warning('Please write a response to the inquiry.');
      return;
    }

    if (!pstNo) {
      toast.error('Invalid inquiry ID.');
      return;
    }

    setErrorMsg(null);

    try {
      // The hook refreshes the list and this detail on success.
      await answerInquiry.mutateAsync({ pstNo: String(pstNo), answer: trimmed });
    } catch (err) {
      const reason = ApiError.from(err).message;
      setErrorMsg(reason);
      toast.error(reason);
      return;
    }

    // 2. Show success alert; when alert is closed, close modal & refresh list
    dialog.info({
      title: 'Success',
      content: 'The response has been sent successfully.',
      okText: 'OK',
      onOk: () => {
        setDraftState({ text: '' });
        onClose();
        onRefresh?.();
      },
    });
  };

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
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
                <th className={`${styles.headerCell} ${styles.col13}`}>
                  Inquiry Type
                </th>
                <td className={`${styles.dataCell} ${styles.col27}`}>
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
                <th className={`${styles.headerCell} ${styles.col14}`}>
                  Registered
                  <br />
                  Customers
                </th>
                <td className={`${styles.dataCell} ${styles.col20}`}>
                  {customerDisplay}
                </td>
                <th className={`${styles.headerCell} ${styles.col13}`}>
                  Registration
                  <br />
                  Date
                </th>
                <td className={`${styles.dataCell} ${styles.col13}`}>
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
