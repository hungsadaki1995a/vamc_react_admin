import { useState } from 'react';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import Spinbox from '@/components/inputs/Spinbox';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { ApiError } from '@/lib/api/error';
import { SysButton } from '@/features/system/_shared/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '@/features/system/_shared/SysFormUi';
import type { FaqItem } from './faq.types';
import { useFaqDetail, useSaveFaq } from './use-faq-detail';
import { useDeleteFaqs } from './use-faqs';
import { useFaqCategories } from './use-faq-categories';
import styles from './faq-detail-modal.module.scss';

// FAQ Management - Register / Edit (VPA070500P01).
// Register: [Cancel] [Register]; Edit: [Delete] … [Cancel] [Edit]. Category is kept although the design has none.

interface FaqDetailModalProps {
  visible: boolean;
  mode: 'create' | 'detail';
  faq: FaqItem | null;
  onClose: () => void;
  onRefresh?: () => void;
}

type Field = 'category' | 'question' | 'answer' | 'questionEn' | 'answerEn';
type Errors = Partial<Record<Field, string>>;

const required = (field: string) => `${field} is required.`;

const MESSAGES = {
  /** C01 */
  confirmDelete: 'Are you sure you want to delete?',
  /** C02 */
  englishDropped: 'English content will not be saved. Do you want to save?',
  locked: 'A published FAQ cannot be edited. Set it to Unpublished and save, then reopen it to edit the text.',
  registered: 'The FAQ has been registered.',
  updated: 'The FAQ has been updated.',
  deleted: 'The FAQ has been deleted.',
} as const;

