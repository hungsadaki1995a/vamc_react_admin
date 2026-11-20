import { useState } from 'react';
import { Input, Radio } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import type { CodeGroupItem, YesNo } from '@/api/system/code-group-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/features/system/_shared/sys-form-ui';
import { USE_YN_RADIO_OPTIONS } from '@/features/system/_shared/sys-constants';
import { SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import { errorMessage } from '@/features/system/_shared/system-utils';
import { useCreateCodeGroup, useUpdateCodeGroup } from './use-common-codes';

// VPA090301P01 Common Code Group Register / Edit.

type Field = 'groupCd' | 'groupNm' | 'groupExpln' | 'useYn';

interface CodeGroupModalProps {
  /** null = register. */
  item: CodeGroupItem | null;
  canWrite: boolean;
  onClose: () => void;
}

export function CodeGroupModal({ item, canWrite, onClose }: CodeGroupModalProps) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const { errors, clearError, checkRequired, applyApiError } = useFieldErrors<Field>();
  const [values, setValues] = useState({
    groupCd: item?.groupCd ?? '',
    groupNm: item?.groupNm ?? '',
    groupExpln: item?.groupExpln ?? '',
    useYn: (item?.useYn ?? 'Y') as YesNo,
  });
  const createGroup = useCreateCodeGroup();
  const updateGroup = useUpdateCodeGroup();

  const change = <K extends Field>(key: K, value: (typeof values)[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const handleSubmit = async () => {
    if (!checkRequired(values, ['groupCd', 'groupNm', 'useYn'])) return;
    const groupNm = values.groupNm.trim();
    const groupExpln = values.groupExpln.trim() || undefined;
    try {
      if (isCreate) {
        await createGroup.mutateAsync({ groupCd: values.groupCd.trim(), groupNm, groupExpln, useYn: values.useYn });
        toast.success(SYS_MESSAGES.registered);
      } else {
        await updateGroup.mutateAsync({ groupCd: item.groupCd, request: { groupNm, groupExpln, useYn: values.useYn } });
        toast.success(SYS_MESSAGES.updated);
      }
      onClose();
    } catch (e) {
      if (!applyApiError(e, { COD002: ['groupCd', SYS_MESSAGES.duplicate('code')] })) toast.error(errorMessage(e));
    }
  };

  return (
    <SysFormModal
      open
      title={isCreate ? 'Register Common Code Group' : 'Edit Common Code Group'}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={canWrite ? () => void handleSubmit() : undefined}
      submitting={createGroup.isPending || updateGroup.isPending}
      onCancel={onClose}
      width={720}
    >
      <SysFieldGrid columns={1}>
        <SysField label="Group Code" required error={errors.groupCd}>
          <Input
            value={values.groupCd}
            disabled={!isCreate}
            maxLength={100}
            onChange={(e) => change('groupCd', e.target.value)}
          />
        </SysField>
        <SysField label="Group Name" required error={errors.groupNm}>
          <Input value={values.groupNm} maxLength={100} onChange={(e) => change('groupNm', e.target.value)} />
        </SysField>
        <SysField label="Group Description" error={errors.groupExpln}>
          <Input value={values.groupExpln} maxLength={4000} onChange={(e) => change('groupExpln', e.target.value)} />
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
