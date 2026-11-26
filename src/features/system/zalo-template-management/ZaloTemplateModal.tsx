import { useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { ZALO_ERRORS, ZALO_SAMPLE_VARIABLES } from '@/api/system/zalo-api';
import type { ZaloPreview, ZaloSendMode, ZaloTemplate, ZaloTemplateRequest } from '@/api/system/zalo-api';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormModal, SysFormSection } from '@/components/common/sys-ui/SysFormUi';
import type { YesNo } from '@/config/sys-constants';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { codeLabel } from '@/lib/i18n/code-label';
import { errorMessage } from '@/utils/system-utils';
import { sentMessage } from '../_shared/zalo-messages';
import ZaloPhonePreview from './ZaloPhonePreview';
import { ZALO_PROCESS_GROUPS, ZALO_TPL_CD_PATTERN, isParamMap } from './zalo-template-constants';
import { usePreviewZaloTemplate, useSaveZaloTemplate, useTestSendZaloTemplate, useZaloTemplate } from './use-zalo-templates';
import styles from './zalo-template-management.module.scss';

// Zalo Templates - Register / Edit popup: content with {{variables}}, ZNS parameter map and (edit only) a test send
// of the saved template. A phone mock beside the form shows the message as the recipient sees it in Zalo, rendered
// by the server with sample data and refreshed while typing.

/** Wait after the last keystroke before asking the server for a new preview. */
const PREVIEW_DELAY_MS = 500;

type FieldKey = 'tplCd' | 'procGrpCd' | 'tplNm' | 'zaloSndMode' | 'znsTplId' | 'useYn' | 'tplCn' | 'paramMapCn' | 'phone';

interface TemplateFormState {
  tplCd: string;
  procGrpCd: string;
  tplNm: string;
  zaloSndMode: ZaloSendMode;
  znsTplId: string;
  useYn: YesNo;
  tplCn: string;
  paramMapCn: string;
}

function toState(template: ZaloTemplate | null): TemplateFormState {
  return {
    tplCd: template?.tplCd ?? '',
    procGrpCd: template?.procGrpCd ?? ZALO_PROCESS_GROUPS[0],
    tplNm: template?.tplNm ?? '',
    zaloSndMode: template?.zaloSndMode ?? 'ZNS',
    znsTplId: template?.znsTplId ?? '',
    useYn: template?.useYn ?? 'Y',
    tplCn: template?.tplCn ?? '',
    paramMapCn: template?.paramMapCn ?? '',
  };
}

interface ZaloTemplateModalProps {
  /** null = register. */
  tplCd: string | null;
  canWrite: boolean;
  onClose: () => void;
}

/** Loads the template in edit mode, then mounts the form with it. */
export default function ZaloTemplateModal({ tplCd, canWrite, onClose }: ZaloTemplateModalProps) {
  const { t } = useTranslation();
  const { data: detail, isFetching, isError } = useZaloTemplate(tplCd);

  if (tplCd !== null && !detail) {
    return (
      <SysFormModal width={1280} open title={t('zalo.templates.form.editTitle')} onCancel={onClose}>
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? t('messages.zalo.loadFailed') : null}</div>
        </LoadingSpinner>
      </SysFormModal>
    );
  }

  return <TemplateForm template={detail ?? null} canWrite={canWrite} onClose={onClose} />;
}

