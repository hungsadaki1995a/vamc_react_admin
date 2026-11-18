import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Input, InputNumber, Modal, Radio, Select, Spin } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { useScreenLabel } from '@/hooks/use-screen-label';
import type { Fee, FeeCategory, FeeCurrency, FeeMethod, FeeRequest } from '@/api/system/fee-api';
import { FormField } from '../_shared/system-ui';
import { errorMessage } from '../_shared/system-utils';
import styles from '../_shared/system-page.module.scss';
import { useFee, useSaveFee } from './use-fees';
import type { SaveFeeVariables } from './use-fees';

// Fee Management - Detail / Register / Edit popup (VPA0041P01).
// Policy: an item in use (Y) cannot be modified — save it as N, then reopen to edit.

interface FeeModalProps {
  /** null = register a new item. */
  feeId: string | null;
  canWrite: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  useYn: 'Y' | 'N';
  category: FeeCategory;
  order: number | null;
  name: string;
  method: FeeMethod;
  currency: FeeCurrency;
  fee: number | null;
  rate: number | null;
  minAmount: number | null;
  description: string;
}

const NEW_FORM: FormState = {
  useYn: 'N',
  category: 'ANFE',
  order: null,
  name: '',
  method: 'FXAMT',
  currency: 'VND',
  fee: null,
  rate: null,
  minAmount: null,
  description: '',
};

const CURRENCY_OPTIONS = [
  { value: 'VND', label: 'VND' },
  { value: 'USD', label: 'USD' },
];

function toForm(fee: Fee): FormState {
  return {
    useYn: fee.useYn,
    category: fee.category,
    order: fee.order,
    name: fee.name,
    method: fee.method,
    currency: fee.currency,
    fee: fee.fee ?? null,
    rate: fee.rate ?? null,
    minAmount: fee.minAmount ?? null,
    description: fee.description ?? '',
  };
}

const amountFormatter = (value?: number | string) =>
  value === undefined || value === '' ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const amountParser = (value?: string) => Number((value ?? '').replace(/,/g, ''));

