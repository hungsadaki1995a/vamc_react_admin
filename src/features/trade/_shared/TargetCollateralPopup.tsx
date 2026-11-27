import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommonCodes } from '@/hooks/use-common-codes';
import type { Dayjs } from 'dayjs';
import Popup from '@/components/common/popup/Popup';
import AppDatePicker from '@/components/inputs/AppDatePicker';
import AppSelect from '@/components/inputs/AppSelect';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import type { CollateralCategory, ConsultingTargetCollateral } from '@/api/trade/trade-api';
import { codeLabel } from '@/lib/i18n/code-label';
import styles from './trade-application-popup.module.scss';

// One collateral typed from a paper consulting application (manual registration, POST only): the same fields as the
// member's web form (CNSLT_TRGT_CLTR_AST). Category, contract number, contract date and characteristics are required.

// Fallback when the common code group CLTR_AST_LCLSF_CD cannot be loaded.
const CATEGORY_CODES: CollateralCategory[] = ['REST', 'PERS', 'FNRT', 'TSBDK'];

type OptionalField = 'lglSttsCn' | 'loanTtmCltrWrthCn' | 'rcntCltrWrthCn' | 'cltrAplcnScpCn' | 'prstCn';

const OPTIONAL_FIELDS = [
  { key: 'lglSttsCn', label: 'trade.targetCollateral.legalStatus' },
  { key: 'loanTtmCltrWrthCn', label: 'trade.targetCollateral.loanValue' },
  { key: 'rcntCltrWrthCn', label: 'trade.targetCollateral.recentValue' },
  { key: 'cltrAplcnScpCn', label: 'trade.targetCollateral.securedScope' },
  { key: 'prstCn', label: 'trade.targetCollateral.currentState' },
] as const satisfies readonly { key: OptionalField; label: string }[];

export interface TargetCollateralPopupProps {
  onSubmit: (collateral: ConsultingTargetCollateral) => void;
  onClose: () => void;
}

export default function TargetCollateralPopup({ onSubmit, onClose }: TargetCollateralPopupProps) {
  const { t } = useTranslation();
  const categoryCodes = useCommonCodes('CLTR_AST_LCLSF_CD');
  const categoryOptions = categoryCodes.length
    ? categoryCodes
    : CATEGORY_CODES.map((value) => ({ value, label: codeLabel('trade.collateralCategories', value) }));
  const [category, setCategory] = useState<CollateralCategory | ''>('');
  const [contractNo, setContractNo] = useState('');
  const [contractDt, setContractDt] = useState<Dayjs | null>(null);
  const [characteristics, setCharacteristics] = useState('');
  const [optional, setOptional] = useState<Partial<Record<OptionalField, string>>>({});
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!category || !contractNo.trim() || !contractDt || !characteristics.trim()) {
      setError(t('messages.trade.collateralFieldsRequired'));
      return;
    }
    const extra = Object.fromEntries(
      OPTIONAL_FIELDS.map(({ key }) => [key, optional[key]?.trim() || undefined]).filter(([, v]) => v !== undefined),
    ) as Partial<Record<OptionalField, string>>;
    onSubmit({
      cltrAstLclsfCd: category,
      cltrCtrtNo: contractNo.trim(),
      ctrtDt: contractDt.format('YYYY-MM-DD'),
      astChrcCn: characteristics.trim(),
      ...extra,
    });
  };

  return (
    <Popup
      open
      width={720}
      title={t('trade.targetCollateral.title')}
      footerAlign="right"
      onCancel={onClose}
      cancelText={t('messages.dialog.cancel')}
      onConfirm={handleConfirm}
      confirmText={t('trade.common.add')}
    >
      <div className={styles.checkForm}>
        <div className={styles.formRow}>
          <div className={styles.field}>
            <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.application.form.category')}</span>
            <AppSelect
              className={styles.control}
              placeholder={t('trade.targetCollateral.categoryPlaceholder')}
              value={category || undefined}
              options={categoryOptions}
              onChange={(v) => setCategory((v as CollateralCategory | undefined) ?? '')}
            />
          </div>
          <div className={styles.field}>
            <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.targetCollateral.contractNo')}</span>
            <TextInput maxLength={25} value={contractNo} onChange={(e) => setContractNo(e.target.value)} />
          </div>
          <div className={styles.field}>
            <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.common.contractDate')}</span>
            <AppDatePicker format="DD/MM/YYYY" value={contractDt} onChange={(d) => setContractDt(d)} />
          </div>
        </div>
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.common.characteristics')}</span>
          <TextArea rows={3} maxLength={1000} showCount value={characteristics} onChange={(e) => setCharacteristics(e.target.value)} />
        </div>
        {OPTIONAL_FIELDS.map(({ key, label }) => (
          <div key={key} className={styles.field}>
            <span className={styles.fieldLabel}>{t(label)}</span>
            <TextInput maxLength={1000} value={optional[key] ?? ''} onChange={(e) => setOptional((prev) => ({ ...prev, [key]: e.target.value }))} />
          </div>
        ))}
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </Popup>
  );
}
