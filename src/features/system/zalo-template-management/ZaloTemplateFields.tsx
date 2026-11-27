import { useRef } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import { ZALO_SAMPLE_VARIABLES } from '@/api/system/zalo-api';
import type { ZaloSendMode, ZaloTemplateMsgType } from '@/api/system/zalo-api';
import type { FieldErrors } from '@/hooks/use-field-errors';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid } from '@/components/common/sys-ui/SysFormUi';
import { codeLabel } from '@/lib/i18n/code-label';
import { ZALO_PROCESS_GROUPS, ZALO_TEMPLATE_MSG_TYPES } from './zalo-template-constants';
import type { TemplateFieldKey, TemplateFormState } from './zalo-template-constants';
import styles from './zalo-template-management.module.scss';

// Fields of a Zalo template, shared by the detail panel (edit) and the New / Copy popup (create): name, channel with
// its price line, message type and ZNS template ID (ZNS only), content with variable chips, parameter map.

interface ZaloTemplateFieldsProps {
  values: TemplateFormState;
  onPatch: (key: TemplateFieldKey, value: Partial<TemplateFormState>) => void;
  errors: FieldErrors<TemplateFieldKey>;
  /** Create: code and process are editable; edit: the process is shown read-only. */
  isCreate: boolean;
  disabled: boolean;
  priceText: string;
  /** Variables of the content without a sample value (server preview). */
  missingVariables?: string[];
  /** Extra rows at the end, e.g. Last Modified. */
  children?: ReactNode;
}

export default function ZaloTemplateFields({
  values,
  onPatch,
  errors,
  isCreate,
  disabled,
  priceText,
  missingVariables = [],
  children,
}: ZaloTemplateFieldsProps) {
  const { t } = useTranslation();
  // Caret of the content field, for [Insert Variable].
  const caret = useRef<{ start: number; end: number }>({ start: -1, end: -1 });
  const isZns = values.zaloSndMode === 'ZNS';

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
    onPatch('tplCn', { tplCn: text.slice(0, from) + token + text.slice(to) });
  };

  const processLabel = (code: string) => `${codeLabel('zalo.processes', code)} (${code})`;
  const processOptions = [
    ...((ZALO_PROCESS_GROUPS as readonly string[]).includes(values.procGrpCd) ? [] : [values.procGrpCd]),
    ...ZALO_PROCESS_GROUPS,
  ].map((code) => ({ value: code, label: processLabel(code) }));
  const msgTypeOptions = ZALO_TEMPLATE_MSG_TYPES.map((code) => ({ value: code, label: codeLabel('zalo.msgTypes', code) }));

  return (
    <SysFieldGrid columns={1} labelWidth={124}>
      {isCreate && (
        <SysField label={t('zalo.templates.form.tplCd')} required error={errors.tplCd} hint={t('zalo.templates.form.tplCdHint')}>
          <TextInput
            value={values.tplCd}
            maxLength={20}
            placeholder="MBR_JOIN_WELCOME"
            aria-label={t('zalo.templates.form.tplCd')}
            disabled={disabled}
            onChange={(e) => onPatch('tplCd', { tplCd: e.target.value.toUpperCase() })}
          />
        </SysField>
      )}
      <SysField label={t('zalo.templates.form.process')} required={isCreate} error={errors.procGrpCd}>
        {isCreate ? (
          <AppSelect<string>
            className={styles.fullWidth}
            value={values.procGrpCd}
            options={processOptions}
            disabled={disabled}
            onChange={(procGrpCd) => onPatch('procGrpCd', { procGrpCd })}
          />
        ) : (
          processLabel(values.procGrpCd)
        )}
      </SysField>
      <SysField label={t('zalo.templates.form.tplNm')} required error={errors.tplNm}>
        <TextInput
          value={values.tplNm}
          maxLength={255}
          aria-label={t('zalo.templates.form.tplNm')}
          disabled={disabled}
          onChange={(e) => onPatch('tplNm', { tplNm: e.target.value })}
        />
      </SysField>
      <SysField label={t('zalo.templates.form.channel')} required error={errors.zaloSndMode}>
        <div className={styles.channelRow}>
          <AppRadio.Group
            value={values.zaloSndMode}
            options={[
              { value: 'ZNS', label: t('zalo.channels.ZNS') },
              { value: 'OA', label: t('zalo.channels.OA') },
            ]}
            disabled={disabled}
            onChange={(e) => onPatch('zaloSndMode', { zaloSndMode: e.target.value as ZaloSendMode })}
          />
          <span className={styles.priceText}>{priceText}</span>
        </div>
      </SysField>
      {isZns && (
        <SysField label={t('zalo.templates.detail.msgType')} error={errors.zaloMsgTypeCd}>
          <AppSelect<ZaloTemplateMsgType>
            className={styles.fullWidth}
            value={values.zaloMsgTypeCd}
            options={msgTypeOptions}
            disabled={disabled}
            aria-label={t('zalo.templates.detail.msgType')}
            onChange={(zaloMsgTypeCd) => onPatch('zaloMsgTypeCd', { zaloMsgTypeCd })}
          />
        </SysField>
      )}
      <SysField
        label={t('zalo.templates.form.znsTplId')}
        error={errors.znsTplId}
        hint={isZns ? t('zalo.templates.form.znsTplIdHint') : undefined}
      >
        {isZns ? (
          <TextInput
            value={values.znsTplId}
            maxLength={100}
            aria-label={t('zalo.templates.form.znsTplId')}
            disabled={disabled}
            onChange={(e) => onPatch('znsTplId', { znsTplId: e.target.value })}
          />
        ) : (
          <span className={styles.mutedText}>{t('zalo.templates.detail.znsIdNotUsed')}</span>
        )}
      </SysField>
      <SysField label={t('zalo.templates.form.tplCn')} required error={errors.tplCn}>
        <div className={styles.contentCell}>
          <TextArea
            value={values.tplCn}
            rows={5}
            maxLength={4000}
            aria-label={t('zalo.templates.form.tplCn')}
            placeholder={t('zalo.templates.form.tplCnPlaceholder', { name: '{{mbrNm}}', otp: '{{otp}}' })}
            disabled={disabled}
            onChange={(e) => onPatch('tplCn', { tplCn: e.target.value })}
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
          {missingVariables.length > 0 && (
            <p className={styles.missingText}>{t('zalo.templates.preview.missing', { names: missingVariables.join(', ') })}</p>
          )}
        </div>
      </SysField>
      <SysField label={t('zalo.templates.form.paramMap')} error={errors.paramMapCn} hint={t('zalo.templates.form.paramMapHint')}>
        <TextArea
          value={values.paramMapCn}
          rows={2}
          maxLength={4000}
          aria-label={t('zalo.templates.form.paramMap')}
          disabled={disabled}
          onChange={(e) => onPatch('paramMapCn', { paramMapCn: e.target.value })}
        />
      </SysField>
      {children}
    </SysFieldGrid>
  );
}
