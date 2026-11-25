import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import AppDatePicker from '@/components/inputs/AppDatePicker';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import Spinbox from '@/components/inputs/Spinbox';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import RichTextEditor from './RichTextEditor';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useNotify } from '@/hooks/use-notify';
import type { ContentFile, LegalOptions, PostDetail, YesNo } from '@/api/contents/post-api';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { API_DATE_DMY, SYS_DATE_FORMAT } from '@/config/sys-constants';
import { SYS_DIALOG_LABELS, SYS_MESSAGES } from '@/config/sys-messages';
import { errorMessage } from '@/utils/system-utils';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import type { BoardConfig, CategoryOption } from './board-config';
import { AttachmentSection, ImageField, ThumbnailField } from './PostFiles';
import { useUploadContentImage } from './use-content-files';
import { useDeletePosts, usePost, useSavePost } from './use-posts';
import type { SavePostVariables } from './use-posts';
import styles from './post.module.scss';

dayjs.extend(customParseFormat);

// Register / Edit popup of a content board (v0.8 VPA070100P01 – VPA070800P01):
// label | field grid (status rows, title, content, Provide English, title / content EN),
// "Attachments  Total n" block, footer [Delete] … [Cancel] [Register | Edit].
// Which rows appear is decided by the board config.

interface PostModalProps {
  config: BoardConfig;
  /** null = register a new post. */
  pstNo: string | null;
  canWrite: boolean;
  categoryOptions: CategoryOption[];
  categoryLabel: string;
  legalOptions?: LegalOptions;
  onClose: () => void;
}