export default function FeeModal({ feeId, canWrite, onClose, onSaved }: FeeModalProps) {
  const isCreate = feeId === null;
  const { toast } = useNotify();
  const { tvt, tvb, tvh, tsm } = useScreenLabel();

  const { data: detail, isFetching } = useFee(feeId);
  const saveFee = useSaveFee();

  const [form, setForm] = useState<FormState>(NEW_FORM);

  // Fill the form when the detail arrives — adjusted during render, not in an effect.
  const [loadedDetail, setLoadedDetail] = useState<Fee | undefined>(undefined);
  if (detail && detail !== loadedDetail) {
    setLoadedDetail(detail);
    setForm(toForm(detail));
  }

  const inUse = !isCreate && detail?.useYn === 'Y';
  const fieldsDisabled = !canWrite || inUse;
  const isRate = form.method === 'TRF';
  const patch = (values: Partial<FormState>) => setForm((prev) => ({ ...prev, ...values }));

  const validate = (): string | null => {
    if (form.order === null) return tsm('orderRequired', 'Enter the display order.');
    if (!form.name.trim()) return tsm('nameRequired', 'Enter the fee item name.');
    if (isRate && !(form.rate && form.rate > 0 && form.rate <= 100)) {
      return tsm('rateRequired', 'Enter a rate greater than 0 and up to 100.');
    }
    if (!isRate && !(form.fee && form.fee > 0)) {
      return tsm('amountRequired', 'Enter a fee amount greater than 0.');
    }
    return null;
  };

  const handleConfirm = async () => {
    let variables: SaveFeeVariables;
    if (inUse) {
      // Only the usage flag can change while the item is in use.
      variables = { feeId, useYn: form.useYn === 'N' ? 'N' : undefined };
    } else {
      const invalid = validate();
      if (invalid) {
        toast.warning(invalid);
        return;
      }
      const request: FeeRequest = {
        category: form.category,
        order: form.order as number,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        method: form.method,
        currency: form.currency,
        fee: isRate ? undefined : (form.fee ?? undefined),
        rate: isRate ? (form.rate ?? undefined) : undefined,
        minAmount: isRate ? (form.minAmount ?? undefined) : undefined,
      };
      variables = { feeId, request, useYn: form.useYn === 'Y' ? 'Y' : undefined };
    }
    try {
      await saveFee.mutateAsync(variables);
      toast.success(tsm('saved', 'Saved.'));
      onSaved();
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Modal
      open
      width={860}
      centered
      title={tvh('feeModal', 'View Fee Information')}
      onCancel={onClose}
      maskClosable={false}
      footer={
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btn} onClick={onClose}>
            {tvb('cancel', 'Cancel')}
          </button>
          <button
            type="button"
            className={styles.btnDark}
            disabled={!canWrite || saveFee.isPending || isFetching}
            onClick={handleConfirm}
          >
            {tvb('confirm', 'Confirm')}
          </button>
        </div>
      }
    >
      <Spin spinning={isFetching}>
        {inUse && (
          <div className={`${styles.formNotice} ${styles.mb8}`}>
            {tvt('inUseNotice', 'An item in use cannot be modified. Save it as N, then reopen to edit.')}
          </div>
        )}
        <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
          <FormField label={tvt('feeId', 'Fee Code')}>
            <Input value={detail?.feeId ?? ''} placeholder={tvt('phFeeId', 'Generated on save')} disabled />
          </FormField>
          <FormField label={tvt('useYn', 'Use')}>
            <Radio.Group
              value={form.useYn}
              disabled={!canWrite}
              onChange={(e) => patch({ useYn: e.target.value as 'Y' | 'N' })}
              options={[
                { value: 'Y', label: 'Y' },
                { value: 'N', label: 'N' },
              ]}
            />
          </FormField>

          <FormField label={tvt('category', 'Fee Category')} required>
            <Radio.Group
              value={form.category}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ category: e.target.value as FeeCategory })}
              options={[
                { value: 'ANFE', label: tvt('catAnnual', 'Annual Fee') },
                { value: 'CNSLT', label: tvt('catConsulting', 'Consulting') },
                { value: 'MDT', label: tvt('catBrokerage', 'Brokerage') },
              ]}
            />
          </FormField>
          <FormField label={tvt('order', 'Display Order')} required>
            <InputNumber
              value={form.order}
              min={1}
              max={99}
              precision={0}
              disabled={fieldsDisabled}
              onChange={(order) => patch({ order })}
            />
          </FormField>

          <FormField label={tvt('name', 'Fee Item Name')} required>
            <Input
              value={form.name}
              maxLength={300}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </FormField>
          <FormField label={tvt('method', 'Imposition Method')} required>
            <Radio.Group
              value={form.method}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ method: e.target.value as FeeMethod })}
              options={[
                { value: 'FXAMT', label: tvt('methodFixed', 'Fixed Amount') },
                { value: 'TRF', label: tvt('methodRate', 'Rate') },
              ]}
            />
            <InputNumber
              className={`${styles.w90} ${styles.noShrink}`}
              value={form.rate}
              min={0}
              max={100}
              suffix="%"
              disabled={fieldsDisabled || !isRate}
              onChange={(rate) => patch({ rate })}
            />
          </FormField>

          <FormField label={tvt('fee', 'Fee Amount')} required={!isRate}>
            <Select
              className={`${styles.w84} ${styles.noShrink}`}
              value={form.currency}
              options={CURRENCY_OPTIONS}
              disabled={fieldsDisabled}
              onChange={(currency) => patch({ currency })}
            />
            <InputNumber
              value={form.fee}
              min={0}
              formatter={amountFormatter}
              parser={amountParser}
              disabled={fieldsDisabled || isRate}
              onChange={(fee) => patch({ fee })}
            />
          </FormField>
          <FormField label={tvt('minAmount', 'Minimum Applicable Amount')}>
            {/* The minimum amount is stored in the fee currency. */}
            <Select className={`${styles.w84} ${styles.noShrink}`} value={form.currency} options={CURRENCY_OPTIONS} disabled />
            <InputNumber
              value={form.minAmount}
              min={0}
              formatter={amountFormatter}
              parser={amountParser}
              disabled={fieldsDisabled || !isRate}
              onChange={(minAmount) => patch({ minAmount })}
            />
          </FormField>

          <FormField label={tvt('description', 'Fee Item Details')} span="full">
            <Input.TextArea
              rows={3}
              value={form.description}
              maxLength={1000}
              disabled={fieldsDisabled}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </FormField>
        </div>
      </Spin>
    </Modal>
  );
}