export default function FaqDetailModal({ visible, mode, faq, onClose, onRefresh }: FaqDetailModalProps) {
  const { toast, dialog } = useNotify();
  const isCreate = mode === 'create';
  const pstNo = !isCreate ? faq?.pstNo || faq?.id : undefined;

  const { data: detail, isLoading } = useFaqDetail(visible ? pstNo : undefined, {
    enabled: visible && !isCreate && Boolean(pstNo),
  });

  const categoryOptions = useFaqCategories();
  const [category, setCategory] = useState('');
  const [published, setPublished] = useState<'Y' | 'N'>('N');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [provideEn, setProvideEn] = useState(false);
  const [questionEn, setQuestionEn] = useState('');
  const [answerEn, setAnswerEn] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const saveFaq = useSaveFaq();
  const deleteFaqs = useDeleteFaqs();

  // (Re)fill the form whenever the popup opens or its source data changes — adjusted during render, not in an effect.
  const formSource = [visible, isCreate, detail, faq, categoryOptions];
  const [syncedSource, setSyncedSource] = useState<unknown[]>([]);
  if (formSource.some((value, index) => value !== syncedSource[index])) {
    setSyncedSource(formSource);
    setErrors({});
    if (visible && isCreate) {
      setCategory(categoryOptions[0]?.value ?? '');
      setPublished('N');
      setQuestion('');
      setAnswer('');
      setProvideEn(false);
      setQuestionEn('');
      setAnswerEn('');
    } else if (visible) {
      const titleEn = detail?.titleEn || faq?.titleEn || '';
      setCategory(detail?.category || faq?.category || '');
      setPublished((detail?.published || faq?.published) === 'Y' ? 'Y' : 'N');
      setQuestion(detail?.title || faq?.title || '');
      setAnswer(detail?.content || faq?.content || '');
      // Design: checked on edit when Question (EN) exists.
      setProvideEn(Boolean(titleEn));
      setQuestionEn(titleEn);
      setAnswerEn(detail?.contentEn || faq?.contentEn || '');
    }
  }

  if (!visible) return null;

  // The API rejects text changes while the FAQ is published — unpublish first.
  const contentLocked = !isCreate && detail?.contentEditable === false;
  const busy = saveFaq.isPending || deleteFaqs.isPending;
  const displayOrder = isCreate ? 1 : faq?.displayOrder;

  const clearError = (field: Field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (!category) next.category = required('Category');
    if (!question.trim()) next.question = required('Question');
    if (!answer.trim()) next.answer = required('Answer');
    if (provideEn && !questionEn.trim()) next.questionEn = required('Question (EN)');
    if (provideEn && !answerEn.trim()) next.answerEn = required('Answer (EN)');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    try {
      // Content is saved first, then category / publish status (content is locked while published).
      await saveFaq.mutateAsync({
        pstNo: isCreate ? null : String(pstNo),
        category,
        published,
        content: contentLocked
          ? undefined
          : {
              question: question.trim(),
              answer: answer.trim(),
              // Unchecked: English is not saved (cleared on edit).
              questionEn: provideEn ? questionEn.trim() : undefined,
              answerEn: provideEn ? answerEn.trim() : undefined,
            },
      });
    } catch (err) {
      toast.error(ApiError.from(err).message);
      return;
    }
    toast.success(isCreate ? MESSAGES.registered : MESSAGES.updated);
    onClose();
    onRefresh?.();
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const englishEntered = Boolean(questionEn.trim() || answerEn.trim());
    if (!provideEn && englishEntered && !contentLocked) {
      dialog.confirm({ content: MESSAGES.englishDropped, okText: 'Save', cancelText: 'Cancel', onOk: save });
      return;
    }
    void save();
  };

  const handleDelete = () => {
    if (!pstNo) return;
    dialog.confirm({
      content: MESSAGES.confirmDelete,
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteFaqs.mutateAsync([String(pstNo)]);
        } catch (err) {
          toast.error(ApiError.from(err).message);
          return;
        }
        toast.success(MESSAGES.deleted);
        onClose();
        onRefresh?.();
      },
    });
  };

  return (
    <SysFormModal
      open
      title={isCreate ? 'Register FAQ' : 'Edit FAQ'}
      width={1200}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitText={isCreate ? 'Register' : 'Edit'}
      submitting={saveFaq.isPending}
      submitDisabled={busy}
      notice={contentLocked ? MESSAGES.locked : undefined}
      leftActions={
        isCreate ? undefined : (
          <SysButton look="danger" onClick={handleDelete} loading={deleteFaqs.isPending} disabled={busy}>
            Delete
          </SysButton>
        )
      }
    >
      <LoadingSpinner spinning={isLoading}>
        <SysFieldGrid columns={2}>
          <SysField label="Publish Status" required>
            <AppRadio.Group value={published} onChange={(e) => setPublished(e.target.value)}>
              <AppRadio value="Y">Published</AppRadio>
              <AppRadio value="N">Unpublished</AppRadio>
            </AppRadio.Group>
          </SysField>
          <SysField label="Display Order">
            {/* Read only here: the order is managed by the server (new posts start at 1). */}
            <Spinbox value={displayOrder} min={1} disabled />
          </SysField>
          <SysField label="Category" required span="full" error={errors.category}>
            <AppSelect
              className={styles.category}
              value={category || undefined}
              options={categoryOptions}
              onChange={(value) => {
                setCategory(String(value));
                clearError('category');
              }}
            />
          </SysField>
          <SysField label="Question" required span="full" error={errors.question}>
            <TextInput
              placeholder="Enter the question."
              disabled={contentLocked}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                clearError('question');
              }}
            />
          </SysField>
          <SysField label="Answer" required span="full" error={errors.answer}>
            <TextArea
              className={styles.editor}
              placeholder="Enter the answer."
              disabled={contentLocked}
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                clearError('answer');
              }}
            />
          </SysField>
          <SysField label="Provide English" span="full">
            <AppCheckbox
              checked={provideEn}
              disabled={contentLocked}
              onChange={(e) => {
                setProvideEn(e.target.checked);
                if (!e.target.checked) setErrors((prev) => ({ ...prev, questionEn: undefined, answerEn: undefined }));
              }}
            >
              Provide English
            </AppCheckbox>
          </SysField>
          <SysField label="Question (EN)" required={provideEn} span="full" error={errors.questionEn}>
            <TextInput
              placeholder="Enter the question."
              disabled={contentLocked || !provideEn}
              value={questionEn}
              onChange={(e) => {
                setQuestionEn(e.target.value);
                clearError('questionEn');
              }}
            />
          </SysField>
          <SysField label="Answer (EN)" required={provideEn} span="full" error={errors.answerEn}>
            <TextArea
              className={styles.editor}
              placeholder="Enter the answer."
              disabled={contentLocked || !provideEn}
              value={answerEn}
              onChange={(e) => {
                setAnswerEn(e.target.value);
                clearError('answerEn');
              }}
            />
          </SysField>
        </SysFieldGrid>
      </LoadingSpinner>
    </SysFormModal>
  );
}
