import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import AppDatePicker from '@/components/inputs/AppDatePicker';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import Spinbox from '@/components/inputs/Spinbox';
import TextInput from '@/components/inputs/TextInput';
import type { ZaloLimitAction, ZaloLimitMeasure, ZaloLimitMsgType, ZaloLimitPeriod, ZaloLimitScope } from '@/api/system/zalo-limit-api';
import { SysField, SysFieldGrid } from '@/components/common/sys-ui/SysFormUi';
import { SYS_DATE_FORMAT } from '@/config/sys-constants';
import { codeLabel } from '@/lib/i18n/code-label';
import { LIMIT_MSG_TYPES, LIMIT_SCOPES, MAX_LIMIT_VALUE, num, unitText, warnAtValue } from './zalo-limit-constants';
import type { RuleFieldKey, RuleFormState } from './zalo-limit-constants';
import styles from './zalo-limit-management.module.scss';

// Fields of a limit rule: General tab of Rule Details (scope and message type read-only) and the New / Copy popup.

interface ZaloLimitRuleFieldsProps {
  values: RuleFormState;
  onPatch: (key: RuleFieldKey | null, value: Partial<RuleFormState>) => void;
  errors: Partial<Record<RuleFieldKey, string>>;
  /** Scope and message type can be chosen only when creating. */
  isCreate: boolean;
  disabled: boolean;
  /** Rows after Note (Last Modified). */
  children?: ReactNode;
}

