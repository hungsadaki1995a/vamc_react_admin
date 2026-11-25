import { useState } from 'react';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import Spinbox from '@/components/inputs/Spinbox';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { FEE_ERRORS } from '@/api/system/fee-api';
import type { Fee, FeeCategory, FeeCurrency, FeeMethod, FeeRequest, YesNo } from '@/api/system/fee-api';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { USE_YN_RADIO_OPTIONS } from '@/config/sys-constants';
import { SYS_DIALOG_LABELS, SYS_MESSAGES } from '@/config/sys-messages';
import { errorMessage } from '@/utils/system-utils';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import {
  FEE_CATEGORY_OPTIONS,
  FEE_CURRENCY_OPTIONS,
  FEE_METHOD_OPTIONS,
  amountFormatter,
  amountParser,
  feeCategoryLabel,
  isLegacyFee,
} from './fee-constants';
import { useChangeFeeUse, useDeleteFee, useFee, useSaveFee } from './use-fees';
import styles from './fee-management.module.scss';

// Fee Management - Register / Edit popup (VPA090103P01).
// Saved in one call (Use included); items stay editable while in use.
// A legacy `MDT` item cannot be saved by PUT (FEE004): only Use can be switched, or it can be deleted.

type FieldKey = 'useYn' | 'category' | 'order' | 'name' | 'method' | 'currency' | 'fee' | 'rate' | 'minAmount' | 'description';

interface FeeFormState {
  useYn: YesNo;
  /** FeeCategory, or `MDT` for a legacy row. */
  category: string;
  order: number | null;
  name: string;
  method: FeeMethod;
  currency: FeeCurrency;
  fee: number | null;
  rate: number | null;
  minAmount: number | null;
  description: string;
}

const NEW_FEE: FeeFormState = {
  useYn: 'Y',
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

const FEE_MESSAGES = {
  rateRange: 'Enter a rate greater than 0 and up to 100.',
  positive: 'Enter an amount greater than 0.',
  legacyNotice:
    'This item uses the old Brokerage type, which can no longer be saved. Only Use can be changed; register it again as Purchase Brokerage or Sale Brokerage.',
} as const;

function toState(fee: Fee): FeeFormState {
  return {
    useYn: fee.useYn,
    category: fee.category,
    order: fee.order ?? null,
    name: fee.name ?? '',
    method: fee.method,
    currency: fee.currency,
    fee: fee.fee ?? null,
    rate: fee.rate ?? null,
    minAmount: fee.minAmount ?? null,
    description: fee.description ?? '',
  };
}

interface FeeModalProps {
  /** null = register. */
  feeId: string | null;
  canWrite: boolean;
  onClose: () => void;
}

/** Loads the item in edit mode, then mounts the form with it. */
export default function FeeModal({ feeId, canWrite, onClose }: FeeModalProps) {
  const { data: detail, isFetching, isError } = useFee(feeId);
  const isCreate = feeId === null;

  if (!isCreate && !detail) {
    return (
      <SysFormModal width={1200} open title="Edit Fee Information" onCancel={onClose}>
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? 'The fee item could not be loaded.' : null}</div>
        </LoadingSpinner>
      </SysFormModal>
    );
  }

  return <FeeForm fee={detail ?? null} canWrite={canWrite} onClose={onClose} />;
}

