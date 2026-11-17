import { useState, useEffect } from 'react';
import { Modal, Spin, Radio, Select, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  createFaq,
  updateFaq,
  updateFaqStatus,
} from '@/api/contents/faqApi';
import type { FaqItem } from './faq.types';
import { useFaqDetail } from './useFaqDetail';
import styles from './FaqDetailModal.module.css';

interface FaqDetailModalProps {
  visible: boolean;
  mode: 'create' | 'detail';
  faq: FaqItem | null;
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

export default function FaqDetailModal({
  visible,
  mode,
  faq,
  onClose,
  onRefresh,
}: FaqDetailModalProps) {
  const queryClient = useQueryClient();
  const isCreate = mode === 'create';
  const pstNo = !isCreate ? (faq?.pstNo || faq?.id) : undefined;

  const { data: detailData, isLoading } = useFaqDetail(visible ? pstNo : undefined, {
    enabled: visible && !isCreate && Boolean(pstNo),
  });

  const [category, setCategory] = useState('AUCTION');
  const [published, setPublished] = useState<'Y' | 'N'>('N');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [questionEn, setQuestionEn] = useState('');
  const [answerEn, setAnswerEn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setIsSubmitting(false);

    if (isCreate) {
      setCategory('AUCTION');
      setPublished('N');
      setQuestion('');
      setAnswer('');
      setQuestionEn('');
      setAnswerEn('');
    } else {
      setCategory(detailData?.category || faq?.category || 'AUCTION');
      setPublished(((detailData?.published || faq?.published || 'N') === 'Y' ? 'Y' : 'N'));
      setQuestion(detailData?.title || faq?.title || '');
      setAnswer(detailData?.content || faq?.content || '');
      setQuestionEn(detailData?.titleEn || faq?.titleEn || '');
      setAnswerEn(detailData?.contentEn || faq?.contentEn || '');
    }
  }, [visible, isCreate, detailData, faq]);

  const handleSave = async () => {
    if (!question.trim()) {
      message.warning('Please enter a FAQ question.');
      return;
    }
    if (!answer.trim()) {
      message.warning('Please enter a FAQ answer.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreate) {
        await createFaq({
          body: {
            category,
            question: question.trim(),
            answer: answer.trim(),
            questionEn: questionEn.trim() || undefined,
            answerEn: answerEn.trim() || undefined,
            published,
          },
          throwOnError: true,
        });
      } else if (pstNo) {
        await updateFaqStatus({
          path: { pstNo: String(pstNo) },
          body: {
            category,
            published,
          },
        });
        await updateFaq({
          path: { pstNo: String(pstNo) },
          body: {
            question: question.trim(),
            answer: answer.trim(),
            questionEn: questionEn.trim() || undefined,
            answerEn: answerEn.trim() || undefined,
          },
        });
      }

      queryClient.invalidateQueries({ queryKey: ['contents', 'faqs'] });
      if (pstNo) {
        queryClient.invalidateQueries({ queryKey: ['faq-detail', pstNo] });
      }

      Modal.success({
        title: 'Success',
        content: isCreate
          ? 'FAQ has been registered successfully.'
          : 'FAQ has been updated successfully.',
        okText: 'OK',
        okButtonProps: {
          style: { backgroundColor: '#111827', borderColor: '#111827' },
        },
        onOk: () => {
          onClose();
          onRefresh?.();
        },
      });
    } catch (err) {
      console.warn('FAQ save operation encountered error:', err);
      message.error('Failed to save FAQ. Please check if the FAQ is currently published or try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
          {isCreate ? 'Register FAQ' : 'FAQ Detail'}
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      centered
      destroyOnClose
      footer={
        <div className={styles.footerRow}>
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
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      }
    >
      <div className={styles.modalBody}>
        <Spin spinning={isLoading} tip="Loading FAQ details...">
          <table className={styles.tableWrapper}>
            <tbody>
              <tr>
                <th className={styles.headerCell} style={{ width: '15%' }}>
                  Category
                </th>
                <td className={styles.dataCell} style={{ width: '35%' }}>
                  <Select
                    value={category}
                    onChange={(val) => setCategory(val)}
                    style={{ width: 180 }}
                    options={[
                      { label: 'Auction', value: 'AUCTION' },
                      { label: 'Sale', value: 'SALE' },
                      { label: 'Purchase', value: 'PURCHASE' },
                    ]}
                  />
                </td>
                <th className={styles.headerCell} style={{ width: '15%' }}>
                  Posting Status
                </th>
                <td className={styles.dataCell} style={{ width: '35%' }}>
                  <Radio.Group
                    value={published}
                    onChange={(e) => setPublished(e.target.value)}
                  >
                    <Radio value="Y">Posted</Radio>
                    <Radio value="N">Not Posted</Radio>
                  </Radio.Group>
                </td>
              </tr>

              {!isCreate && (
                <tr>
                  <th className={styles.headerCell}>Registered By</th>
                  <td className={styles.dataCell}>
                    {detailData?.crtByNm || detailData?.crtBy || faq?.crtByNm || '-'}
                  </td>
                  <th className={styles.headerCell}>Registration Date</th>
                  <td className={styles.dataCell}>
                    {formatDateTime(detailData?.crtDt || faq?.crtDt)}
                  </td>
                </tr>
              )}

              <tr>
                <th className={styles.headerCell}>Question</th>
                <td className={styles.dataCell} colSpan={3}>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Enter the FAQ question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </td>
              </tr>

              <tr>
                <th className={styles.headerCell}>Answer</th>
                <td className={styles.dataCell} colSpan={3}>
                  <textarea
                    className={styles.textareaField}
                    placeholder="Enter the FAQ answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={5}
                  />
                </td>
              </tr>

              <tr>
                <th className={styles.headerCell}>Question (EN)</th>
                <td className={styles.dataCell} colSpan={3}>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Enter the English FAQ question (optional)"
                    value={questionEn}
                    onChange={(e) => setQuestionEn(e.target.value)}
                  />
                </td>
              </tr>

              <tr>
                <th className={styles.headerCell}>Answer (EN)</th>
                <td className={styles.dataCell} colSpan={3}>
                  <textarea
                    className={styles.textareaField}
                    placeholder="Enter the English FAQ answer (optional)"
                    value={answerEn}
                    onChange={(e) => setAnswerEn(e.target.value)}
                    rows={4}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </Spin>
      </div>
    </Modal>
  );
}