interface FormState {
  category: string;
  published: YesNo;
  pinned: YesNo;
  pinOrder: number | null;
  title: string;
  english: boolean;
  titleEn: string;
  content: string;
  contentEn: string;
  summary: string;
  tag: string;
  name: string;
  email: string;
  phone: string;
  // Legal documents
  lawGroup: string;
  lawField: string;
  issuingAuthority: string;
  docNumber: string;
  issueDate: Dayjs | null;
  attachmentFileId?: string;
  attachments: ContentFile[];
  thumbnailFileId?: string;
  imageFileId?: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const PUBLISH_OPTIONS = [
  { value: 'Y', label: 'Published' },
  { value: 'N', label: 'Unpublished' },
];
const YES_NO = [
  { value: 'Y', label: 'Y' },
  { value: 'N', label: 'N' },
];

/** Content placeholders of the v0.8 popups that differ from "Enter the content.". */
const CONTENT_PLACEHOLDER: Record<string, string> = {
  notice: 'Enter the notice content.',
  news: 'Enter the news content.',
};

function emptyForm(category: string): FormState {
  return {
    category,
    published: 'N',
    pinned: 'N',
    pinOrder: null,
    title: '',
    english: false,
    titleEn: '',
    content: '',
    contentEn: '',
    summary: '',
    tag: '',
    name: '',
    email: '',
    phone: '',
    lawGroup: '',
    lawField: '',
    issuingAuthority: '',
    docNumber: '',
    issueDate: null,
    attachments: [],
  };
}

function toForm(detail: PostDetail): FormState {
  return {
    category: detail.category ?? '',
    published: detail.published === 'Y' ? 'Y' : 'N',
    pinned: detail.pinned === 'Y' ? 'Y' : 'N',
    pinOrder: detail.pinOrder ?? null,
    title: detail.title ?? '',
    // Design: checked on edit when Title (EN) exists.
    english: !!detail.titleEn,
    titleEn: detail.titleEn ?? '',
    content: detail.content ?? '',
    contentEn: detail.contentEn ?? '',
    summary: detail.summary ?? '',
    tag: detail.tag ?? '',
    name: detail.name ?? '',
    email: detail.email ?? '',
    phone: detail.phone ?? '',
    lawGroup: detail.lawGroup ?? '',
    lawField: detail.lawField ?? '',
    issuingAuthority: detail.issuingAuthority ?? '',
    docNumber: detail.docNumber ?? '',
    issueDate: detail.issueDate ? dayjs(detail.issueDate, 'DDMMYYYY') : null,
    attachmentFileId: detail.attachmentFileId ?? detail.attachments?.[0]?.fileUnqId,
    attachments: detail.attachments ?? [],
    thumbnailFileId: detail.thumbnailFileId,
    imageFileId: detail.imageFileId,
  };
}

/** Request body of create / update — the backend ignores keys a board does not know. */
function buildBody(config: BoardConfig, form: FormState, isCreate: boolean): Record<string, unknown> {
  const text = (value: string) => value.trim() || undefined;
  // Unchecked "Provide English" (or a board without it) saves no English text (design C02).
  const english = config.noEnglish ? true : form.english;
  const body: Record<string, unknown> = {
    title: form.title.trim(),
    content: form.content,
    titleEn: english ? text(form.titleEn) : undefined,
    contentEn: english ? form.contentEn || undefined : undefined,
    attachmentFileId: form.attachments.length > 0 ? form.attachmentFileId : undefined,
    published: form.published,
  };
  if (config.category.kind !== 'none' || config.legal) {
    body[config.categoryKey ?? 'category'] = form.category;
  }
  if (config.pin) {
    body.pinned = form.pinned;
    body.pinOrder = form.pinned === 'Y' ? form.pinOrder : undefined;
  }
  if (config.summary) body.summary = text(form.summary);
  if (config.thumbnail) body.thumbnailFileId = form.thumbnailFileId;
  if (config.image) body.imageFileId = form.imageFileId;
  if (config.tag && (isCreate || !config.tag.createOnly)) body[config.tag.requestKey] = text(form.tag);
  if (config.person) {
    body.name = text(form.name);
    body.email = text(form.email);
    body.phone = text(form.phone);
  }
  if (config.legal) {
    body.group = form.lawGroup || undefined;
    body.field = form.lawField || undefined;
    body.issuingAuthority = form.issuingAuthority || undefined;
    body.docNumber = form.docNumber.trim();
    body.issueDate = form.issueDate?.format(API_DATE_DMY);
    body.signer = text(form.name);
    body.description = text(form.summary);
  }
  return body;
}

/** One grid cell; `full` takes a row of its own. */
interface Cell {
  key: string;
  full?: boolean;
  node: (span: 1 | 'full') => ReactNode;
}

/** Pairs the half-width cells two per row; a half cell left alone runs to the end of its row. */
function renderCells(cells: Cell[]): ReactNode[] {
  const out: ReactNode[] = [];
  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    if (cell.full) {
      out.push(<Fragment key={cell.key}>{cell.node('full')}</Fragment>);
      continue;
    }
    const next = cells[i + 1];
    if (next && !next.full) {
      out.push(<Fragment key={cell.key}>{cell.node(1)}</Fragment>);
      out.push(<Fragment key={next.key}>{next.node(1)}</Fragment>);
      i += 1;
    } else {
      out.push(<Fragment key={cell.key}>{cell.node('full')}</Fragment>);
    }
  }
  return out;
}

