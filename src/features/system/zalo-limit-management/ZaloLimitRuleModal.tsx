import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotify } from '@/hooks/use-notify';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import type { ZaloLimitRule } from '@/api/system/zalo-limit-api';
import { SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { apiErrorCode, errorMessage } from '@/utils/system-utils';
import ZaloLimitRuleFields from './ZaloLimitRuleFields';
import { ruleExplanation, ruleFormErrors, toCreateRequest, toRuleForm } from './zalo-limit-constants';
import type { RuleFieldKey, RuleFormState } from './zalo-limit-constants';
import { useSaveZaloLimitRule } from './use-zalo-limits';
import styles from './zalo-limit-management.module.scss';

// Zalo Sending Limits - [New] / [Copy]: registers a rule; the server assigns the next LMT-### code. Scope and message
// type cannot change afterwards. A copy starts from the source rule, without its exceptions.

interface ZaloLimitRuleModalProps {
  /** Null = blank New. */
  source: ZaloLimitRule | null;
  onClose: () => void;
  onCreated: (lmtCd: string) => void;
}

export default function ZaloLimitRuleModal({ source, onClose, onCreated }: ZaloLimitRuleModalProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const save = useSaveZaloLimitRule();
  const [values, setValues] = useState<RuleFormState>(() => toRuleForm(source));
  const { errors, setError, clearError } = useFieldErrors<RuleFieldKey>();

  const patch = (key: RuleFieldKey | null, value: Partial<RuleFormState>) => {
    setValues((prev) => {
      const next = { ...prev, ...value };
      // OA messages are free: switching to OA turns a budget rule into a message count.
      if (next.zaloMsgTypeCd === 'OA' && next.lmtMsrCd === 'COST') next.lmtMsrCd = 'COUNT';
      return next;
    });
    if (key) clearError(key);
  };

  const handleSubmit = async () => {
    const invalid = Object.entries(ruleFormErrors(values)) as [RuleFieldKey, string][];
    if (invalid.length > 0) {
      invalid.forEach(([key, message]) => setError(key, message));
      return;
    }
    try {
      const response = await save.mutateAsync({ lmtCd: null, request: toCreateRequest(values) });
      toast.success(t('messages.zalo.limits.created', { code: response.data?.lmtCd ?? '' }));
      if (response.data) onCreated(response.data.lmtCd);
      onClose();
    } catch (error) {
      if (apiErrorCode(error) === ZALO_ERRORS.limitRuleInvalid) setError('efctEndDt', errorMessage(error));
      else toast.error(errorMessage(error));
    }
  };

  return (
    <SysFormModal
      open
      width={760}
      title={t(source ? 'zalo.limits.form.copyTitle' : 'zalo.limits.form.registerTitle', { code: source?.lmtCd ?? '' })}
      submitText={t('zalo.common.register')}
      onSubmit={() => void handleSubmit()}
      submitting={save.isPending}
      onCancel={onClose}
      notice={t('zalo.limits.form.notice')}
    >
      <ZaloLimitRuleFields values={values} onPatch={patch} errors={errors} isCreate disabled={false} />
      <p className={styles.explainBox}>{ruleExplanation(values, t('zalo.limits.form.newCode'))}</p>
    </SysFormModal>
  );
}