function FeeForm({ fee, canWrite, onClose }: { fee: Fee | null; canWrite: boolean; onClose: () => void }) {
  const isCreate = fee === null;
  const legacy = !isCreate && isLegacyFee(fee.category);
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const saveFee = useSaveFee();
  const changeUse = useChangeFeeUse();
  const deleteFee = useDeleteFee();
  const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();
  const [values, setValues] = useState<FeeFormState>(() => (fee ? toState(fee) : NEW_FEE));

  const isRate = values.method === 'TRF';
  const locked = !canWrite || legacy;

  const patch = (key: FieldKey, value: Partial<FeeFormState>) => {
    setValues((prev) => ({ ...prev, ...value }));
    clearError(key);
  };

  const changeMethod = (method: FeeMethod) => {
    // Fields of the other method are cleared, as the server drops them anyway.
    setValues((prev) => ({ ...prev, method, ...(method === 'TRF' ? { fee: null } : { rate: null, minAmount: null }) }));
    ['method', 'fee', 'rate', 'minAmount'].forEach((key) => clearError(key as FieldKey));
  };

  const validate = (): boolean => {
    const required: FieldKey[] = ['useYn', 'category', 'order', 'name', 'method', 'currency', isRate ? 'rate' : 'fee'];
    if (!checkRequired(values, required)) return false;
    let valid = true;
    if (isRate && !(values.rate !== null && values.rate > 0 && values.rate <= 100)) {
      setError('rate', FEE_MESSAGES.rateRange);
      valid = false;
    }
    if (!isRate && !(values.fee !== null && values.fee > 0)) {
      setError('fee', FEE_MESSAGES.positive);
      valid = false;
    }
    if (isRate && values.minAmount !== null && values.minAmount <= 0) {
      setError('minAmount', FEE_MESSAGES.positive);
      valid = false;
    }
    return valid;
  };

  const saveLegacyUse = async () => {
    if (!fee) return;
    try {
      await changeUse.mutateAsync({ feeId: fee.feeId, useYn: values.useYn });
      toast.success(SYS_MESSAGES.updated);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleSubmit = async () => {
    if (legacy) {
      await saveLegacyUse();
      return;
    }
    if (!validate()) return;
    const request: FeeRequest = {
      useYn: values.useYn,
      category: values.category as FeeCategory,
      order: values.order as number,
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      method: values.method,
      currency: values.currency,
      fee: isRate ? undefined : (values.fee ?? undefined),
      rate: isRate ? (values.rate ?? undefined) : undefined,
      minAmount: isRate ? (values.minAmount ?? undefined) : undefined,
    };
    try {
      await saveFee.mutateAsync({ feeId: fee?.feeId ?? null, request });
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.updated);
      onClose();
    } catch (error) {
      const message = errorMessage(error);
      const handled = applyApiError(error, {
        [FEE_ERRORS.invalid]: ['category', message],
        [FEE_ERRORS.amountRequired]: [isRate ? 'rate' : 'fee', SYS_MESSAGES.required],
      });
      if (!handled) toast.error(message);
    }
  };

  const handleDelete = () => {
    if (!fee) return;
    confirm({
      content: SYS_MESSAGES.confirmDelete('this fee item'),
      okText: SYS_DIALOG_LABELS.delete,
      danger: true,
      onOk: async () => {
        try {
          await deleteFee.mutateAsync(fee.feeId);
          toast.success(SYS_MESSAGES.deleted);
          onClose();
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });
  };

  const categoryOptions = legacy && fee
    ? [{ value: values.category, label: feeCategoryLabel(fee) }, ...FEE_CATEGORY_OPTIONS]
    : FEE_CATEGORY_OPTIONS;

  return (
    <SysFormModal
      width={1200}
      open
      title={isCreate ? 'Register Fee Information' : 'Edit Fee Information'}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={canWrite ? handleSubmit : undefined}
      submitting={saveFee.isPending || changeUse.isPending}
      onCancel={onClose}
      extraActions={
        legacy && canWrite ? (
          <SysButton look="danger" loading={deleteFee.isPending} onClick={handleDelete}>
            Delete
          </SysButton>
        ) : undefined
      }
      notice={legacy ? FEE_MESSAGES.legacyNotice : undefined}
    >
      {/* Frame layout: Fee Code | Type | Order / Use | Method | Currency / Fee Amount | Minimum Amount | Item Name / Item Content */}
      <SysFieldGrid columns={3}>
        <SysField label="Fee Code">
          <TextInput value={fee?.feeId ?? ''} placeholder="Auto-generated" disabled />
        </SysField>
        <SysField label="Type" required error={errors.category}>
          <AppSelect
            className={styles.fullWidth}
            value={values.category}
            options={categoryOptions}
            disabled={locked}
            onChange={(category) => patch('category', { category: String(category ?? '') })}
          />
        </SysField>
        <SysField label="Order" required error={errors.order}>
          <Spinbox
            className={styles.fullWidth}
            value={values.order}
            min={1}
            max={99}
            precision={0}
            disabled={locked}
            onChange={(order) => patch('order', { order })}
          />
        </SysField>
        <SysField label="Use" required error={errors.useYn}>
          <AppRadio.Group
            value={values.useYn}
            options={USE_YN_RADIO_OPTIONS}
            disabled={!canWrite}
            onChange={(e) => patch('useYn', { useYn: e.target.value as YesNo })}
          />
        </SysField>
        <SysField label="Method" required error={errors.method ?? errors.rate}>
          <AppSelect<FeeMethod> className={styles.methodSelect} value={values.method} options={FEE_METHOD_OPTIONS} disabled={locked} onChange={changeMethod} />
          {/* Rate % input, enabled for the Rate method (spec: "Rate : % input"). */}
          <Spinbox
            className={styles.rateInput}
            value={values.rate}
            min={0}
            max={100}
            precision={2}
            suffix="%"
            disabled={locked || !isRate}
            onChange={(rate) => patch('rate', { rate })}
          />
        </SysField>
        <SysField label="Currency" required error={errors.currency}>
          <AppSelect<FeeCurrency>
            className={styles.fullWidth}
            value={values.currency}
            options={FEE_CURRENCY_OPTIONS}
            disabled={locked}
            onChange={(currency) => patch('currency', { currency })}
          />
        </SysField>
        <SysField label="Fee Amount" required={!isRate} error={errors.fee}>
          <Spinbox
            className={`${styles.fullWidth} ${styles.amountInput}`}
            value={values.fee}
            min={0}
            placeholder="0"
            formatter={amountFormatter}
            parser={amountParser}
            disabled={locked || isRate}
            onChange={(amount) => patch('fee', { fee: amount })}
          />
        </SysField>
        <SysField label="Minimum Amount" error={errors.minAmount}>
          <Spinbox
            className={`${styles.fullWidth} ${styles.amountInput}`}
            value={values.minAmount}
            min={0}
            formatter={amountFormatter}
            parser={amountParser}
            disabled={locked || !isRate}
            onChange={(minAmount) => patch('minAmount', { minAmount })}
          />
        </SysField>
        <SysField label="Item Name" required error={errors.name}>
          <TextInput value={values.name} maxLength={300} disabled={locked} onChange={(e) => patch('name', { name: e.target.value })} />
        </SysField>
        <SysField label="Item Content" span="full" error={errors.description}>
          <TextInput
            value={values.description}
            maxLength={1000}
            disabled={locked}
            onChange={(e) => patch('description', { description: e.target.value })}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