export default function PostModal({
  config,
  pstNo,
  canWrite,
  categoryOptions,
  categoryLabel,
  legalOptions,
  onClose,
}: PostModalProps) {
  const { t } = useTranslation();
  const isCreate = pstNo === null;
  const { toast } = useNotify();
  const dialogs = useSysDialogs();
  const { category } = config;

  const { data: detail, isFetching } = usePost(config, pstNo);
  const savePost = useSavePost(config);
  const deletePosts = useDeletePosts(config);
  const uploadImage = useUploadContentImage(config.fileBoard);

  // Legal documents start on the "Select document type" placeholder (design); other selects on their first option.
  const defaultCategory =
    category.kind === 'fixed' ? category.value : config.legal ? '' : (categoryOptions[0]?.value ?? '');
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultCategory));
  const [errors, setErrors] = useState<FieldErrors>({});

  // Fill the form when the detail arrives — adjusted during render, not in an effect.
  const [loadedDetail, setLoadedDetail] = useState<PostDetail | undefined>(undefined);
  if (detail && detail !== loadedDetail) {
    setLoadedDetail(detail);
    setForm(toForm(detail));
  }

  // Options may arrive after the popup opened — give a new post its first category then.
  const [appliedDefaultCategory, setAppliedDefaultCategory] = useState(defaultCategory);
  if (defaultCategory !== appliedDefaultCategory) {
    setAppliedDefaultCategory(defaultCategory);
    if (isCreate && defaultCategory && !form.category) setForm({ ...form, category: defaultCategory });
  }

  /** Updates fields and clears their E01 message. */
  const patch = (values: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...values }));
    setErrors((prev) => {
      const next = { ...prev };
      (Object.keys(values) as (keyof FormState)[]).forEach((key) => delete next[key]);
      return next;
    });
  };

  // Boards locked while published only accept a status change until posting is stopped.
  const contentLocked = !isCreate && detail?.contentEditable === false;
  const statusDisabled = !canWrite;
  const fieldsDisabled = !canWrite || contentLocked;
  const showCategorySelect = (categoryOptions.length > 0 || !!config.legal) && category.kind !== 'fixed';
  // The category of a saved post can only change where the board has a status endpoint.
  const categoryDisabled = statusDisabled || (!isCreate && config.statusMode !== 'endpoint' && !config.legal);
  const tagEditable = !!config.tag && (isCreate || !config.tag.createOnly);
  const showPin = !!config.pin && !config.hidePin;
  const showEnglish = !config.noEnglish;
  const titleLabel = config.legal ? 'Document Name' : 'Title';

  const required = (field: string) => t('messages.sys.fieldRequired', { label: field });

  const validate = (): FieldErrors => {
    const found: FieldErrors = {};
    if (showCategorySelect && !form.category) found.category = required(categoryLabel);
    if (config.tag?.required && isCreate && config.tag.requestKey === 'sectionKey') {
      if (!/^[A-Z][A-Z0-9_]{1,49}$/.test(form.tag.trim())) {
        found.tag = t('messages.content.post.tagFormat', { label: config.tag.label });
      }
    } else if (config.tag?.required && tagEditable && !form.tag.trim()) {
      found.tag = required(config.tag.label);
    }
    if (config.legal) {
      if (!form.lawGroup) found.lawGroup = required(t('messages.content.post.fields.group'));
      if (!form.lawField) found.lawField = required(t('messages.content.post.fields.field'));
      if (!form.issuingAuthority) found.issuingAuthority = required(t('messages.content.post.fields.issuingAgency'));
      if (!form.docNumber.trim()) found.docNumber = required(t('messages.content.post.fields.docNumber'));
      if (!form.issueDate) found.issueDate = required(t('messages.content.post.fields.issueDate'));
    }
    if (showPin && form.pinned === 'Y' && !form.pinOrder) found.pinOrder = required(t('messages.content.post.fields.pinOrder'));
    if (!form.title.trim()) {
      found.title = required(
        config.legal ? t('messages.content.post.fields.documentName') : t('messages.content.post.fields.title'),
      );
    }
    if (config.contentRequired && !form.content.trim()) found.content = required(t('messages.content.post.fields.content'));
    if (showEnglish && form.english) {
      if (!form.titleEn.trim()) found.titleEn = required(t('messages.content.post.fields.titleEn'));
      if (!form.contentEn.trim()) found.contentEn = required(t('messages.content.post.fields.contentEn'));
    }
    return found;
  };

  const save = async () => {
    let variables: SavePostVariables;
    if (isCreate) {
      variables = { pstNo: null, body: buildBody(config, form, true) };
    } else {
      variables = { pstNo, body: contentLocked ? undefined : buildBody(config, form, false) };
      if (config.statusMode === 'endpoint') {
        variables.status = {
          category: form.category,
          published: form.published,
          ...(config.pin
            ? { pinned: form.pinned, pinOrder: form.pinned === 'Y' ? (form.pinOrder ?? undefined) : undefined }
            : {}),
        };
      } else if (config.statusMode === 'bulk' && detail && detail.published !== form.published) {
        variables.published = form.published;
      }
    }
    try {
      await savePost.mutateAsync(variables);
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.saved);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const handleSubmit = () => {
    if (!contentLocked) {
      const found = validate();
      setErrors(found);
      if (Object.keys(found).length > 0) return;
      // C02: English typed but "Provide English" unchecked.
      if (showEnglish && !form.english && (form.titleEn.trim() || form.contentEn.trim())) {
        dialogs.confirm({
          content: t('messages.content.post.englishDropped'),
          okText: t('messages.dialog.save'),
          onOk: save,
        });
        return;
      }
    }
    save();
  };

  const handleDelete = () => {
    if (!pstNo) return;
    dialogs.confirm({
      content: t('messages.content.post.confirmDelete'),
      okText: SYS_DIALOG_LABELS.delete,
      danger: true,
      onOk: async () => {
        try {
          await deletePosts.mutateAsync([pstNo]);
          toast.success(SYS_MESSAGES.deleted);
          onClose();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const legalSelect = (
    label: string,
    key: 'lawGroup' | 'lawField' | 'issuingAuthority',
    options: LegalOptions['groups'] | undefined,
    placeholder: string,
  ): Cell => ({
    key,
    node: (span) => (
      <SysField label={label} required span={span} error={errors[key]}>
        <AppSelect
          className={styles.fullWidth}
          placeholder={placeholder}
          value={form[key] || undefined}
          disabled={fieldsDisabled}
          onChange={(value) => patch({ [key]: String(value ?? '') })}
          options={(options ?? []).map((o) => ({ value: o.code, label: o.name }))}
        />
      </SysField>
    ),
  });

  // ── Status rows (paired two per row) ─────────────────────────────────────
  const publishCell: Cell = {
    key: 'published',
    node: (span) => (
      <SysField label="Publish Status" required span={span}>
        <AppRadio.Group
          value={form.published}
          disabled={statusDisabled}
          onChange={(e) => patch({ published: e.target.value as YesNo })}
          options={PUBLISH_OPTIONS}
        />
      </SysField>
    ),
  };
  const categoryCell: Cell = {
    key: 'category',
    node: (span) => (
      <SysField label={categoryLabel} required span={span} error={errors.category}>
        <AppSelect
          className={styles.fullWidth}
          placeholder={`Select ${categoryLabel.toLowerCase()}`}
          value={form.category || undefined}
          disabled={categoryDisabled}
          onChange={(value) => patch({ category: String(value ?? '') })}
          options={categoryOptions}
        />
      </SysField>
    ),
  };
  const tagCell: Cell = {
    key: 'tag',
    node: (span) => (
      <SysField label={config.tag?.label ?? ''} required={config.tag?.required} span={span} error={errors.tag}>
        <TextInput
          placeholder={
            config.tag?.requestKey === 'docNumber' ? 'Enter the document number.' : `Enter the ${config.tag?.label.toLowerCase() ?? ''}`
          }
          value={form.tag}
          maxLength={config.tag?.requestKey === 'sectionKey' ? 50 : config.tag?.requestKey === 'docNumber' ? 50 : 1000}
          disabled={fieldsDisabled || !tagEditable}
          onChange={(e) =>
            patch({
              tag: config.tag?.requestKey === 'sectionKey' ? e.target.value.toUpperCase() : e.target.value,
            })
          }
        />
      </SysField>
    ),
  };
  const pinCells: Cell[] = [
    {
      key: 'pinned',
      node: (span) => (
        <SysField label="Pin to Top" span={span}>
          <AppSelect
            className={styles.fullWidth}
            value={form.pinned}
            disabled={statusDisabled}
            // Design: the order starts at 1 (top priority) when a post is pinned.
            onChange={(value) => {
              const pinned = value === 'Y' ? 'Y' : 'N';
              patch({ pinned, pinOrder: pinned === 'Y' ? (form.pinOrder ?? 1) : form.pinOrder });
            }}
            options={YES_NO}
          />
        </SysField>
      ),
    },
    {
      key: 'pinOrder',
      node: (span) => (
        <SysField label="Pin to Top Order" span={span} error={errors.pinOrder}>
          <Spinbox
            className={styles.fullWidth}
            value={form.pinned === 'Y' ? form.pinOrder : 1}
            min={1}
            max={5}
            precision={0}
            disabled={statusDisabled || form.pinned !== 'Y'}
            onChange={(pinOrder) => patch({ pinOrder })}
          />
        </SysField>
      ),
    },
  ];
  const thumbnailCell: Cell = {
    key: 'thumbnail',
    node: (span) => (
      <SysField label="Thumbnail" span={span}>
        <ThumbnailField
          board={config.fileBoard}
          upload={uploadImage.mutateAsync}
          fileUnqId={form.thumbnailFileId}
          disabled={fieldsDisabled}
          onChange={(thumbnailFileId) => patch({ thumbnailFileId })}
        />
      </SysField>
    ),
  };

  const cells: Cell[] = [];
  if (config.legal) {
    cells.push(publishCell, categoryCell);
    cells.push(legalSelect('Group', 'lawGroup', legalOptions?.groups, 'Select group'));
    cells.push(legalSelect('Field', 'lawField', legalOptions?.fields, 'Select field'));
    cells.push(legalSelect('Issuing Agency', 'issuingAuthority', legalOptions?.issuingAuthorities, 'Select issuing agency'));
    cells.push({
      key: 'docNumber',
      node: (span) => (
        <SysField label="Number/Symbol" required span={span} error={errors.docNumber}>
          <TextInput
            placeholder="Enter the number/symbol."
            value={form.docNumber}
            maxLength={50}
            disabled={fieldsDisabled}
            onChange={(e) => patch({ docNumber: e.target.value })}
          />
        </SysField>
      ),
    });
    cells.push({
      key: 'issueDate',
      node: (span) => (
        <SysField label="Issue Date" required span={span} error={errors.issueDate}>
          <AppDatePicker
            className={styles.fullWidth}
            format={SYS_DATE_FORMAT}
            placeholder="DD-MM-YYYY"
            value={form.issueDate}
            disabled={fieldsDisabled}
            onChange={(issueDate) => patch({ issueDate })}
          />
        </SysField>
      ),
    });
    cells.push({
      key: 'signer',
      node: (span) => (
        <SysField label="Signer" span={span}>
          <TextInput
            placeholder="Enter the signer."
            value={form.name}
            maxLength={100}
            disabled={fieldsDisabled}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </SysField>
      ),
    });
  } else {
    // Design order: NPL [Publish | Document No.] [Pin | Order]; Notice [Document No. | Pin] [Publish | Order];
    // News [Publish | Thumbnail]; Careers [Publish] [Pin | Order].
    if (config.tag?.first && showPin) {
      cells.push(tagCell, pinCells[0], publishCell, pinCells[1]);
    } else if (showCategorySelect && showPin) {
      cells.push(categoryCell, pinCells[0], publishCell, pinCells[1]);
    } else {
      cells.push(publishCell);
      if (showCategorySelect) cells.push(categoryCell);
      if (config.tag) cells.push(tagCell);
      if (config.thumbnail) cells.push(thumbnailCell);
      if (showPin) {
        // Keep Pin / Order together on one row.
        if (cells.length % 2 === 1) cells[cells.length - 1] = { ...cells[cells.length - 1], full: true };
        cells.push(...pinCells);
      }
    }
    if (showCategorySelect && showPin && config.tag) cells.push(tagCell);
    if (showCategorySelect && showPin && config.thumbnail) cells.push(thumbnailCell);
    if (config.person) {
      (['name', 'email', 'phone'] as const).forEach((key) =>
        cells.push({
          key,
          node: (span) => (
            <SysField label={key === 'name' ? 'Name' : key === 'email' ? 'Email' : 'Phone'} span={span}>
              <TextInput
                value={form[key]}
                maxLength={key === 'name' ? 100 : 256}
                disabled={fieldsDisabled}
                onChange={(e) => patch({ [key]: e.target.value })}
              />
            </SysField>
          ),
        }),
      );
    }
    if (config.image) {
      cells.push({
        key: 'image',
        full: true,
        node: (span) => (
          <SysField label="Image" span={span}>
            <ImageField
              upload={uploadImage.mutateAsync}
              fileUnqId={form.imageFileId}
              disabled={fieldsDisabled}
              onChange={(imageFileId) => patch({ imageFileId })}
            />
          </SysField>
        ),
      });
    }
  }

  // ── Content rows (one per row) ───────────────────────────────────────────
  cells.push({
    key: 'title',
    full: true,
    node: (span) => (
      <SysField label={titleLabel} required span={span} error={errors.title}>
        <TextInput
          placeholder={config.legal ? 'Enter the document name.' : 'Enter the title.'}
          value={form.title}
          maxLength={1000}
          disabled={fieldsDisabled}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </SysField>
    ),
  });
  if (config.summary && !config.hideSummary) {
    cells.push({
      key: 'summary',
      full: true,
      node: (span) => (
        <SysField label="Summary" span={span}>
          <TextArea
            rows={2}
            value={form.summary}
            disabled={fieldsDisabled}
            onChange={(e) => patch({ summary: e.target.value })}
          />
        </SysField>
      ),
    });
  }
  cells.push({
    key: 'content',
    full: true,
    node: (span) => (
      <SysField label="Content" required={config.contentRequired} span={span} error={errors.content}>
        {config.richText ? (
          <RichTextEditor
            value={form.content}
            placeholder={CONTENT_PLACEHOLDER[config.id] ?? 'Enter the content.'}
            disabled={fieldsDisabled}
            invalid={!!errors.content}
            ariaLabel="Content"
            onChange={(content) => patch({ content })}
          />
        ) : (
          <TextArea
            className={styles.editor}
            rows={10}
            placeholder="Enter the content."
            value={form.content}
            disabled={fieldsDisabled}
            onChange={(e) => patch({ content: e.target.value })}
          />
        )}
      </SysField>
    ),
  });
  if (showEnglish) {
    const englishDisabled = fieldsDisabled || !form.english;
    cells.push(
      {
        key: 'english',
        full: true,
        node: (span) => (
          <SysField label="Provide English" span={span}>
            <AppCheckbox
              checked={form.english}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ english: e.target.checked, titleEn: form.titleEn, contentEn: form.contentEn })}
            >
              Provide English
            </AppCheckbox>
          </SysField>
        ),
      },
      {
        key: 'titleEn',
        full: true,
        node: (span) => (
          <SysField label="Title (EN)" required={form.english} span={span} error={errors.titleEn}>
            <TextInput
              placeholder="Enter the title."
              value={form.titleEn}
              maxLength={1000}
              disabled={englishDisabled}
              onChange={(e) => patch({ titleEn: e.target.value })}
            />
          </SysField>
        ),
      },
      {
        key: 'contentEn',
        full: true,
        node: (span) => (
          <SysField label="Content (EN)" required={form.english} span={span} error={errors.contentEn}>
            {config.richText ? (
              <RichTextEditor
                value={form.contentEn}
                placeholder="Enter the content."
                disabled={englishDisabled}
                invalid={!!errors.contentEn}
                ariaLabel="Content (EN)"
                onChange={(contentEn) => patch({ contentEn })}
              />
            ) : (
              <TextArea
                className={styles.editor}
                rows={10}
                placeholder="Enter the content."
                value={form.contentEn}
                disabled={englishDisabled}
                onChange={(e) => patch({ contentEn: e.target.value })}
              />
            )}
          </SysField>
        ),
      },
    );
  }

  const title = `${isCreate ? 'Register' : 'Edit'} ${config.itemName}`;

  return (
    <SysFormModal
      open
      width={1200}
      title={title}
      onCancel={onClose}
      onSubmit={canWrite ? handleSubmit : undefined}
      submitText={isCreate ? 'Register' : 'Edit'}
      submitting={savePost.isPending}
      submitDisabled={isFetching}
      leftActions={
        !isCreate && canWrite ? (
          <SysButton look="danger" disabled={deletePosts.isPending || isFetching} onClick={handleDelete}>
            Delete
          </SysButton>
        ) : undefined
      }
      notice={contentLocked ? t('messages.content.post.contentLockedNotice') : undefined}
    >
      <LoadingSpinner spinning={isFetching}>
        <SysFieldGrid columns={2}>{renderCells(cells)}</SysFieldGrid>
        <AttachmentSection
          board={config.fileBoard}
          fileUnqId={form.attachmentFileId}
          files={form.attachments}
          disabled={fieldsDisabled}
          onChange={(attachmentFileId, attachments) => patch({ attachmentFileId, attachments })}
        />
      </LoadingSpinner>
    </SysFormModal>
  );
}
