import { useState } from 'react';
import AppRadio from '@/components/inputs/AppRadio';
import Spinbox from '@/components/inputs/Spinbox';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import type { YesNo } from '@/api/system/code-group-api';
import type { InstitutionItem } from '@/api/system/institution-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/features/system/_shared/SysFormUi';
import { USE_YN_RADIO_OPTIONS } from '@/features/system/_shared/sys-constants';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { ApiError } from '@/lib/api/error';
import { useCreateInstitution, useUpdateInstitution } from './use-institutions';

// VPA090303P01 Institution Code Register / Edit.

type Field = 'fnstCd' | 'fnstNm' | 'fnstAbbrNm' | 'useYn';

interface InstitutionModalProps {
  /** null = register. */
  item: InstitutionItem | null;
  canWrite: boolean;
  onClose: () => void;
}

export function InstitutionModal({ item, canWrite, onClose }: InstitutionModalProps) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const { errors, setError, clearError, checkRequired } = useFieldErrors<Field>();
  const [values, setValues] = useState({
    fnstCd: (item?.fnstCd ?? null) as number | null,
    fnstNm: item?.fnstNm ?? '',
    fnstAbbrNm: item?.fnstAbbrNm ?? '',
    useYn: (item?.useYn ?? 'Y') as YesNo,
  });
  const createInstitution = useCreateInstitution();
  const updateInstitution = useUpdateInstitution();

  const change = <K extends Field>(key: K, value: (typeof values)[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const handleSubmit = async () => {
    if (!checkRequired(values, ['fnstCd', 'fnstNm', 'useYn'])) return;
    const fnstCd = values.fnstCd as number;
    if (!Number.isInteger(fnstCd) || fnstCd < 1 || fnstCd > 999) {
      setError('fnstCd', 'Please enter a number from 1 to 999.');
      return;
    }
    const request = { fnstNm: values.fnstNm.trim(), fnstAbbrNm: values.fnstAbbrNm.trim() || undefined, useYn: values.useYn };
    try {
      if (isCreate) {
        await createInstitution.mutateAsync({ fnstCd, ...request });
        toast.success(SYS_MESSAGES.registered);
      } else {
        await updateInstitution.mutateAsync({ fnstCd: item.fnstCd, request });
        toast.success(SYS_MESSAGES.updated);
      }
      onClose();
    } catch (e) {
      // Duplicate institution code: 409 without an error code.
      if (isCreate && e instanceof ApiError && e.statusCode === 409) {
        setError('fnstCd', SYS_MESSAGES.duplicate('code'));
        return;
      }
      toast.error(errorMessage(e));
    }
  };

  return (
    <SysFormModal
      open
      title={isCreate ? 'Register Institution Code' : 'Edit Institution Code'}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={canWrite ? () => void handleSubmit() : undefined}
      submitting={createInstitution.isPending || updateInstitution.isPending}
      onCancel={onClose}
      width={480}
    >
      <SysFieldGrid columns={1}>
        <SysField label="Institution Code" required error={errors.fnstCd}>
          <Spinbox
            value={values.fnstCd}
            disabled={!isCreate}
            min={1}
            max={999}
            precision={0}
            onChange={(v) => change('fnstCd', typeof v === 'number' ? v : null)}
          />
        </SysField>
        <SysField label="Institution Name" required error={errors.fnstNm}>
          <TextInput value={values.fnstNm} maxLength={200} onChange={(e) => change('fnstNm', e.target.value)} />
        </SysField>
        <SysField label="Short Name" error={errors.fnstAbbrNm}>
          <TextInput value={values.fnstAbbrNm} maxLength={200} onChange={(e) => change('fnstAbbrNm', e.target.value)} />
        </SysField>
        <SysField label="Use" required error={errors.useYn}>
          <AppRadio.Group
            options={USE_YN_RADIO_OPTIONS}
            value={values.useYn}
            onChange={(e) => change('useYn', e.target.value as YesNo)}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
