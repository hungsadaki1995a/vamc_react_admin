import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import Popup from '@/components/common/popup/Popup';
import AppDatePicker from '@/components/inputs/AppDatePicker';
import AppRadio from '@/components/inputs/AppRadio';
import Spinbox from '@/components/inputs/Spinbox';
import TextArea from '@/components/inputs/TextArea';
import { useNotify } from '@/hooks/use-notify';
import type { TradeContractDetail, TradeContractFee, TradeContractKind } from '@/api/trade/trade-api';
import type { AnnexPurpose, RenewalDecision } from '@/api/trade/trade-contract-api';
import { formatDmy } from '@/utils/date-format';
import { errorMessage, formatAmount } from '@/utils/system-utils';
import {
  useCompleteContractTrade,
  useContractFeeAction,
  useCreateAnnex,
  useDecideRenewal,
  useRecordDelivery,
} from './use-trade-contract-actions';
import styles from './trade-application-popup.module.scss';

// Execution popups of a contract in progress (WP5): fee receipt / refund, sale completion (sale K23), trade
// conclusion + delivery (purchase K22 / K24), annex creation, renewal decision (X2).

const amountFormatter = (v?: number | string) => (v === undefined || v === null || v === '' ? '' : formatAmount(Number(v)));
const amountParser = (v?: string) => Number((v ?? '').replace(/,/g, ''));
const iso = (d: Dayjs | null) => (d ? d.format('YYYY-MM-DD') : '');

interface BaseProps {
  kind: TradeContractKind;
  detail: TradeContractDetail;
  onClose: () => void;
}

