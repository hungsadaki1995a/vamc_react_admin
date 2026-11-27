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
import { codeLabel } from '@/lib/i18n/code-label';
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
      title={refund ? t('trade.contract.execution.recordRefund') : t('trade.contract.execution.confirmFee')}
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
      confirmText={t('trade.common.confirm')}
      confirmLoading={action.isPending}
      confirmDisabled={invalid}
    >
      <div className={styles.grid}>
        <div className={styles.cellLabel}>{t('trade.contract.execution.installment')}</div>
        <div className={styles.cellValue}>
          {fee.feeSeq} · {codeLabel('trade.feeTypes', fee.feeSeCd)}
        </div>
        <div className={styles.cellLabel}>{t('trade.contract.execution.amountDue')}</div>
        <div className={styles.cellValue}>
          {formatAmount(fee.fee)} {fee.crncCd ?? ''} · {t('trade.contract.execution.dueOn', { date: formatDmy(fee.feePayTermDmy) })}
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>{refund ? t('trade.contract.execution.refundDate') : t('trade.contract.execution.transferDate')}</span>
          <AppDatePicker format="DD/MM/YYYY" value={date} onChange={(d) => setDate(d)} />
        </div>
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.contract.popup.amount')}</span>
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
      title={sale ? t('trade.contract.popup.saleCompletion') : t('trade.contract.popup.purchaseAgreement')}
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
      confirmText={t('trade.common.save')}
      confirmLoading={action.isPending}
      confirmDisabled={!date || price === null || price <= 0}
    >
      <div className={styles.notice}>
        {sale
          ? t('trade.contract.execution.saleNotice')
          : t('trade.contract.execution.purchaseNotice')}
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.contract.execution.signingDate')}</span>
          <AppDatePicker format="DD/MM/YYYY" value={date} onChange={(d) => setDate(d)} />
        </div>
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.common.actualPrice')}</span>
          <Spinbox className={styles.control} min={0} value={price} formatter={amountFormatter} parser={amountParser} onChange={(v) => setPrice(v ?? null)} />
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t('trade.contract.execution.finalFee')}</span>
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
      title={t('trade.contract.popup.recordDelivery')}
      footerAlign="right"
      onCancel={onClose}
      cancelText={t('messages.dialog.cancel')}
      onConfirm={() =>
        void run(
          () => action.mutateAsync({ ctrtCd: detail.srvcCtrtCd, dlvrCmptnDt: iso(date), dlvrCn: note.trim() || undefined }),
          t('messages.trade.deliveryRecorded'),
        )
      }
      confirmText={t('trade.common.save')}
      confirmLoading={action.isPending}
      confirmDisabled={!date}
    >
      <div className={styles.field}>
        <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.contract.execution.deliveryDate')}</span>
        <AppDatePicker format="DD/MM/YYYY" value={date} onChange={(d) => setDate(d)} />
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t('trade.contract.execution.deliveryNote')}</span>
        <TextArea rows={3} maxLength={1000} showCount value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Popup>
  );
}

/** Annex purposes per kind; labels `trade.contract.execution.annexOptions.<code>`. */
const ANNEX_PURPOSES: Record<'sale' | 'purchase', AnnexPurpose[]> = {
  sale: ['EXTN', 'PRCE', 'POST', 'ETC'],
  purchase: ['EXTN'],
};

/** Annex of the contract (sale EXTN / PRCE / POST / ETC, purchase EXTN); then the draft lifecycle of the annex. */
export function CreateAnnexModal({ kind, detail, onClose, onCreated }: BaseProps & { onCreated: (annexCd: string) => void }) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const action = useCreateAnnex();
  const purposes = ANNEX_PURPOSES[kind === 'sale-brokerage-contracts' ? 'sale' : 'purchase'];
  const options = purposes.map((value) => ({ value, label: codeLabel('trade.contract.execution.annexOptions', value) }));
  const [purpose, setPurpose] = useState<AnnexPurpose>(purposes[0]);
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
      title={t('trade.contract.popup.createAnnex')}
      footerAlign="right"
      onCancel={onClose}
      cancelText={t('messages.dialog.cancel')}
      onConfirm={() => void handleCreate()}
      confirmText={t('trade.common.create')}
      confirmLoading={action.isPending}
      confirmDisabled={missing}
    >
      <div className={styles.field}>
        <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.contract.popup.purpose')}</span>
        <AppRadio.Group value={purpose} onChange={(e) => setPurpose(e.target.value as AnnexPurpose)} options={options} />
      </div>
      {purpose === 'EXTN' && (
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.contract.execution.newEndDate')}</span>
          <AppDatePicker format="DD/MM/YYYY" value={endDate} onChange={(d) => setEndDate(d)} />
          <span className={styles.fileSize}>{t('trade.contract.execution.currentEndDate', { date: formatDmy(detail.ctrtEndDmy) })}</span>
        </div>
      )}
      {purpose === 'PRCE' && (
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.contract.execution.newPrice')}</span>
          <Spinbox className={styles.control} min={0} value={price} formatter={amountFormatter} parser={amountParser} onChange={(v) => setPrice(v ?? null)} />
          <span className={styles.fileSize}>{t('trade.contract.execution.currentPrice', { amount: formatAmount(detail.prpPrc) })}</span>
        </div>
      )}
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t('trade.contract.draft.annexContent')}</span>
        <TextArea rows={3} maxLength={1000} showCount value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
    </Popup>
  );
}

/** Renewal decisions; labels `trade.contract.execution.renewalOptions.<code>`. */
const RENEWAL_DECISIONS: RenewalDecision[] = ['EXTEND_ANNEX', 'NEW_CONTRACT', 'NO_EXTEND'];

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
      title={t('trade.contract.popup.renewalDecision')}
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
      confirmText={t('trade.common.save')}
      confirmLoading={action.isPending}
      confirmDisabled={decision === 'EXTEND_ANNEX' && !endDate}
    >
      <div className={styles.notice}>
        {t('trade.contract.execution.endDateNotice', { date: formatDmy(detail.ctrtEndDmy) })} {t('messages.trade.renewalWindowHint')}
      </div>
      <div className={styles.field}>
        <AppRadio.Group value={decision} onChange={(e) => setDecision(e.target.value as RenewalDecision)} options={RENEWAL_DECISIONS.map((value) => ({ value, label: codeLabel('trade.contract.execution.renewalOptions', value) }))} />
      </div>
      {decision === 'EXTEND_ANNEX' && (
        <div className={styles.field}>
          <span className={`${styles.fieldLabel} ${styles.required}`}>{t('trade.contract.execution.newEndDate')}</span>
          <AppDatePicker format="DD/MM/YYYY" value={endDate} onChange={(d) => setEndDate(d)} />
        </div>
      )}
      {decision === 'NO_EXTEND' && <div className={styles.warning}>{t('messages.trade.noExtendHint')}</div>}
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t('trade.common.note')}</span>
        <TextArea rows={3} maxLength={1000} showCount value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Popup>
  );
}
