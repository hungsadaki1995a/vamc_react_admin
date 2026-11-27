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
import type { Fee } from '@/api/system/fee-api';
import { codeLabel } from '@/lib/i18n/code-label';
import { dmyToDayjs, formatDmy } from '@/utils/date-format';
import { errorMessage, formatAmount } from '@/utils/system-utils';
import { useContractFeeItems, useUpdateContractDraft } from './use-trade-contract-actions';
import styles from './trade-application-popup.module.scss';

// Contract terms (K2 "check type, check draft, complete entries", PREPR, officer). Sale (flow contract step 2):
// end date = start + 1 year by default (editable), or open-ended until the trade ends; fee ① full after signing
// (LUMP), ② full after the sale (AFTR), ③ advance + balance (STAG, advance rate entered by the officer).
// Purchase / consulting: end date optional, fee LUMP or STAG. Annexes: annex content, fee terms optional.
// Fee payment labels (sale contract step 13 / Mẫu 11 Art. 3): `trade.feeMethods.<code>`.

const FEE_METHODS: Record<TradeAppKind, FeeMethod[]> = {
  sale: ['LUMP', 'AFTR', 'STAG'],
  purchase: ['STAG', 'LUMP'],
  consulting: ['STAG', 'LUMP'],
};

const PRICE_LABELS = {
  sale: 'trade.common.desiredSalePrice',
  purchase: 'trade.common.proposedPurchasePrice',
  consulting: 'trade.common.consultingFee',
} as const satisfies Record<TradeAppKind, string>;

export interface ContractDraftFormProps {
  kind: TradeAppKind;
  contractKind: TradeContractKind;
  detail: TradeContractDetail;
  isAnnex: boolean;
  editable: boolean;
}

/** Option label of a fee schedule item: name, rate or amount, id. */
function feeItemLabel(item: Fee): string {
  const value = item.rate !== undefined && item.rate !== null ? `${item.rate}%` : item.fee !== undefined ? `${formatAmount(item.fee)} ${item.currency}` : '';
  return [item.name, value].filter(Boolean).join(' · ') + ` (${item.feeId})`;
}

const amountFormatter = (v?: number | string) => (v === undefined || v === null || v === '' ? '' : formatAmount(Number(v)));
const amountParser = (v?: string) => Number((v ?? '').replace(/,/g, ''));