export default function ZaloLimitRuleFields({ values, onPatch, errors, isCreate, disabled, children }: ZaloLimitRuleFieldsProps) {
  const { t } = useTranslation();
  const unit = unitText(values.lmtMsrCd);

  return (
    <SysFieldGrid columns={1} labelWidth={126}>
      <SysField label={t('zalo.limits.fields.scope')} required={isCreate} error={errors.lmtScopeCd}>
        {isCreate ? (
          <AppSelect<ZaloLimitScope>
            className={styles.fullWidth}
            value={values.lmtScopeCd}
            aria-label={t('zalo.limits.fields.scope')}
            options={LIMIT_SCOPES.map((code) => ({ value: code, label: codeLabel('zalo.limitScopes', code) }))}
            onChange={(lmtScopeCd) => onPatch('lmtScopeCd', { lmtScopeCd })}
          />
        ) : (
          codeLabel('zalo.limitScopes', values.lmtScopeCd)
        )}
      </SysField>
      <SysField label={t('zalo.limits.fields.msgType')} required={isCreate} error={errors.zaloMsgTypeCd}>
        {isCreate ? (
          <AppSelect<ZaloLimitMsgType>
            className={styles.fullWidth}
            value={values.zaloMsgTypeCd}
            aria-label={t('zalo.limits.fields.msgType')}
            options={LIMIT_MSG_TYPES.map((code) => ({ value: code, label: codeLabel('zalo.limitMsgTypes', code) }))}
            onChange={(zaloMsgTypeCd) => onPatch('zaloMsgTypeCd', { zaloMsgTypeCd })}
          />
        ) : (
          codeLabel('zalo.limitMsgTypes', values.zaloMsgTypeCd)
        )}
      </SysField>
      <SysField label={t('zalo.limits.fields.period')} required>
        <AppRadio.Group
          value={values.lmtPrdCd}
          disabled={disabled}
          aria-label={t('zalo.limits.fields.period')}
          options={(['DAY', 'MONTH'] as ZaloLimitPeriod[]).map((code) => ({ value: code, label: codeLabel('zalo.limitPeriods', code) }))}
          onChange={(e) => onPatch(null, { lmtPrdCd: e.target.value as ZaloLimitPeriod })}
        />
      </SysField>
      <SysField label={t('zalo.limits.fields.measure')} required>
        <AppRadio.Group
          value={values.lmtMsrCd}
          disabled={disabled}
          aria-label={t('zalo.limits.fields.measure')}
          options={(['COUNT', 'COST'] as ZaloLimitMeasure[]).map((code) => ({
            value: code,
            label: codeLabel('zalo.limitMeasures', code),
            // OA messages are free: a budget rule on them means nothing (ZAL024).
            disabled: code === 'COST' && values.zaloMsgTypeCd === 'OA',
          }))}
          onChange={(e) => onPatch('lmtVal', { lmtMsrCd: e.target.value as ZaloLimitMeasure })}
        />
      </SysField>
      <SysField label={t('zalo.limits.fields.limit')} required error={errors.lmtVal}>
        <span className={styles.inlineField}>
          <Spinbox
            className={styles.numberInput}
            value={values.lmtVal}
            min={0}
            max={MAX_LIMIT_VALUE}
            precision={0}
            disabled={disabled}
            aria-label={t('zalo.limits.fields.limit')}
            formatter={(value) => (value === undefined || value === null || String(value) === '' ? '' : num(Number(value)))}
            parser={(text) => Number((text ?? '').replace(/\D/g, '')) || 0}
            onChange={(lmtVal) => onPatch('lmtVal', { lmtVal: lmtVal ?? null })}
          />
          <span className={styles.mutedText}>{unit}</span>
        </span>
      </SysField>
      <SysField label={t('zalo.limits.fields.warnAt')} required error={errors.warnRt}>
        <span className={styles.inlineField}>
          <Spinbox
            className={styles.numberInput}
            value={values.warnRt}
            min={1}
            max={100}
            precision={0}
            disabled={disabled}
            aria-label={t('zalo.limits.fields.warnAt')}
            onChange={(warnRt) => onPatch('warnRt', { warnRt: warnRt ?? null })}
          />
          <span className={styles.mutedText}>{t('zalo.limits.fields.warnAtSuffix', { value: num(warnAtValue(values)), unit })}</span>
        </span>
      </SysField>
      <SysField label={t('zalo.limits.fields.action')} required>
        <AppRadio.Group
          value={values.excdActCd}
          disabled={disabled}
          aria-label={t('zalo.limits.fields.action')}
          options={(['BLOCK', 'WARN'] as ZaloLimitAction[]).map((code) => ({ value: code, label: codeLabel('zalo.limitActions', code) }))}
          onChange={(e) => onPatch(null, { excdActCd: e.target.value as ZaloLimitAction })}
        />
      </SysField>
      <SysField label={t('zalo.limits.fields.effective')} required error={errors.efctBgngDt ?? errors.efctEndDt}>
        <span className={styles.inlineField}>
          <AppDatePicker
            className={styles.dateInput}
            value={values.efctBgngDt}
            format={SYS_DATE_FORMAT}
            placeholder="DD-MM-YYYY"
            allowClear={false}
            disabled={disabled}
            aria-label={t('zalo.limits.fields.effectiveFrom')}
            onChange={(efctBgngDt) => onPatch('efctBgngDt', { efctBgngDt })}
          />
          <span className={styles.mutedText}>~</span>
          <AppDatePicker
            className={styles.dateInput}
            value={values.efctEndDt}
            format={SYS_DATE_FORMAT}
            placeholder={t('zalo.limits.fields.openEnded')}
            disabled={disabled}
            aria-label={t('zalo.limits.fields.effectiveTo')}
            onChange={(efctEndDt) => onPatch('efctEndDt', { efctEndDt })}
          />
        </span>
      </SysField>
      <SysField label={t('zalo.limits.fields.note')} error={errors.lmtExpln}>
        <TextInput
          value={values.lmtExpln}
          maxLength={500}
          disabled={disabled}
          aria-label={t('zalo.limits.fields.note')}
          onChange={(e) => onPatch('lmtExpln', { lmtExpln: e.target.value })}
        />
      </SysField>
      {children}
    </SysFieldGrid>
  );
}