function TemplateForm({ template, canWrite, onClose }: { template: ZaloTemplate | null; canWrite: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const isCreate = template === null;
  const { toast } = useNotify();
  const save = useSaveZaloTemplate();
  const preview = usePreviewZaloTemplate();
  const testSend = useTestSendZaloTemplate();
  const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();
  const [values, setValues] = useState<TemplateFormState>(() => toState(template));
  const [phone, setPhone] = useState('');
  const [previewResult, setPreviewResult] = useState<ZaloPreview | null>(null);
  // Caret of the content field, for [Insert Variable].
  const caret = useRef<{ start: number; end: number }>({ start: -1, end: -1 });
  const disabled = !canWrite;
  const isZns = values.zaloSndMode === 'ZNS';

  const patch = (key: FieldKey, value: Partial<TemplateFormState>) => {
    setValues((prev) => ({ ...prev, ...value }));
    clearError(key);
  };

  const trackCaret = (e: SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    caret.current = { start: target.selectionStart ?? target.value.length, end: target.selectionEnd ?? target.value.length };
  };

  const insertVariable = (name: string) => {
    const token = `{{${name}}}`;
    const text = values.tplCn;
    const from = caret.current.start < 0 ? text.length : caret.current.start;
    const to = caret.current.end < 0 ? text.length : caret.current.end;
    caret.current = { start: from + token.length, end: from + token.length };
    patch('tplCn', { tplCn: text.slice(0, from) + token + text.slice(to) });
  };

  const validate = (): boolean => {
    const required: FieldKey[] = ['procGrpCd', 'tplNm', 'zaloSndMode', 'useYn', 'tplCn'];
    if (isCreate) required.unshift('tplCd');
    if (!checkRequired(values, required)) return false;
    let valid = true;
    if (isCreate && !ZALO_TPL_CD_PATTERN.test(values.tplCd.trim())) {
      setError('tplCd', t('messages.zalo.invalidTplCd'));
      valid = false;
    }
    if (!isParamMap(values.paramMapCn)) {
      setError('paramMapCn', t('messages.zalo.invalidParamMap'));
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const request: ZaloTemplateRequest = {
      procGrpCd: values.procGrpCd,
      tplNm: values.tplNm.trim(),
      zaloSndMode: values.zaloSndMode,
      // An empty string clears the stored value on update; OA templates have no ZNS id.
      znsTplId: isZns ? values.znsTplId.trim() : '',
      tplCn: values.tplCn,
      paramMapCn: values.paramMapCn.trim(),
      useYn: values.useYn,
    };
    try {
      if (template === null) {
        await save.mutateAsync({ tplCd: null, request: { ...request, tplCd: values.tplCd.trim() } });
      } else {
        await save.mutateAsync({ tplCd: template.tplCd, request });
      }
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.updated);
      onClose();
    } catch (error) {
      const handled = applyApiError(error, {
        [ZALO_ERRORS.templateDuplicate]: ['tplCd', t('messages.zalo.duplicateTplCd')],
        [ZALO_ERRORS.invalidParamMap]: ['paramMapCn', t('messages.zalo.invalidParamMap')],
        [ZALO_ERRORS.znsTemplateIdRequired]: ['znsTplId', t('messages.zalo.znsTplIdRequired')],
      });
      if (!handled) toast.error(errorMessage(error));
    }
  };

  const handlePreview = async () => {
    if (!checkRequired(values, ['tplCn'])) return;
    try {
      const response = await preview.mutateAsync({ tplCn: values.tplCn });
      setPreviewResult(response.data ?? null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  // Live phone preview: re-render with the server sample data shortly after the content stops changing.
  const previewContent = preview.mutateAsync;
  useEffect(() => {
    const content = values.tplCn;
    if (!content.trim()) return undefined;
    const timer = window.setTimeout(() => {
      previewContent({ tplCn: content })
        .then((response) => setPreviewResult(response.data ?? null))
        .catch(() => undefined);
    }, PREVIEW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [values.tplCn, previewContent]);
  // An empty content shows the empty phone, whatever was rendered before.
  const shownPreview = values.tplCn.trim() ? previewResult : null;

  const handleTestSend = async () => {
    if (!template) return;
    if (!phone.trim()) {
      setError('phone', SYS_MESSAGES.required);
      return;
    }
    try {
      const response = await testSend.mutateAsync({ tplCd: template.tplCd, phone: phone.trim() });
      toast.success(sentMessage(response.data));
    } catch (error) {
      const handled = applyApiError(error, { [ZALO_ERRORS.invalidPhone]: ['phone', t('messages.zalo.invalidPhone')] });
      if (!handled) toast.error(errorMessage(error));
    }
  };

  const processOptions = [
    ...(ZALO_PROCESS_GROUPS as readonly string[]).includes(values.procGrpCd) ? [] : [values.procGrpCd],
    ...ZALO_PROCESS_GROUPS,
  ].map((code) => ({ value: code, label: `${codeLabel('zalo.processes', code)} (${code})` }));

  return (
    <SysFormModal
      width={1280}
      open
      title={isCreate ? t('zalo.templates.form.registerTitle') : t('zalo.templates.form.editTitle')}
      submitText={isCreate ? t('zalo.common.register') : t('zalo.common.edit')}
      onSubmit={canWrite ? handleSubmit : undefined}
      submitting={save.isPending}
      onCancel={onClose}
    >
      <div className={styles.editorLayout}>
        <div className={styles.editorForm}>
          <SysFieldGrid columns={2}>
            <SysField label={t('zalo.templates.form.tplCd')} required={isCreate} error={errors.tplCd} hint={isCreate ? t('zalo.templates.form.tplCdHint') : undefined}>
              <TextInput
                value={values.tplCd}
                maxLength={20}
                placeholder="MBR_JOIN_WELCOME"
                disabled={!isCreate || disabled}
                onChange={(e) => patch('tplCd', { tplCd: e.target.value.toUpperCase() })}
              />
            </SysField>
            <SysField label={t('zalo.templates.form.process')} required error={errors.procGrpCd}>
              <AppSelect<string>
                className={styles.fullWidth}
                value={values.procGrpCd}
                options={processOptions}
                disabled={disabled}
                onChange={(procGrpCd) => patch('procGrpCd', { procGrpCd })}
              />
            </SysField>
            <SysField label={t('zalo.templates.form.tplNm')} required error={errors.tplNm}>
              <TextInput value={values.tplNm} maxLength={255} disabled={disabled} onChange={(e) => patch('tplNm', { tplNm: e.target.value })} />
            </SysField>
            <SysField label={t('zalo.templates.form.use')} required error={errors.useYn}>
              <AppRadio.Group
                value={values.useYn}
                options={[
                  { value: 'Y', label: t('zalo.common.active') },
                  { value: 'N', label: t('zalo.common.inactive') },
                ]}
                disabled={disabled}
                onChange={(e) => patch('useYn', { useYn: e.target.value as YesNo })}
              />
            </SysField>
            <SysField label={t('zalo.templates.form.channel')} required error={errors.zaloSndMode}>
              <AppRadio.Group
                value={values.zaloSndMode}
                options={[
                  { value: 'ZNS', label: t('zalo.channels.ZNS') },
                  { value: 'OA', label: t('zalo.channels.OA') },
                ]}
                disabled={disabled}
                onChange={(e) => {
                  patch('zaloSndMode', { zaloSndMode: e.target.value as ZaloSendMode });
                  clearError('znsTplId');
                }}
              />
            </SysField>
            <SysField label={t('zalo.templates.form.znsTplId')} error={errors.znsTplId} hint={isZns ? t('zalo.templates.form.znsTplIdHint') : undefined}>
              <TextInput
                value={isZns ? values.znsTplId : ''}
                maxLength={100}
                disabled={disabled || !isZns}
                onChange={(e) => patch('znsTplId', { znsTplId: e.target.value })}
              />
            </SysField>
            <SysField label={t('zalo.templates.form.tplCn')} required span="full" error={errors.tplCn}>
              <div className={styles.contentCell}>
                <TextArea
                  value={values.tplCn}
                  rows={4}
                  maxLength={4000}
                  placeholder={t('zalo.templates.form.tplCnPlaceholder', { name: '{{mbrNm}}', otp: '{{otp}}' })}
                  disabled={disabled}
                  onChange={(e) => patch('tplCn', { tplCn: e.target.value })}
                  onSelect={trackCaret}
                  onFocus={trackCaret}
                />
                <div className={styles.variableBar}>
                  <span className={styles.variableLabel}>{t('zalo.templates.form.insertVariable')}</span>
                  {ZALO_SAMPLE_VARIABLES.map((name) => (
                    <SysButton
                      key={name}
                      size="small"
                      disabled={disabled}
                      // Keep the caret in the content field.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertVariable(name)}
                    >
                      {`{{${name}}}`}
                    </SysButton>
                  ))}
                </div>
              </div>
            </SysField>
            <SysField label={t('zalo.templates.form.paramMap')} span="full" error={errors.paramMapCn} hint={t('zalo.templates.form.paramMapHint')}>
              <TextArea
                value={values.paramMapCn}
                rows={2}
                maxLength={4000}
                disabled={disabled}
                onChange={(e) => patch('paramMapCn', { paramMapCn: e.target.value })}
              />
            </SysField>
          </SysFieldGrid>

          {!isCreate && canWrite && (
            <SysFormSection title={t('zalo.templates.testSend.title')}>
              <div className={styles.testSendRow}>
                <TextInput
                  className={styles.phoneInput}
                  value={phone}
                  maxLength={20}
                  placeholder={t('zalo.common.phonePlaceholder')}
                  aria-label={t('zalo.common.phone')}
                  status={errors.phone ? 'error' : undefined}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearError('phone');
                  }}
                />
                <SysButton look="outline" loading={testSend.isPending} onClick={() => void handleTestSend()}>
                  {t('zalo.templates.testSend.button')}
                </SysButton>
              </div>
              {errors.phone && <p className={styles.missingText}>{errors.phone}</p>}
              <p className={styles.hintText}>{t('zalo.templates.testSend.hint')}</p>
            </SysFormSection>
          )}
        </div>
        <aside className={styles.editorPhone}>
          <div className={styles.phoneHeader}>
            <span className={styles.phoneTitle}>{t('zalo.templates.preview.title')}</span>
            <SysButton size="small" loading={preview.isPending} onClick={() => void handlePreview()}>
              {t('zalo.templates.preview.button')}
            </SysButton>
          </div>
          <ZaloPhonePreview
            mode={values.zaloSndMode}
            title={values.tplNm}
            text={shownPreview?.text}
            missingVariables={shownPreview?.missingVariables}
            loading={preview.isPending}
          />
        </aside>
      </div>
    </SysFormModal>
  );
}