export default function ContractDraftForm({ kind, contractKind, detail, isAnnex, editable }: ContractDraftFormProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const save = useUpdateContractDraft();
  const { data: feeItems = [] } = useContractFeeItems(contractKind, true);
  const saleMain = kind === 'sale' && !isAnnex;

  const [start, setStart] = useState<Dayjs | null>(dmyToDayjs(detail.ctrtBgngDmy));
  const [end, setEnd] = useState<Dayjs | null>(dmyToDayjs(detail.ctrtEndDmy));
  const [openEnded, setOpenEnded] = useState(saleMain && !!detail.ctrtBgngDmy && !detail.ctrtEndDmy);
  const [crncCd, setCrncCd] = useState<'VND' | 'USD'>((detail.crncCd as 'VND' | 'USD' | undefined) ?? 'VND');
  const [price, setPrice] = useState<number | null>(detail.prpPrc ?? null);
  const [method, setMethod] = useState<FeeMethod | ''>((detail.feeClclnMthCd as FeeMethod | undefined) ?? '');
  const [feeAmt, setFeeAmt] = useState<number | null>(detail.feeAmt ?? null);
  const [rate, setRate] = useState<number | null>(detail.prAmtRt ?? null);
  const [feeMngId, setFeeMngId] = useState(detail.feeMngId ?? '');
  const [autoTrmn, setAutoTrmn] = useState(detail.autoTrmnYn === 'Y');
  const [anxCn, setAnxCn] = useState(detail.anxCn ?? '');
  const [error, setError] = useState('');

  const storedFeeItem = feeItems.find((f) => f.feeId === detail.feeMngId);
  const advance = method === 'STAG' && feeAmt !== null && rate !== null ? Math.round((feeAmt * rate) / 100) : null;

  if (!editable) {
    return (
      <div className={styles.grid}>
        <div className={styles.cellLabel}>{t('trade.contract.draft.start')}</div>
        <div className={styles.cellValue}>{formatDmy(detail.ctrtBgngDmy)}</div>
        <div className={styles.cellLabel}>{t('trade.contract.draft.end')}</div>
        <div className={styles.cellValue}>{detail.ctrtEndDmy ? formatDmy(detail.ctrtEndDmy) : detail.ctrtBgngDmy && saleMain ? t('trade.common.noTermEnd') : '-'}</div>
        <div className={styles.cellLabel}>{t(PRICE_LABELS[kind])}</div>
        <div className={styles.cellValue}>{detail.prpPrc !== undefined ? `${formatAmount(detail.prpPrc)} ${detail.crncCd ?? ''}` : '-'}</div>
        <div className={styles.cellLabel}>{t('trade.common.actualPrice')}</div>
        <div className={styles.cellValue}>{detail.rltrPrc !== undefined ? formatAmount(detail.rltrPrc) : '-'}</div>
        <div className={styles.cellLabel}>{t('trade.common.feePayment')}</div>
        <div className={styles.cellValue}>{codeLabel('trade.feeMethods', detail.feeClclnMthCd)}</div>
        <div className={styles.cellLabel}>{t('trade.contract.draft.feeAmount')}</div>
        <div className={styles.cellValue}>
          {formatAmount(detail.feeAmt)}
          {detail.prAmtRt !== undefined ? t('trade.contract.draft.advanceSuffix', { rate: detail.prAmtRt }) : ''}
        </div>
        <div className={styles.cellLabel}>{t('trade.contract.draft.feeItem')}</div>
        <div className={styles.cellValue}>
          {storedFeeItem ? feeItemLabel(storedFeeItem) : detail.feeMngId || '-'}
        </div>
        <div className={styles.cellLabel}>{t('trade.contract.draft.autoTermination')}</div>
        <div className={styles.cellValue}>{detail.autoTrmnYn === 'Y' ? t('trade.common.yes') : t('trade.common.no')}</div>
        <div className={styles.cellLabel}>{t('trade.contract.draft.signedConcluded')}</div>
        <div className={styles.cellValue}>{formatDmy(detail.ctrtCnclsDmy)}</div>
        {isAnnex && (
          <>
            <div className={styles.cellLabel}>{t('trade.contract.draft.annexContent')}</div>
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
      ...(method
        ? {
            feeClclnMthCd: method,
            feeMngId: feeMngId || undefined,
            feeAmt: feeAmt ?? undefined,
            prAmtRt: method === 'STAG' ? (rate ?? undefined) : undefined,
          }
        : {}),
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
          <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.contract.draft.start')}</span>
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
          <span className={styles.fieldLabel}>{t('trade.contract.draft.end')}</span>
          <AppDatePicker format="DD/MM/YYYY" value={openEnded ? null : end} disabled={openEnded} onChange={(d) => setEnd(d)} />
          {saleMain && (
            <AppCheckbox checked={openEnded} onChange={(e) => setOpenEnded(e.target.checked)}>
              {t('trade.contract.draft.openEnded')}
            </AppCheckbox>
          )}
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t(PRICE_LABELS[kind])}</span>
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
        <span className={`${styles.fieldLabel} ${isAnnex ? '' : styles.required}`}>{t('trade.common.feePayment')}</span>
        <AppRadio.Group
          value={method}
          onChange={(e) => setMethod(e.target.value as FeeMethod)}
          options={FEE_METHODS[kind].map((value) => ({ value, label: codeLabel('trade.feeMethods', value) }))}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t('trade.contract.draft.feeItem')}</span>
        <AppSelect
          className={styles.control}
          placeholder={t('trade.contract.draft.feeItemPlaceholder')}
          allowClear
          value={feeMngId || undefined}
          options={[
            ...feeItems.map((item) => ({ value: item.feeId, label: feeItemLabel(item) })),
            // Keep a stored item that is no longer active selectable.
            ...(detail.feeMngId && !storedFeeItem ? [{ value: detail.feeMngId, label: detail.feeMngId }] : []),
          ]}
          onChange={(v) => setFeeMngId(v ? String(v) : '')}
        />
        <span className={styles.fileSize}>{t('messages.trade.feeItemHint')}</span>
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{t('trade.contract.draft.feeAmount')}</span>
          <Spinbox className={styles.control} min={0} value={feeAmt} formatter={amountFormatter} parser={amountParser} onChange={(v) => setFeeAmt(v ?? null)} />
        </div>
        {method === 'STAG' && (
          <div className={styles.field}>
            <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.contract.draft.advanceRate')}</span>
            <Spinbox className={styles.control} min={0} max={100} value={rate} onChange={(v) => setRate(v ?? null)} />
            <span className={styles.fileSize}>{t('trade.contract.draft.advanceAmount', { amount: advance === null ? '-' : formatAmount(advance) })}</span>
          </div>
        )}
      </div>
      <AppCheckbox checked={autoTrmn} onChange={(e) => setAutoTrmn(e.target.checked)}>
        {t('trade.contract.draft.autoTerminate')}
      </AppCheckbox>
      {isAnnex && (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{t('trade.contract.draft.annexContent')}</span>
          <TextArea rows={3} maxLength={1000} showCount value={anxCn} onChange={(e) => setAnxCn(e.target.value)} />
        </div>
      )}
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.checkActions}>
        <ActionButton intent="primary" appearance="filled" loading={save.isPending} onClick={() => void handleSave()}>
          {t('trade.contract.draft.saveDraft')}
        </ActionButton>
      </div>
    </div>
  );
}