function useRun(onClose: () => void) {
  const { toast } = useNotify();
  return async (task: () => Promise<{ message?: string }>, success: string) => {
    try {
      const response = await task();
      toast.success(response.message || success);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
}

/** Fee installment received (`refund` false) or refund paid (`refund` true). The amount must be > 0 in the UI. */
export function FeeReceiptModal({ kind, detail, fee, refund, onClose }: BaseProps & { fee: TradeContractFee; refund: boolean }) {
  const { t } = useTranslation();
  const action = useContractFeeAction();
  const run = useRun(onClose);
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [amount, setAmount] = useState<number | null>(refund ? (fee.rfndAmt ?? fee.rcptAmt ?? fee.fee ?? null) : (fee.fee ?? null));
  const invalid = !date || amount === null || amount <= 0;
  return (
    <Popup
      open
      width={520}
      title={refund ? 'Record Refund' : 'Confirm Fee Payment'}
      footerAlign="right"
      onCancel={onClose}
      cancelText={t('messages.dialog.cancel')}
      onConfirm={() =>
        void run(
          () =>
            action.mutateAsync({
              kind,
              ctrtCd: detail.srvcCtrtCd,
              feeId: fee.feeId,
              refund,
              body: { transferDt: iso(date), amount: amount as number },
            }),
          t(refund ? 'messages.trade.feeRefunded' : 'messages.trade.feeConfirmed'),
        )
      }
      confirmText="Confirm"
      confirmLoading={action.isPending}
      confirmDisabled={invalid}
    >
      <div className={styles.grid}>
        <div className={styles.cellLabel}>Installment</div>
        <div className={styles.cellValue}>
          {fee.feeSeq} · {fee.feeSeCd === 'PRAMT' ? 'Advance' : fee.feeSeCd === 'BALNC' ? 'Balance' : (fee.feeSeCd ?? '-')}
        </div>
        <div className={styles.cellLabel}>Amount Due</div>
        <div className={styles.cellValue}>
          {formatAmount(fee.fee)} {fee.crncCd ?? ''} · due {formatDmy(fee.feePayTermDmy)}
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>{refund ? 'Refund Date' : 'Transfer Date'}</span>
          <AppDatePicker format="DD/MM/YYYY" value={date} onChange={(d) => setDate(d)} />
        </div>
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>Amount</span>
          <Spinbox className={styles.control} value={amount} formatter={amountFormatter} parser={amountParser} onChange={(v) => setAmount(v ?? null)} />
          {amount !== null && amount <= 0 && <div className={styles.error}>{t('messages.trade.amountPositive')}</div>}
        </div>
      </div>
    </Popup>
  );
}

/** Sale completion (sale) or sale-and-purchase agreement (purchase): signing date, actual price, final fee. */
export function TradeCompletionModal({ kind, detail, onClose }: BaseProps) {
  const { t } = useTranslation();
  const action = useCompleteContractTrade();
  const run = useRun(onClose);
  const sale = kind === 'sale-brokerage-contracts';
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [price, setPrice] = useState<number | null>(detail.prpPrc ?? null);
  const [finalFee, setFinalFee] = useState<number | null>(detail.feeAmt ?? null);
  return (
    <Popup
      open
      width={560}
      title={sale ? 'Sale Completion' : 'Sale and Purchase Agreement'}
      footerAlign="right"
      onCancel={onClose}
      cancelText={t('messages.dialog.cancel')}
      onConfirm={() =>
        void run(
          () =>
            action.mutateAsync({
              kind,
              ctrtCd: detail.srvcCtrtCd,
              body: { trdCnclsDt: iso(date), rltrPrc: price as number, finalFeeAmt: finalFee ?? undefined },
            }),
          t(sale ? 'messages.trade.saleCompleted' : 'messages.trade.tradeConcluded'),
        )
      }
      confirmText="Save"
      confirmLoading={action.isPending}
      confirmDisabled={!date || price === null || price <= 0}
    >
      <div className={styles.notice}>
        {sale
          ? 'After the officer confirms the sale agreement and the handover: the NPL becomes Sold and the remaining fee is issued.'
          : 'Signing of the sale and purchase agreement: the remaining fee is issued; the delivery is recorded next.'}
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>Agreement Signing Date</span>
          <AppDatePicker format="DD/MM/YYYY" value={date} onChange={(d) => setDate(d)} />
        </div>
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>Actual Price</span>
          <Spinbox className={styles.control} min={0} value={price} formatter={amountFormatter} parser={amountParser} onChange={(v) => setPrice(v ?? null)} />
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Final Fee (manual, Q5)</span>
        <Spinbox className={styles.control} min={0} value={finalFee} formatter={amountFormatter} parser={amountParser} onChange={(v) => setFinalFee(v ?? null)} />
      </div>
    </Popup>
  );
}

export function DeliveryModal({ detail, onClose }: BaseProps) {
  const { t } = useTranslation();
  const action = useRecordDelivery();
  const run = useRun(onClose);
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [note, setNote] = useState('');
  return (
    <Popup
      open
      width={520}
      title="Record Delivery"
      footerAlign="right"
      onCancel={onClose}
      cancelText={t('messages.dialog.cancel')}
      onConfirm={() =>
        void run(
          () => action.mutateAsync({ ctrtCd: detail.srvcCtrtCd, dlvrCmptnDt: iso(date), dlvrCn: note.trim() || undefined }),
          t('messages.trade.deliveryRecorded'),
        )
      }
      confirmText="Save"
      confirmLoading={action.isPending}
      confirmDisabled={!date}
    >
      <div className={styles.field}>
        <span className={`${styles.fieldLabel} ${styles.required}`}>Delivery Date</span>
        <AppDatePicker format="DD/MM/YYYY" value={date} onChange={(d) => setDate(d)} />
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Delivery Note</span>
        <TextArea rows={3} maxLength={1000} showCount value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Popup>
  );
}

const ANNEX_PURPOSES: Record<'sale' | 'purchase', { value: AnnexPurpose; label: string }[]> = {
  sale: [
    { value: 'EXTN', label: 'Extend the term' },
    { value: 'PRCE', label: 'Change the price' },
    { value: 'POST', label: 'After the sale' },
    { value: 'ETC', label: 'Other' },
  ],
  purchase: [{ value: 'EXTN', label: 'Extend the term' }],
};

/** Annex of the contract (sale EXTN / PRCE / POST / ETC, purchase EXTN); then the draft lifecycle of the annex. */
export function CreateAnnexModal({ kind, detail, onClose, onCreated }: BaseProps & { onCreated: (annexCd: string) => void }) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const action = useCreateAnnex();
  const options = ANNEX_PURPOSES[kind === 'sale-brokerage-contracts' ? 'sale' : 'purchase'];
  const [purpose, setPurpose] = useState<AnnexPurpose>(options[0].value);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const missing = (purpose === 'EXTN' && !endDate) || (purpose === 'PRCE' && (price === null || price <= 0));

  const handleCreate = async () => {
    try {
      const response = await action.mutateAsync({
        kind,
        ctrtCd: detail.srvcCtrtCd,
        body: {
          anxPrpsCd: purpose,
          ...(purpose === 'EXTN' ? { newEndDt: iso(endDate) } : {}),
          ...(purpose === 'PRCE' ? { newPrpPrc: price ?? undefined } : {}),
          anxCn: content.trim() || undefined,
        },
      });
      toast.success(response.message || t('messages.trade.annexCreated'));
      onCreated(response.data?.srvcCtrtCd ?? '');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Popup
      open
      width={560}
      title="Create Annex"
      footerAlign="right"
      onCancel={onClose}
      cancelText={t('messages.dialog.cancel')}
      onConfirm={() => void handleCreate()}
      confirmText="Create"
      confirmLoading={action.isPending}
      confirmDisabled={missing}
    >
      <div className={styles.field}>
        <span className={`${styles.fieldLabel} ${styles.required}`}>Purpose</span>
        <AppRadio.Group value={purpose} onChange={(e) => setPurpose(e.target.value as AnnexPurpose)} options={options} />
      </div>
      {purpose === 'EXTN' && (
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>New End Date</span>
          <AppDatePicker format="DD/MM/YYYY" value={endDate} onChange={(d) => setEndDate(d)} />
          <span className={styles.fileSize}>Current end date: {formatDmy(detail.ctrtEndDmy)}</span>
        </div>
      )}
      {purpose === 'PRCE' && (
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>New Price</span>
          <Spinbox className={styles.control} min={0} value={price} formatter={amountFormatter} parser={amountParser} onChange={(v) => setPrice(v ?? null)} />
          <span className={styles.fileSize}>Current price: {formatAmount(detail.prpPrc)}</span>
        </div>
      )}
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Annex Content</span>
        <TextArea rows={3} maxLength={1000} showCount value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
    </Popup>
  );
}

const RENEWAL_OPTIONS: { value: RenewalDecision; label: string }[] = [
  { value: 'EXTEND_ANNEX', label: 'Extend by annex' },
  { value: 'NEW_CONTRACT', label: 'New contract' },
  { value: 'NO_EXTEND', label: 'Do not extend' },
];

/** X2: decision near the end date (D-30 notice). */
export function RenewalDecisionModal({ kind, detail, onClose }: BaseProps) {
  const { t } = useTranslation();
  const action = useDecideRenewal();
  const run = useRun(onClose);
  const [decision, setDecision] = useState<RenewalDecision>('EXTEND_ANNEX');
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [note, setNote] = useState('');
  return (
    <Popup
      open
      width={560}
      title="Renewal Decision"
      footerAlign="right"
      onCancel={onClose}
      cancelText={t('messages.dialog.cancel')}
      onConfirm={() =>
        void run(
          () =>
            action.mutateAsync({
              kind,
              ctrtCd: detail.srvcCtrtCd,
              decision,
              newEndDt: decision === 'EXTEND_ANNEX' && endDate ? iso(endDate) : undefined,
              note: note.trim() || undefined,
            }),
          t('messages.trade.renewalDecided'),
        )
      }
      confirmText="Save"
      confirmLoading={action.isPending}
      confirmDisabled={decision === 'EXTEND_ANNEX' && !endDate}
    >
      <div className={styles.notice}>
        Contract end date: {formatDmy(detail.ctrtEndDmy)}. {t('messages.trade.renewalWindowHint')}
      </div>
      <div className={styles.field}>
        <AppRadio.Group value={decision} onChange={(e) => setDecision(e.target.value as RenewalDecision)} options={RENEWAL_OPTIONS} />
      </div>
      {decision === 'EXTEND_ANNEX' && (
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>New End Date</span>
          <AppDatePicker format="DD/MM/YYYY" value={endDate} onChange={(d) => setEndDate(d)} />
        </div>
      )}
      {decision === 'NO_EXTEND' && <div className={styles.warning}>{t('messages.trade.noExtendHint')}</div>}
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Note</span>
        <TextArea rows={3} maxLength={1000} showCount value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Popup>
  );
}
