import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Dayjs } from 'dayjs';
import ActionButton from '@/components/common/actions/ActionButton';
import AppCheckbox from '@/components/inputs/AppCheckbox';
import AppDatePicker from '@/components/inputs/AppDatePicker';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import Spinbox from '@/components/inputs/Spinbox';
import TextArea from '@/components/inputs/TextArea';
import { useNotify } from '@/hooks/use-notify';
import type { TradeAppKind, TradeContractDetail, TradeContractKind } from '@/api/trade/trade-api';
import type { FeeMethod, UpdateContractDraftRequest } from '@/api/trade/trade-contract-api';
import { dmyToDayjs, formatDmy } from '@/utils/date-format';
import { errorMessage, formatAmount } from '@/utils/system-utils';
import { FEE_METHOD_LABELS } from './contract-actions';
import { useUpdateContractDraft } from './use-trade-contract-actions';
import styles from './trade-application-popup.module.scss';

// Contract terms (K2 "check type, check draft, complete entries", PREPR, officer). Sale (flow contract step 2):
// end date = start + 1 year by default (editable), or open-ended until the trade ends; fee ① full after signing
// (LUMP), ② full after the sale (AFTR), ③ advance + balance (STAG, advance rate entered by the officer).
// Purchase / consulting: end date optional, fee LUMP or STAG. Annexes: annex content, fee terms optional.

const FEE_METHODS: Record<TradeAppKind, FeeMethod[]> = {
  sale: ['LUMP', 'AFTR', 'STAG'],
  purchase: ['STAG', 'LUMP'],
  consulting: ['STAG', 'LUMP'],
};

const PRICE_LABELS: Record<TradeAppKind, string> = { sale: 'Desired Sale Price', purchase: 'Proposed Purchase Price', consulting: 'Consulting Fee' };

export interface ContractDraftFormProps {
  kind: TradeAppKind;
  contractKind: TradeContractKind;
  detail: TradeContractDetail;
  isAnnex: boolean;
  editable: boolean;
}

const amountFormatter = (v?: number | string) => (v === undefined || v === null || v === '' ? '' : formatAmount(Number(v)));
const amountParser = (v?: string) => Number((v ?? '').replace(/,/g, ''));

