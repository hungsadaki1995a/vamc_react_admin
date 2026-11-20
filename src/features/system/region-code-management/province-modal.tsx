import { useState } from 'react';
import { Input, InputNumber, Radio } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import type { YesNo } from '@/api/system/code-group-api';
import type { ProvinceItem } from '@/api/system/location-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/features/system/_shared/sys-form-ui';
import { USE_YN_RADIO_OPTIONS } from '@/features/system/_shared/sys-constants';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { ApiError } from '@/lib/api/error';
import { useCreateProvince, useUpdateProvince } from './use-regions';

// VPA090302P01 Province / City Code Register / Edit.

type Field = 'mctpvCd' | 'mctpvNm' | 'admdstCd' | 'useYn';

interface ProvinceModalProps {
  /** null = register. */
  item: ProvinceItem | null;
  canWrite: boolean;
  onClose: () => void;
}

export function ProvinceModal({ item, canWrite, onClose }: ProvinceModalProps) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const { errors, setError, clearError, checkRequired } = useFieldErrors<Field>();
  const [values, setValues] = useState({
    mctpvCd: item?.mctpvCd ?? '',
    mctpvNm: item?.mctpvNm ?? '',
    admdstCd: (item?.admdstCd ?? null) as number | null,
    useYn: (item?.useYn ?? 'Y') as YesNo,
  });
  const createProvince = useCreateProvince();
  const updateProvince = useUpdateProvince();

  const change = <K extends Field>(key: K, value: (typeof values)[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const handleSubmit = async () => {
    if (!checkRequired(values, ['mctpvCd', 'mctpvNm', 'admdstCd', 'useYn'])) return;
    const mctpvNm = values.mctpvNm.trim();
    try {
      if (isCreate) {
        await createProvince.mutateAsync({
          mctpvCd: values.mctpvCd.trim(),
          mctpvNm,
          admdstCd: values.admdstCd as number,
          useYn: values.useYn,
        });
        toast.success(SYS_MESSAGES.registered);
      } else {
        await updateProvince.mutateAsync({
          mctpvCd: item.mctpvCd,
          request: { mctpvNm, sortSeq: item.sortSeq, useYn: values.useYn },
        });
        toast.success(SYS_MESSAGES.updated);
      }
      onClose();
    } catch (e) {
      // Duplicate province code: 409 without an error code.
      if (isCreate && e instanceof ApiError && e.statusCode === 409) {
        setError('mctpvCd', SYS_MESSAGES.duplicate('code'));
        return;
      }
      toast.error(errorMessage(e));
    }
  };

  return (
    <SysFormModal
      open
      title={isCreate ? 'Register Province / City Code' : 'Edit Province / City Code'}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={canWrite ? () => void handleSubmit() : undefined}
      submitting={createProvince.isPending || updateProvince.isPending}
      onCancel={onClose}
      width={720}
    >
      <SysFieldGrid columns={1}>
        <SysField label="Province / City Code" required error={errors.mctpvCd} hint={isCreate ? 'Up to 3 characters.' : undefined}>
          <Input
            value={values.mctpvCd}
            disabled={!isCreate}
            maxLength={3}
            onChange={(e) => change('mctpvCd', e.target.value)}
          />
        </SysField>
        <SysField label="Province / City Name" required error={errors.mctpvNm}>
          <Input value={values.mctpvNm} maxLength={40} onChange={(e) => change('mctpvNm', e.target.value)} />
        </SysField>
        <SysField label="Administrative Code" required error={errors.admdstCd} hint={isCreate ? 'Number 0–99.' : undefined}>
          <InputNumber
            value={values.admdstCd}
            disabled={!isCreate}
            min={0}
            max={99}
            precision={0}
            onChange={(v) => change('admdstCd', typeof v === 'number' ? v : null)}
          />
        </SysField>
        <SysField label="Use" required error={errors.useYn}>
          <Radio.Group
            options={USE_YN_RADIO_OPTIONS}
            value={values.useYn}
            onChange={(e) => change('useYn', e.target.value as YesNo)}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
