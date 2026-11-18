import { useState } from 'react';
import { Modal, Spin, Radio, Select } from 'antd';
import dayjs from 'dayjs';
import { useNotify } from '@/hooks/use-notify';
import type { FaqItem } from './faq.types';
import { useFaqDetail, useSaveFaq } from './use-faq-detail';
import { useFaqCategories } from './use-faq-categories';
import { ApiError } from '@/lib/api/error';
import styles from './faq-detail-modal.module.scss';

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
  const { toast, dialog } = useNotify();
  const isCreate = mode === 'create';
  const pstNo = !isCreate ? (faq?.pstNo || faq?.id) : undefined;

  const { data: detailData, isLoading } = useFaqDetail(visible ? pstNo : undefined, {
    enabled: visible && !isCreate && Boolean(pstNo),
  });

  const categoryOptions = useFaqCategories();
  const [category, setCategory] = useState('');
  const [published, setPublished] = useState<'Y' | 'N'>('N');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [questionEn, setQuestionEn] = useState('');
  const [answerEn, setAnswerEn] = useState('');
  const saveFaq = useSaveFaq();
  const isSubmitting = saveFaq.isPending;

  // (Re)fill the form whenever the popup opens or its source data changes —
  // adjusted during render, not in an effect.
  const formSource = [visible, isCreate, detailData, faq, categoryOptions];
  const [syncedSource, setSyncedSource] = useState<unknown[]>([]);
  if (formSource.some((value, index) => value !== syncedSource[index])) {
    setSyncedSource(formSource);
    if (visible && isCreate) {
      setCategory(categoryOptions[0]?.value ?? '');
      setPublished('N');
      setQuestion('');
      setAnswer('');
      setQuestionEn('');
      setAnswerEn('');
    } else if (visible) {
      setCategory(detailData?.category || faq?.category || '');
      setPublished(((detailData?.published || faq?.published || 'N') === 'Y' ? 'Y' : 'N'));
      setQuestion(detailData?.title || faq?.title || '');
      setAnswer(detailData?.content || faq?.content || '');
      setQuestionEn(detailData?.titleEn || faq?.titleEn || '');
      setAnswerEn(detailData?.contentEn || faq?.contentEn || '');
    }
  }

  // The API rejects text changes while the FAQ is posted — stop posting first.
  const contentLocked = !isCreate && detailData?.contentEditable === false;

  const handleSave = async () => {
    if (!category) {
      toast.warning('Please select a category.');
      return;
    }
    if (!question.trim()) {
      toast.warning('Please enter a FAQ question.');
      return;
    }
    if (!answer.trim()) {
      toast.warning('Please enter a FAQ answer.');
      return;
    }

    try {
      if (isCreate || pstNo) {
        // Content can only be edited while the FAQ is not posted (contentEditable),
        // so the text is saved first and the category / posting status afterwards.
        await saveFaq.mutateAsync({
          pstNo: isCreate ? null : String(pstNo),
          category,
          published,
          content: contentLocked
            ? undefined
            : {
                question: question.trim(),
                answer: answer.trim(),
                questionEn: questionEn.trim() || undefined,
                answerEn: answerEn.trim() || undefined,
              },
        });
      }

      dialog.info({
        title: 'Success',
        content: isCreate
          ? 'FAQ has been registered successfully.'
          : 'FAQ has been updated successfully.',
        okText: 'OK',
        onOk: () => {
          onClose();
          onRefresh?.();
        },
      });
    } catch (err) {
      toast.error(ApiError.from(err).message);
    }
  };

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
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
                <th className={`${styles.headerCell} ${styles.labelCol}`}>
                  Category
                </th>
                <td className={`${styles.dataCell} ${styles.valueCol}`}>
                  <Select
                    value={category}
                    onChange={(val) => setCategory(val)}
                    className={styles.categorySelect}
                    options={categoryOptions}
                  />
                </td>
                <th className={`${styles.headerCell} ${styles.labelCol}`}>
                  Posting Status
                </th>
                <td className={`${styles.dataCell} ${styles.valueCol}`}>
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

              {contentLocked && (
                <tr>
                  <td className={`${styles.dataCell} ${styles.lockedNotice}`} colSpan={4}>
                    A posted FAQ cannot be edited. Set it to Not Posted and save, then reopen to edit the text.
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
                    disabled={contentLocked}
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
                    disabled={contentLocked}
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
                    disabled={contentLocked}
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
                    disabled={contentLocked}
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

