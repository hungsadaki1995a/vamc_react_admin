import { useState } from 'react';
import type { CSSProperties } from 'react';
import { DatePicker, Input, InputNumber, Modal, Radio, Select, Spin } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useNotify } from '@/hooks/use-notify';
import type { ContentFile, LegalOptions, PostDetail, YesNo } from '@/api/contents/post-api';
import { FormField } from '@/features/system/_shared/SystemUi';
import { errorMessage, splitDateTime } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import type { BoardConfig, CategoryOption } from './board-config';
import { AttachmentField, ImageField } from './PostFiles';
import { useUploadContentImage } from './use-content-files';
import { usePost, useSavePost } from './use-posts';
import type { SavePostVariables } from './use-posts';

dayjs.extend(customParseFormat);

// Generic Detail / Register / Edit popup of a content board
// (wireframes VPA0023P01 – VPA0034P01). Which rows appear is decided by the board config.

interface PostModalProps {
  config: BoardConfig;
  /** null = register a new post. */
  pstNo: string | null;
  canWrite: boolean;
  categoryOptions: CategoryOption[];
  categoryLabel: string;
  legalOptions?: LegalOptions;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  category: string;
  published: YesNo;
  pinned: YesNo;
  pinOrder: number | null;
  title: string;
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

const DATE_FORMAT = 'DD/MM/YYYY';
const YES_NO = [
  { value: 'Y', label: 'YES' },
  { value: 'N', label: 'NO' },
];

function emptyForm(category: string): FormState {
  return {
    category,
    published: 'N',
    pinned: 'N',
    pinOrder: null,
    title: '',
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
  const body: Record<string, unknown> = {
    title: form.title.trim(),
    content: form.content,
    titleEn: text(form.titleEn),
    contentEn: form.contentEn || undefined,
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
    body.issueDate = form.issueDate?.format(DATE_FORMAT);
    body.signer = text(form.name);
    body.description = text(form.summary);
  }
  return body;
}

export default function PostModal({
  config,
  pstNo,
  canWrite,
  categoryOptions,
  categoryLabel,
  legalOptions,
  onClose,
  onSaved,
}: PostModalProps) {
  const isCreate = pstNo === null;
  const { toast } = useNotify();
  const { category } = config;

  const { data: detail, isFetching } = usePost(config, pstNo);
  const savePost = useSavePost(config);
  const uploadImage = useUploadContentImage(config.fileBoard);

  const defaultCategory = category.kind === 'fixed' ? category.value : (categoryOptions[0]?.value ?? '');
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultCategory));

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

  const patch = (values: Partial<FormState>) => setForm((prev) => ({ ...prev, ...values }));

  // Boards locked while published only accept a status change until posting is stopped.
  const contentLocked = !isCreate && detail?.contentEditable === false;
  const statusDisabled = !canWrite;
  const fieldsDisabled = !canWrite || contentLocked;
  const showCategorySelect = categoryOptions.length > 0 && category.kind !== 'fixed';
  // The category of a saved post can only change where the board has a status endpoint.
  const categoryDisabled = statusDisabled || (!isCreate && config.statusMode !== 'endpoint' && !config.legal);
  const tagEditable = !!config.tag && (isCreate || !config.tag.createOnly);

  const validate = (): string | null => {
    if (showCategorySelect && !form.category) return `Select the ${categoryLabel.toLowerCase()}.`;
    if (!form.title.trim()) return 'Enter the title.';
    if (config.contentRequired && !form.content.trim()) return 'Enter the content.';
    if (config.pin && form.pinned === 'Y' && !form.pinOrder) return 'Enter the top display order (1–5).';
    if (config.tag?.required && isCreate && !/^[A-Z][A-Z0-9_]{1,49}$/.test(form.tag.trim())) {
      return `${config.tag.label} must be uppercase letters, digits or "_" (2–50 characters).`;
    }
    if (config.legal) {
      if (!form.docNumber.trim()) return 'Enter the number/symbol.';
      if (!form.issueDate) return 'Select the issue date.';
    }
    return null;
  };

