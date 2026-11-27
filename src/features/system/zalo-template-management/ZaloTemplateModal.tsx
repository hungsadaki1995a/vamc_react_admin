import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotify } from '@/hooks/use-notify';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import type { ZaloTemplate } from '@/api/system/zalo-api';
import { SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { errorMessage } from '@/utils/system-utils';
import ZaloPhonePreview from './ZaloPhonePreview';
import ZaloTemplateFields from './ZaloTemplateFields';
import { formatErrors, priceText, toFormState, toRequest } from './zalo-template-constants';
import type { TemplateFieldKey, TemplateFormState } from './zalo-template-constants';
import { useLiveZaloPreview, useSaveZaloTemplate } from './use-zalo-templates';
import styles from './zalo-template-management.module.scss';

// Zalo Templates - New / Copy popup: a new template (Copy fills the form from the selected one, code left empty),
// with the Zalo phone preview beside the form. Editing happens in the detail panel.

interface ZaloTemplateModalProps {
  /** Template to copy; null = blank New. */
  source: ZaloTemplate | null;
  onClose: () => void;
  /** Selects the new row in the list. */
  onCreated: (tplCd: string) => void;
}

export default function ZaloTemplateModal({ source, onClose, onCreated }: ZaloTemplateModalProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const save = useSaveZaloTemplate();
  const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<TemplateFieldKey>();
  const [values, setValues] = useState<TemplateFormState>(() => toFormState(source, true));
  const { preview, loading } = useLiveZaloPreview(values.tplCn);

  const patch = (key: TemplateFieldKey, value: Partial<TemplateFormState>) => {
    setValues((prev) => ({ ...prev, ...value }));
    clearError(key);
  };

  const handleSubmit = async () => {
    if (!checkRequired(values, ['tplCd', 'procGrpCd', 'tplNm', 'zaloSndMode', 'tplCn'])) return;
    const invalid = Object.entries(formatErrors(values, true)) as [TemplateFieldKey, string][];
    if (invalid.length > 0) {
      invalid.forEach(([key, message]) => setError(key, message));
      return;
    }
    const tplCd = values.tplCd.trim();
    try {
      await save.mutateAsync({ tplCd: null, request: { ...toRequest(values), tplCd, useYn: 'Y' } });
      toast.success(SYS_MESSAGES.registered);
      onCreated(tplCd);
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

  return (
    <SysFormModal
      width={1180}
      open
      title={source ? t('zalo.templates.form.copyTitle') : t('zalo.templates.form.registerTitle')}
      submitText={t('zalo.common.register')}
      onSubmit={() => void handleSubmit()}
      submitting={save.isPending}
      onCancel={onClose}
    >
      <div className={styles.editorLayout}>
        <ZaloTemplateFields
          values={values}
          onPatch={patch}
          errors={errors}
          isCreate
          disabled={false}
          priceText={priceText(values, null)}
          missingVariables={preview?.missingVariables}
        />
        <aside className={styles.editorPhone}>
          <span className={styles.phoneTitle}>{t('zalo.templates.preview.title')}</span>
          <ZaloPhonePreview mode={values.zaloSndMode} title={values.tplNm} text={preview?.text} loading={loading} />
        </aside>
      </div>
    </SysFormModal>
  );
}
