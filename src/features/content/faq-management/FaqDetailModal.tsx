import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import Spinbox from '@/components/inputs/Spinbox';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { ApiError } from '@/lib/api/error';
import RichTextEditor from '@/features/content/_shared/RichTextEditor';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import type { FaqItem } from './faq.types';
import { useFaqDetail, usePublishedFaqCount, useSaveFaq } from './use-faq-detail';
import { useDeleteFaqs } from './use-faqs';
import { useFaqCategories } from './use-faq-categories';
import styles from './faq-detail-modal.module.scss';

// FAQ Management - Register / Edit (VPA070500P01).
// Register: [Cancel] [Register]; Edit: [Delete] … [Cancel] [Edit]. Category is kept although the design has none.
// Published FAQs stay editable. Display Order: spin box only (no typing), 1..published FAQs of the category
// (+1 when this FAQ is not yet among them); new FAQs start at 1. Answers use the rich-text editor (HTML).

interface FaqDetailModalProps {
  visible: boolean;
  mode: 'create' | 'detail';
  faq: FaqItem | null;
  onClose: () => void;
  onRefresh?: () => void;
}

type Field = 'category' | 'question' | 'answer' | 'questionEn' | 'answerEn';
type Errors = Partial<Record<Field, string>>;

export default function FaqDetailModal({ visible, mode, faq, onClose, onRefresh }: FaqDetailModalProps) {
  const { t } = useTranslation();
  const { toast, dialog } = useNotify();
  const isCreate = mode === 'create';
  const pstNo = !isCreate ? faq?.pstNo || faq?.id : undefined;

  const { data: detail, isLoading } = useFaqDetail(visible ? pstNo : undefined, {
    enabled: visible && !isCreate && Boolean(pstNo),
  });

  const categoryOptions = useFaqCategories();
  const [category, setCategory] = useState('');
  const [published, setPublished] = useState<'Y' | 'N'>('N');
  const [displayOrder, setDisplayOrder] = useState(1);
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
      setDisplayOrder(1);
      setQuestion('');
      setAnswer('');
      setProvideEn(false);
      setQuestionEn('');
      setAnswerEn('');
    } else if (visible) {
      const titleEn = detail?.titleEn || faq?.titleEn || '';
      setCategory(detail?.category || faq?.category || '');
      setPublished((detail?.published || faq?.published) === 'Y' ? 'Y' : 'N');
      setDisplayOrder(detail?.displayOrder ?? faq?.displayOrder ?? 1);
      setQuestion(detail?.title || faq?.title || '');
      setAnswer(detail?.content || faq?.content || '');
      // Design: checked on edit when Question (EN) exists.
      setProvideEn(Boolean(titleEn));
      setQuestionEn(titleEn);
      setAnswerEn(detail?.contentEn || faq?.contentEn || '');
    }
  }

  // Range of the order: published FAQs of the selected category, plus this FAQ when it is not among them yet.
  const publishedCount = usePublishedFaqCount(category, visible && published === 'Y');
  if (!visible) return null;

  const countedAlready = !isCreate && detail?.published === 'Y' && detail?.category === category;
  const maxOrder = Math.max(1, (publishedCount.data ?? 0) + (countedAlready ? 0 : 1));
  const orderValue = Math.min(displayOrder, maxOrder);
  const busy = saveFaq.isPending || deleteFaqs.isPending;

  const clearError = (field: Field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    const required = (field: string) => t('messages.sys.fieldRequired', { label: field });
    if (!category) next.category = required(t('messages.content.faq.fields.category'));
    if (!question.trim()) next.question = required(t('messages.content.faq.fields.question'));
    if (!answer) next.answer = required(t('messages.content.faq.fields.answer'));
    if (provideEn && !questionEn.trim()) next.questionEn = required(t('messages.content.faq.fields.questionEn'));
    if (provideEn && !answerEn) next.answerEn = required(t('messages.content.faq.fields.answerEn'));
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    try {
      await saveFaq.mutateAsync({
        pstNo: isCreate ? null : String(pstNo),
        category,
        published,
        displayOrder: orderValue,
        content: {
          question: question.trim(),
          answer,
          // Unchecked: English is not saved (cleared on edit).
          questionEn: provideEn ? questionEn.trim() : undefined,
          answerEn: provideEn ? answerEn : undefined,
        },
      });
    } catch (err) {
      toast.error(ApiError.from(err).message);
      return;
    }
    toast.success(isCreate ? t('messages.content.faq.registered') : t('messages.content.faq.updated'));
    onClose();
    onRefresh?.();
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const englishEntered = Boolean(questionEn.trim() || answerEn);
    if (!provideEn && englishEntered) {
      dialog.confirm({
        content: t('messages.content.faq.englishDropped'),
        okText: t('messages.dialog.save'),
        cancelText: t('messages.dialog.cancel'),
        onOk: save,
      });
      return;
    }
    void save();
  };

  const handleDelete = () => {
    if (!pstNo) return;
    dialog.confirm({
      content: t('messages.content.faq.confirmDelete'),
      okText: t('messages.dialog.delete'),
      cancelText: t('messages.dialog.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteFaqs.mutateAsync([String(pstNo)]);
        } catch (err) {
          toast.error(ApiError.from(err).message);
          return;
        }
        toast.success(t('messages.content.faq.deleted'));
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
            {/* Arrows only (design: read only input). Unpublished FAQs have no display order. */}
            <Spinbox
              aria-label="Display Order"
              value={orderValue}
              min={1}
              max={maxOrder}
              precision={0}
              disabled={published !== 'Y'}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Tab') e.preventDefault();
              }}
              onChange={(value) => setDisplayOrder(Math.min(Math.max(value ?? 1, 1), maxOrder))}
            />
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
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                clearError('question');
              }}
            />
          </SysField>
          <SysField label="Answer" required span="full" error={errors.answer}>
            <div className={styles.editor}>
              <RichTextEditor
                ariaLabel="Answer"
                placeholder="Enter the answer."
                invalid={Boolean(errors.answer)}
                value={answer}
                onChange={(html) => {
                  setAnswer(html);
                  clearError('answer');
                }}
              />
            </div>
          </SysField>
          <SysField label="Provide English" span="full">
            <AppCheckbox
              checked={provideEn}
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
              disabled={!provideEn}
              value={questionEn}
              onChange={(e) => {
                setQuestionEn(e.target.value);
                clearError('questionEn');
              }}
            />
          </SysField>
          <SysField label="Answer (EN)" required={provideEn} span="full" error={errors.answerEn}>
            <div className={styles.editor}>
              <RichTextEditor
                ariaLabel="Answer (EN)"
                placeholder="Enter the answer."
                disabled={!provideEn}
                invalid={Boolean(errors.answerEn)}
                value={answerEn}
                onChange={(html) => {
                  setAnswerEn(html);
                  clearError('answerEn');
                }}
              />
            </div>
          </SysField>
        </SysFieldGrid>
      </LoadingSpinner>
    </SysFormModal>
  );
}
