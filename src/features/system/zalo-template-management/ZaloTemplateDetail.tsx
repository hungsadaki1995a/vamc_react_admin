import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotify } from '@/hooks/use-notify';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import type { ZaloTemplate } from '@/api/system/zalo-api';
import { StatusBadge, SysButton, SysEmpty } from '@/components/common/sys-ui/SysListUi';
import { SysField } from '@/components/common/sys-ui/SysFormUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { errorMessage, formatSysDateTime } from '@/utils/system-utils';
import ZaloChangeHistoryTable from '../_shared/ZaloChangeHistoryTable';
import ZaloDetailPanel from '../_shared/ZaloDetailPanel';
import ZaloPhonePreview from './ZaloPhonePreview';
import ZaloTemplateFields from './ZaloTemplateFields';
import ZaloTestSendModal from './ZaloTestSendModal';
import { formatErrors, isDirty, priceText, toFormState, toRequest } from './zalo-template-constants';
import type { TemplateFieldKey, TemplateFormState } from './zalo-template-constants';
import { useChangeZaloTemplateUse, useLiveZaloPreview, useSaveZaloTemplate, useZaloTemplateHistory } from './use-zalo-templates';
import styles from './zalo-template-management.module.scss';

// Zalo Templates - Template Details beside the list and the Zalo phone preview of the edited content.
// General: edit and [Save], [Activate] / [Deactivate], [Test Send], [Copy] (opens New filled in);
// Change History: field changes, newest first. There is no approval step: a saved change applies on the next send.

type TabKey = 'general' | 'history';

interface ZaloTemplateDetailProps {
  /** Selected row; null while the list is empty. */
  template: ZaloTemplate | null;
  canWrite: boolean;
  onCopy: (template: ZaloTemplate) => void;
  /** Lets the screen ask before leaving unsaved edits. */
  onDirtyChange: (dirty: boolean) => void;
}

export default function ZaloTemplateDetail({ template, canWrite, onCopy, onDirtyChange }: ZaloTemplateDetailProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const [tab, setTab] = useState<TabKey>('general');
  const [testOpen, setTestOpen] = useState(false);
  const [values, setValues] = useState<TemplateFormState>(() => toFormState(template));
  const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<TemplateFieldKey>();
  const { data: history, isFetching: historyLoading } = useZaloTemplateHistory(template?.tplCd ?? null);
  const save = useSaveZaloTemplate();
  const changeUse = useChangeZaloTemplateUse();
  const { preview, loading } = useLiveZaloPreview(values.tplCn);
  const dirty = template !== null && isDirty(values, template);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  if (!template) {
    return (
      <div className={styles.detailLayout}>
        <ZaloDetailPanel title={t('zalo.templates.detail.title')}>
          <SysEmpty>{t('zalo.templates.detail.empty')}</SysEmpty>
        </ZaloDetailPanel>
      </div>
    );
  }

  const active = template.useYn === 'Y';
  const disabled = !canWrite;

  const patch = (key: TemplateFieldKey, value: Partial<TemplateFormState>) => {
    setValues((prev) => ({ ...prev, ...value }));
    clearError(key);
  };

  const handleSave = async () => {
    if (!checkRequired(values, ['tplNm', 'zaloSndMode', 'tplCn'])) return;
    const invalid = Object.entries(formatErrors(values, false)) as [TemplateFieldKey, string][];
    if (invalid.length > 0) {
      invalid.forEach(([key, message]) => setError(key, message));
      return;
    }
    try {
      const response = await save.mutateAsync({ tplCd: template.tplCd, request: { ...toRequest(values), useYn: template.useYn } });
      if (response.data) setValues(toFormState(response.data));
      toast.success(SYS_MESSAGES.updated);
    } catch (error) {
      const handled = applyApiError(error, {
        [ZALO_ERRORS.invalidParamMap]: ['paramMapCn', t('messages.zalo.invalidParamMap')],
        [ZALO_ERRORS.znsTemplateIdRequired]: ['znsTplId', t('messages.zalo.znsTplIdRequired')],
      });
      if (!handled) toast.error(errorMessage(error));
    }
  };

  const handleToggle = async () => {
    try {
      await changeUse.mutateAsync({ tplCd: template.tplCd, useYn: active ? 'N' : 'Y' });
      toast.success(t(active ? 'messages.zalo.deactivated' : 'messages.zalo.activated'));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const modifiedAt = template.mdfcnDt ?? template.crtDt;
  const modifiedBy = template.mdfcnBy ?? template.crtBy;
  const tabs = [
    { key: 'general' as const, label: t('zalo.templates.tabs.general') },
    { key: 'history' as const, label: t('zalo.templates.tabs.history', { count: history?.length ?? 0 }) },
  ];

  return (
    <div className={styles.detailLayout}>
      <ZaloDetailPanel<TabKey>
        title={t('zalo.templates.detail.title')}
        subtitle={template.tplCd}
        badge={
          <StatusBadge tone={active ? 'blue' : 'gray'}>{t(active ? 'zalo.common.active' : 'zalo.common.inactive')}</StatusBadge>
        }
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
        leftActions={
          tab === 'general' &&
          canWrite && (
            <SysButton loading={changeUse.isPending} onClick={() => void handleToggle()}>
              {t(active ? 'zalo.templates.buttons.deactivate' : 'zalo.templates.buttons.activate')}
            </SysButton>
          )
        }
        rightActions={
          tab === 'general' &&
          canWrite && (
            <>
              <SysButton onClick={() => setTestOpen(true)}>{t('zalo.templates.testSend.button')}</SysButton>
              <SysButton onClick={() => onCopy(template)}>{t('zalo.templates.buttons.copy')}</SysButton>
              <SysButton look="navy" loading={save.isPending} disabled={!dirty} onClick={() => void handleSave()}>
                {t('zalo.templates.buttons.save')}
              </SysButton>
            </>
          )
        }
      >
        {tab === 'general' && (
          <ZaloTemplateFields
            values={values}
            onPatch={patch}
            errors={errors}
            isCreate={false}
            disabled={disabled}
            priceText={priceText(values, template)}
            missingVariables={preview?.missingVariables}
          >
            <SysField label={t('zalo.templates.detail.lastModified')}>
              {modifiedAt ? t('zalo.templates.detail.modifiedBy', { at: formatSysDateTime(modifiedAt), by: modifiedBy ?? '-' }) : '-'}
            </SysField>
          </ZaloTemplateFields>
        )}
        {tab === 'history' && (
          <>
            <ZaloChangeHistoryTable rows={history ?? []} loading={historyLoading} />
            <p className={styles.hintText}>{t('zalo.templates.detail.historyNote')}</p>
          </>
        )}
      </ZaloDetailPanel>
      <aside className={styles.editorPhone}>
        <span className={styles.phoneTitle}>
          {t('zalo.templates.preview.title')} <span className={styles.phoneSub}>{t('zalo.templates.preview.sample')}</span>
        </span>
        <ZaloPhonePreview mode={values.zaloSndMode} title={values.tplNm} text={preview?.text} loading={loading} />
      </aside>
      {testOpen && <ZaloTestSendModal tplCd={template.tplCd} onClose={() => setTestOpen(false)} />}
    </div>
  );
}
