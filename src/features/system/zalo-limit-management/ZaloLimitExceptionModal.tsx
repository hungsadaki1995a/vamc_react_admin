import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import AppDatePicker from '@/components/inputs/AppDatePicker';
import Spinbox from '@/components/inputs/Spinbox';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import type { ZaloLimitException, ZaloLimitRule } from '@/api/system/zalo-limit-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { API_DATE_ISO, SYS_DATE_FORMAT } from '@/config/sys-constants';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { errorMessage } from '@/utils/system-utils';
import { MAX_LIMIT_VALUE, num, unitText } from './zalo-limit-constants';
import { useSaveZaloLimitException } from './use-zalo-limits';
import styles from './zalo-limit-management.module.scss';

// Zalo Sending Limits - Rule Details > Exceptions [Add] / row click: the limit of one account (sender EMP_NO or
// recipient member / employee no.) replaces the rule limit until it expires. Saving the same account replaces it.

type FieldKey = 'trgtId' | 'excpLmtVal' | 'excpRsn';

interface FormState {
  trgtId: string;
  excpLmtVal: number | null;
  expryDt: Dayjs | null;
  excpRsn: string;
}

interface ZaloLimitExceptionModalProps {
  rule: ZaloLimitRule;
  /** Null = Add. */
  exception: ZaloLimitException | null;
  onClose: () => void;
}

export default function ZaloLimitExceptionModal({ rule, exception, onClose }: ZaloLimitExceptionModalProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const save = useSaveZaloLimitException();
  const [values, setValues] = useState<FormState>(() => ({
    trgtId: exception?.trgtId ?? '',
    excpLmtVal: exception?.excpLmtVal ?? null,
    expryDt: exception?.expryDt ? dayjs(exception.expryDt) : null,
    excpRsn: exception?.excpRsn ?? '',
  }));
  const { errors, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();

  const patch = (key: FieldKey | null, value: Partial<FormState>) => {
    setValues((prev) => ({ ...prev, ...value }));
    if (key) clearError(key);
  };

  const handleSubmit = async () => {
    if (!checkRequired(values, ['trgtId', 'excpLmtVal', 'excpRsn'])) return;
    try {
      await save.mutateAsync({
        lmtCd: rule.lmtCd,
        request: {
          trgtId: values.trgtId.trim(),
          excpLmtVal: values.excpLmtVal ?? 0,
          expryDt: values.expryDt ? values.expryDt.format(API_DATE_ISO) : null,
          excpRsn: values.excpRsn.trim(),
        },
      });
      toast.success(SYS_MESSAGES.saved);
      onClose();
    } catch (error) {
      const handled = applyApiError(error, {
        [ZALO_ERRORS.accountNotFound]: ['trgtId', t('messages.zalo.accountNotFound')],
      });
      if (!handled) toast.error(errorMessage(error));
    }
  };

  return (
    <SysFormModal
      open
      width={640}
      title={t(exception ? 'zalo.limits.exceptions.editTitle' : 'zalo.limits.exceptions.addTitle', { code: rule.lmtCd })}
      submitText={t('zalo.limits.buttons.save')}
      onSubmit={() => void handleSubmit()}
      submitting={save.isPending}
      onCancel={onClose}
      notice={t('zalo.limits.exceptions.note')}
    >
      <SysFieldGrid columns={1} labelWidth={140}>
        <SysField label={t('zalo.limits.exceptions.columns.account')} required error={errors.trgtId}>
          <TextInput
            value={values.trgtId}
            maxLength={10}
            disabled={exception !== null}
            aria-label={t('zalo.limits.exceptions.columns.account')}
            placeholder={t(rule.lmtScopeCd === 'SENDER' ? 'zalo.limits.exceptions.senderPlaceholder' : 'zalo.limits.exceptions.recipientPlaceholder')}
            onChange={(e) => patch('trgtId', { trgtId: e.target.value })}
          />
        </SysField>
        <SysField
          label={t('zalo.limits.exceptions.columns.limit')}
          required
          error={errors.excpLmtVal}
          hint={t('zalo.limits.exceptions.limitHint', { limit: num(rule.lmtVal) })}
        >
          <span className={styles.inlineField}>
            <Spinbox
              className={styles.numberInput}
              value={values.excpLmtVal}
              min={0}
              max={MAX_LIMIT_VALUE}
              precision={0}
              aria-label={t('zalo.limits.exceptions.columns.limit')}
              onChange={(excpLmtVal) => patch('excpLmtVal', { excpLmtVal: excpLmtVal ?? null })}
            />
            <span className={styles.mutedText}>{unitText(rule.lmtMsrCd)}</span>
          </span>
        </SysField>
        <SysField label={t('zalo.limits.exceptions.columns.expires')}>
          <AppDatePicker
            className={styles.dateInput}
            value={values.expryDt}
            format={SYS_DATE_FORMAT}
            placeholder={t('zalo.limits.fields.openEnded')}
            aria-label={t('zalo.limits.exceptions.columns.expires')}
            onChange={(expryDt) => patch(null, { expryDt })}
          />
        </SysField>
        <SysField label={t('zalo.limits.exceptions.columns.reason')} required error={errors.excpRsn}>
          <TextInput
            value={values.excpRsn}
            maxLength={500}
            aria-label={t('zalo.limits.exceptions.columns.reason')}
            onChange={(e) => patch('excpRsn', { excpRsn: e.target.value })}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