export default function ContractDraftForm({ kind, contractKind, detail, isAnnex, editable }: ContractDraftFormProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const save = useUpdateContractDraft();
  const saleMain = kind === 'sale' && !isAnnex;

  const [start, setStart] = useState<Dayjs | null>(dmyToDayjs(detail.ctrtBgngDmy));
  const [end, setEnd] = useState<Dayjs | null>(dmyToDayjs(detail.ctrtEndDmy));
  const [openEnded, setOpenEnded] = useState(saleMain && !!detail.ctrtBgngDmy && !detail.ctrtEndDmy);
  const [crncCd, setCrncCd] = useState<'VND' | 'USD'>((detail.crncCd as 'VND' | 'USD' | undefined) ?? 'VND');
  const [price, setPrice] = useState<number | null>(detail.prpPrc ?? null);
  const [method, setMethod] = useState<FeeMethod | ''>((detail.feeClclnMthCd as FeeMethod | undefined) ?? '');
  const [feeAmt, setFeeAmt] = useState<number | null>(detail.feeAmt ?? null);
  const [rate, setRate] = useState<number | null>(detail.prAmtRt ?? null);
  const [autoTrmn, setAutoTrmn] = useState(detail.autoTrmnYn === 'Y');
  const [anxCn, setAnxCn] = useState(detail.anxCn ?? '');
  const [error, setError] = useState('');

  const advance = method === 'STAG' && feeAmt !== null && rate !== null ? Math.round((feeAmt * rate) / 100) : null;

  if (!editable) {
    return (
      <div className={styles.grid}>
        <div className={styles.cellLabel}>Contract Start</div>
        <div className={styles.cellValue}>{formatDmy(detail.ctrtBgngDmy)}</div>
        <div className={styles.cellLabel}>Contract End</div>
        <div className={styles.cellValue}>{detail.ctrtEndDmy ? formatDmy(detail.ctrtEndDmy) : detail.ctrtBgngDmy && saleMain ? 'Until the trade ends' : '-'}</div>
        <div className={styles.cellLabel}>{PRICE_LABELS[kind]}</div>
        <div className={styles.cellValue}>{detail.prpPrc !== undefined ? `${formatAmount(detail.prpPrc)} ${detail.crncCd ?? ''}` : '-'}</div>
        <div className={styles.cellLabel}>Actual Price</div>
        <div className={styles.cellValue}>{detail.rltrPrc !== undefined ? formatAmount(detail.rltrPrc) : '-'}</div>
        <div className={styles.cellLabel}>Fee Payment</div>
        <div className={styles.cellValue}>{detail.feeClclnMthCd ? FEE_METHOD_LABELS[detail.feeClclnMthCd as FeeMethod] ?? detail.feeClclnMthCd : '-'}</div>
        <div className={styles.cellLabel}>Fee Amount</div>
        <div className={styles.cellValue}>
          {formatAmount(detail.feeAmt)}
          {detail.prAmtRt !== undefined ? ` (advance ${detail.prAmtRt}%)` : ''}
        </div>
        <div className={styles.cellLabel}>Auto Termination</div>
        <div className={styles.cellValue}>{detail.autoTrmnYn === 'Y' ? 'Yes' : 'No'}</div>
        <div className={styles.cellLabel}>Signed / Concluded</div>
        <div className={styles.cellValue}>{formatDmy(detail.ctrtCnclsDmy)}</div>
        {isAnnex && (
          <>
            <div className={styles.cellLabel}>Annex Content</div>
            <div className={`${styles.cellValue} ${styles.wide}`}>{detail.anxCn || '-'}</div>
          </>
        )}
      </div>
    );
  }

  const handleSave = async () => {
    if (!start) {
      setError(t('messages.trade.startDateRequired'));
      return;
    }
    if (!isAnnex && (!method || feeAmt === null)) {
      setError(t('messages.trade.feeTermsRequired'));
      return;
    }
    if (method === 'STAG' && rate === null) {
      setError(t('messages.trade.advanceRateRequired'));
      return;
    }
    setError('');
    const body: UpdateContractDraftRequest = {
      ctrtBgngDt: start.format('YYYY-MM-DD'),
      ...(openEnded ? { openEndedYn: 'Y' as const } : { ctrtEndDt: end?.format('YYYY-MM-DD') }),
      crncCd,
      prpPrc: price ?? undefined,
      autoTrmnYn: autoTrmn ? 'Y' : 'N',
      ...(isAnnex ? { anxCn: anxCn.trim() || undefined } : {}),
      ...(method ? { feeClclnMthCd: method, feeAmt: feeAmt ?? undefined, prAmtRt: method === 'STAG' ? (rate ?? undefined) : undefined } : {}),
    };
    try {
      const response = await save.mutateAsync({ kind: contractKind, ctrtCd: detail.srvcCtrtCd, body });
      toast.success(response.message || t('messages.trade.saved'));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className={styles.checkForm}>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>Contract Start</span>
          <AppDatePicker
            format="DD/MM/YYYY"
            value={start}
            onChange={(d) => {
              setStart(d);
              // Sale: end = start + 1 year by default (Mẫu 11 Art. 2), still editable.
              if (d && saleMain && !openEnded && !end) setEnd(d.add(1, 'year').subtract(1, 'day'));
            }}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Contract End</span>
          <AppDatePicker format="DD/MM/YYYY" value={openEnded ? null : end} disabled={openEnded} onChange={(d) => setEnd(d)} />
          {saleMain && (
            <AppCheckbox checked={openEnded} onChange={(e) => setOpenEnded(e.target.checked)}>
              Until the trade ends (no end date)
            </AppCheckbox>
          )}
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{PRICE_LABELS[kind]}</span>
        <div className={styles.pickRow}>
          <AppSelect
            className={styles.currency}
            value={crncCd}
            options={[
              { value: 'VND', label: 'VND' },
              { value: 'USD', label: 'USD' },
            ]}
            onChange={(v) => setCrncCd((v as 'VND' | 'USD') ?? 'VND')}
          />
          <Spinbox className={styles.control} min={0} value={price} formatter={amountFormatter} parser={amountParser} onChange={(v) => setPrice(v ?? null)} />
        </div>
      </div>
      <div className={styles.field}>
        <span className={`${styles.fieldLabel} ${isAnnex ? '' : styles.required}`}>Fee Payment</span>
        <AppRadio.Group
          value={method}
          onChange={(e) => setMethod(e.target.value as FeeMethod)}
          options={FEE_METHODS[kind].map((value) => ({ value, label: FEE_METHOD_LABELS[value] }))}
        />
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Fee Amount</span>
          <Spinbox className={styles.control} min={0} value={feeAmt} formatter={amountFormatter} parser={amountParser} onChange={(v) => setFeeAmt(v ?? null)} />
        </div>
        {method === 'STAG' && (
          <div className={styles.field}>
            <span className={`${styles.fieldLabel} ${styles.required}`}>Advance Rate (%)</span>
            <Spinbox className={styles.control} min={0} max={100} value={rate} onChange={(v) => setRate(v ?? null)} />
            <span className={styles.fileSize}>Advance: {advance === null ? '-' : formatAmount(advance)}</span>
          </div>
        )}
      </div>
      <AppCheckbox checked={autoTrmn} onChange={(e) => setAutoTrmn(e.target.checked)}>
        Terminate automatically when the trade ends
      </AppCheckbox>
      {isAnnex && (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Annex Content</span>
          <TextArea rows={3} maxLength={1000} showCount value={anxCn} onChange={(e) => setAnxCn(e.target.value)} />
        </div>
      )}
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.checkActions}>
        <ActionButton intent="primary" appearance="filled" loading={save.isPending} onClick={() => void handleSave()}>
          Save Draft
        </ActionButton>
      </div>
    </div>
  );
}
