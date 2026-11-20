import { useState } from 'react';
import { Input, InputNumber, Radio } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import type { YesNo } from '@/api/system/code-group-api';
import type { ProgramItem, ProgramType } from '@/api/system/program-screen-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/features/system/_shared/sys-form-ui';
import { USE_YN_RADIO_OPTIONS } from '@/features/system/_shared/sys-constants';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { PROGRAM_TYPE_OPTIONS } from './program-constants';
import { useCreateProgram, useUpdateProgram } from './use-programs';

// VPA090401P01 Program Register / Edit.

type Field = 'prgrmCd' | 'menuCd' | 'prgrmSeCd' | 'prgrmSeq' | 'prgrmNm' | 'useYn' | 'prgrmExpln';

interface ProgramModalProps {
  /** null = register. */
  item: ProgramItem | null;
  canWrite: boolean;
  onClose: () => void;
}

export function ProgramModal({ item, canWrite, onClose }: ProgramModalProps) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const { errors, clearError, checkRequired, applyApiError } = useFieldErrors<Field>();
  const [values, setValues] = useState({
    prgrmCd: item?.prgrmCd ?? '',
    menuCd: item?.menuCd ?? '',
    prgrmSeCd: (item?.prgrmSeCd ?? 'PAGE') as ProgramType,
    prgrmSeq: (item?.prgrmSeq ?? null) as number | null,
    prgrmNm: item?.prgrmNm ?? '',
    useYn: (item?.useYn ?? 'Y') as YesNo,
    prgrmExpln: item?.prgrmExpln ?? '',
  });
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const change = <K extends Field>(key: K, value: (typeof values)[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const handleSubmit = async () => {
    if (!checkRequired(values, ['prgrmCd', 'menuCd', 'prgrmSeCd', 'prgrmSeq', 'prgrmNm', 'useYn'])) return;
    const request = {
      prgrmCd: values.prgrmCd.trim(),
      menuCd: values.menuCd.trim(),
      prgrmSeCd: values.prgrmSeCd,
      prgrmSeq: values.prgrmSeq as number,
      prgrmNm: values.prgrmNm.trim(),
      prgrmExpln: values.prgrmExpln.trim() || undefined,
      useYn: values.useYn,
    };
    try {
      if (isCreate) {
        await createProgram.mutateAsync(request);
        toast.success(SYS_MESSAGES.registered);
      } else {
        await updateProgram.mutateAsync({ prgrmCd: item.prgrmCd, request: { ...request, prgrmCd: item.prgrmCd } });
        toast.success(SYS_MESSAGES.updated);
      }
      onClose();
    } catch (e) {
      const handled = applyApiError(e, {
        SYS409: ['prgrmCd', SYS_MESSAGES.duplicate('program code')],
        SYS400: ['menuCd', 'This menu code does not exist.'],
      });
      if (!handled) toast.error(errorMessage(e));
    }
  };

  return (
    <SysFormModal
      open
      title={isCreate ? 'Register Program Information' : 'Edit Program Information'}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={canWrite ? () => void handleSubmit() : undefined}
      submitting={createProgram.isPending || updateProgram.isPending}
      onCancel={onClose}
      width={1080}
    >
      <SysFieldGrid columns={3}>
        <SysField label="Program Code" required error={errors.prgrmCd}>
          <Input
            value={values.prgrmCd}
            disabled={!isCreate}
            maxLength={12}
            onChange={(e) => change('prgrmCd', e.target.value)}
          />
        </SysField>
        <SysField label="Menu Code" required error={errors.menuCd}>
          <Input
            value={values.menuCd}
            maxLength={9}
            placeholder="e.g. A03010000"
            onChange={(e) => change('menuCd', e.target.value)}
          />
        </SysField>
        <SysField label="Type" required error={errors.prgrmSeCd}>
          <Radio.Group
            options={PROGRAM_TYPE_OPTIONS}
            value={values.prgrmSeCd}
            onChange={(e) => change('prgrmSeCd', e.target.value as ProgramType)}
          />
        </SysField>
        <SysField label="Order" required error={errors.prgrmSeq}>
          <InputNumber
            value={values.prgrmSeq}
            min={0}
            max={99}
            precision={0}
            onChange={(v) => change('prgrmSeq', typeof v === 'number' ? v : null)}
          />
        </SysField>
        <SysField label="Program Name" required error={errors.prgrmNm}>
          <Input value={values.prgrmNm} maxLength={100} onChange={(e) => change('prgrmNm', e.target.value)} />
        </SysField>
        <SysField label="Use" required error={errors.useYn}>
          <Radio.Group
            options={USE_YN_RADIO_OPTIONS}
            value={values.useYn}
            onChange={(e) => change('useYn', e.target.value as YesNo)}
          />
        </SysField>
        <SysField label="Program Description" span="full" error={errors.prgrmExpln}>
          <Input value={values.prgrmExpln} maxLength={4000} onChange={(e) => change('prgrmExpln', e.target.value)} />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