  const handleConfirm = async () => {
    if (!contentLocked) {
      const invalid = validate();
      if (invalid) {
        toast.warning(invalid);
        return;
      }
    }
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
      toast.success('Saved.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const registered = splitDateTime(detail?.mdfcnDt ?? detail?.crtDt);
  const legalSelect = (
    label: string,
    key: 'lawGroup' | 'lawField' | 'issuingAuthority',
    options: LegalOptions['groups'] | undefined,
  ) => (
    <FormField label={label}>
      <Select
        className={styles.wFull}
        allowClear
        placeholder={`Select ${label.toLowerCase()}`}
        value={form[key] || undefined}
        disabled={fieldsDisabled}
        onChange={(value) => patch({ [key]: value ?? '' })}
        options={(options ?? []).map((o) => ({ value: o.code, label: o.name }))}
      />
    </FormField>
  );

  return (
    <Modal
      open
      width={980}
      centered
      title={
        <span>
          {isCreate ? `Register — ${config.title}` : `Check/Edit — ${config.title}`}
          {contentLocked && (
            <span className={styles.formNotice}>※ Can be edited when in [Stop] status.</span>
          )}
        </span>
      }
      onCancel={onClose}
      maskClosable={false}
      footer={
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnDark}
            disabled={!canWrite || savePost.isPending || isFetching}
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </div>
      }
    >
      <Spin spinning={isFetching}>
        <div className={styles.formGrid} style={{ '--form-cols': 3 } as CSSProperties}>
          {/* ── Status area ─────────────────────────────────────────────── */}
          {showCategorySelect && (
            <FormField label={categoryLabel} required>
              <Select
                className={styles.wFull}
                value={form.category || undefined}
                disabled={categoryDisabled}
                onChange={(value) => patch({ category: value })}
                options={categoryOptions}
              />
            </FormField>
          )}
          <FormField label="Creator">{detail?.crtByNm || detail?.crtBy || '-'}</FormField>
          <FormField label="Registration Date" span={showCategorySelect ? undefined : 'full'}>
            {registered ? `${registered.date} ${registered.time ?? ''}` : '-'}
          </FormField>

          <FormField label="Publication Status" span={config.pin ? undefined : 'full'}>
            <Radio.Group
              value={form.published}
              disabled={statusDisabled}
              onChange={(e) => patch({ published: e.target.value as YesNo })}
              options={[
                { value: 'Y', label: 'Post' },
                { value: 'N', label: 'Stop' },
              ]}
            />
          </FormField>
          {config.pin && (
            <>
              <FormField label="Top Display">
                <Radio.Group
                  value={form.pinned}
                  disabled={statusDisabled}
                  onChange={(e) => patch({ pinned: e.target.value as YesNo })}
                  options={YES_NO}
                />
              </FormField>
              <FormField label="Top Display Order">
                <InputNumber
                  value={form.pinOrder}
                  min={1}
                  max={5}
                  precision={0}
                  disabled={statusDisabled || form.pinned !== 'Y'}
                  onChange={(pinOrder) => patch({ pinOrder })}
                />
              </FormField>
            </>
          )}

          {/* ── Legal document attributes ───────────────────────────────── */}
          {config.legal && (
            <>
              {legalSelect('Group', 'lawGroup', legalOptions?.groups)}
              {legalSelect('Field', 'lawField', legalOptions?.fields)}
              {legalSelect('Issuing Authority', 'issuingAuthority', legalOptions?.issuingAuthorities)}
              <FormField label="Number/Sign" required>
                <Input
                  placeholder="Please enter the number/sign."
                  value={form.docNumber}
                  maxLength={50}
                  disabled={fieldsDisabled}
                  onChange={(e) => patch({ docNumber: e.target.value })}
                />
              </FormField>
              <FormField label="Issue Date" required>
                <DatePicker
                  className={styles.wFull}
                  format={DATE_FORMAT}
                  placeholder="DD/MM/YYYY"
                  value={form.issueDate}
                  disabled={fieldsDisabled}
                  onChange={(issueDate) => patch({ issueDate })}
                />
              </FormField>
              <FormField label="Signer">
                <Input
                  placeholder="Please enter the signer."
                  value={form.name}
                  maxLength={100}
                  disabled={fieldsDisabled}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </FormField>
            </>
          )}

          {/* ── Board-specific attributes ───────────────────────────────── */}
          {config.tag && !config.legal && (
            <FormField label={config.tag.label} required={config.tag.required} span={config.person ? undefined : 'full'}>
              <Input
                value={form.tag}
                maxLength={config.tag.requestKey === 'sectionKey' ? 50 : 1000}
                disabled={fieldsDisabled || !tagEditable}
                onChange={(e) =>
                  patch({
                    tag: config.tag?.requestKey === 'sectionKey' ? e.target.value.toUpperCase() : e.target.value,
                  })
                }
              />
            </FormField>
          )}
          {config.person && (
            <>
              <FormField label="Name" span="full">
                <Input
                  value={form.name}
                  maxLength={100}
                  disabled={fieldsDisabled}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </FormField>
              <FormField label="Email">
                <Input
                  value={form.email}
                  maxLength={256}
                  disabled={fieldsDisabled}
                  onChange={(e) => patch({ email: e.target.value })}
                />
              </FormField>
              <FormField label="Phone" span="full">
                <Input
                  value={form.phone}
                  maxLength={256}
                  disabled={fieldsDisabled}
                  onChange={(e) => patch({ phone: e.target.value })}
                />
              </FormField>
            </>
          )}

          {/* ── Content area ────────────────────────────────────────────── */}
          <FormField label="Title" required span="full">
            <Input
              placeholder="Please enter the title."
              value={form.title}
              maxLength={1000}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </FormField>
          <FormField label="Title (EN)" span="full">
            <Input
              value={form.titleEn}
              maxLength={1000}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ titleEn: e.target.value })}
            />
          </FormField>
          {(config.summary || config.legal) && (
            <FormField label={config.legal ? 'Description' : 'Summary'} span="full">
              <Input.TextArea
                rows={2}
                value={form.summary}
                disabled={fieldsDisabled}
                onChange={(e) => patch({ summary: e.target.value })}
              />
            </FormField>
          )}
          {config.thumbnail && (
            <FormField label="Thumbnail" span="full">
              <ImageField
                upload={uploadImage.mutateAsync}
                fileUnqId={form.thumbnailFileId}
                disabled={fieldsDisabled}
                onChange={(thumbnailFileId) => patch({ thumbnailFileId })}
              />
            </FormField>
          )}
          {config.image && (
            <FormField label="Image" span="full">
              <ImageField
                upload={uploadImage.mutateAsync}
                fileUnqId={form.imageFileId}
                disabled={fieldsDisabled}
                onChange={(imageFileId) => patch({ imageFileId })}
              />
            </FormField>
          )}
          <FormField label="Attached Files" span="full">
            <AttachmentField
              board={config.fileBoard}
              fileUnqId={form.attachmentFileId}
              files={form.attachments}
              disabled={fieldsDisabled}
              onChange={(attachmentFileId, attachments) => patch({ attachmentFileId, attachments })}
            />
          </FormField>
          <FormField label="Content" required={config.contentRequired} span="full">
            <Input.TextArea
              rows={9}
              placeholder="Please enter the content."
              value={form.content}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ content: e.target.value })}
            />
          </FormField>
          <FormField label="Content (EN)" span="full">
            <Input.TextArea
              rows={5}
              value={form.contentEn}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ contentEn: e.target.value })}
            />
          </FormField>
        </div>
      </Spin>
    </Modal>
  );
}
