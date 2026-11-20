import { useState } from 'react';
import { Input, Radio } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { ROLE_DUPLICATED, ROLE_GROUP_DUPLICATED } from '@/api/system/role-group-api';
import type { Role, RoleGroup, YesNo } from '@/api/system/role-group-api';
import { SysField, SysFieldGrid, SysFormModal } from '../_shared/SysFormUi';
import { USE_YN_RADIO_OPTIONS } from '../_shared/sys-constants';
import { SYS_MESSAGES } from '../_shared/sys-messages';
import { useFieldErrors } from '../_shared/use-field-errors';
import { errorMessage } from '../_shared/system-utils';
import { useSaveRole, useSaveRoleGroup } from './use-role-groups';

// User Group Management - Register/Edit popup (VPA090203P01), for a user group or a group role.

export type RoleGroupModalTarget =
  | { kind: 'group'; record?: RoleGroup }
  | { kind: 'role'; roleGroupId: string; record?: Role };

interface RoleGroupModalProps {
  target: RoleGroupModalTarget;
  canWrite: boolean;
  onClose: () => void;
}

interface Form {
  id: string;
  name: string;
  useYn: YesNo;
}

type Field = keyof Form;

const GROUP_ID_PATTERN = /^RG\d{5}$/;

export default function RoleGroupModal({ target, canWrite, onClose }: RoleGroupModalProps) {
  const isGroup = target.kind === 'group';
  const isEdit = target.record !== undefined;
  const noun = isGroup ? 'User Group' : 'Role';
  const { toast } = useNotify();
  const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<Field>();
  const saveGroup = useSaveRoleGroup();
  const saveRole = useSaveRole();

  const [form, setForm] = useState<Form>(() => {
    if (target.kind === 'group') {
      return { id: target.record?.roleGroupId ?? '', name: target.record?.roleGroupNm ?? '', useYn: target.record?.useYn ?? 'Y' };
    }
    return { id: target.record?.roleId ?? '', name: target.record?.roleNm ?? '', useYn: target.record?.useYn ?? 'Y' };
  });

  const change = (patch: Partial<Form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    (Object.keys(patch) as Field[]).forEach(clearError);
  };

  const handleSubmit = async () => {
    if (!checkRequired(form, ['id', 'name', 'useYn'])) return;
    const id = form.id.trim();
    if (isGroup && !isEdit && !GROUP_ID_PATTERN.test(id)) {
      setError('id', 'Enter RG followed by 5 digits (e.g. RG00010).');
      return;
    }
    try {
      if (target.kind === 'group') {
        await saveGroup.mutateAsync({ isEdit, request: { roleGroupId: id, roleGroupNm: form.name.trim(), useYn: form.useYn } });
      } else {
        await saveRole.mutateAsync({
          isEdit,
          request: {
            roleId: id,
            roleNm: form.name.trim(),
            // The group of a role cannot change.
            roleGroupId: target.record?.roleGroupId ?? target.roleGroupId,
            useYn: form.useYn,
          },
        });
      }
      toast.success(isEdit ? SYS_MESSAGES.updated : SYS_MESSAGES.registered);
      onClose();
    } catch (e) {
      const handled = applyApiError(e, {
        [isGroup ? ROLE_GROUP_DUPLICATED : ROLE_DUPLICATED]: ['id', SYS_MESSAGES.duplicate('ID')],
      });
      if (!handled) toast.error(errorMessage(e));
    }
  };

  return (
    <SysFormModal
      open
      width={720}
      title={`${isEdit ? 'Edit' : 'Register'} ${noun}`}
      submitText={isEdit ? 'Edit' : 'Register'}
      onSubmit={canWrite ? () => void handleSubmit() : undefined}
      submitting={saveGroup.isPending || saveRole.isPending}
      onCancel={onClose}
    >
      <SysFieldGrid columns={1}>
        <SysField label={isGroup ? 'Group ID' : 'Role ID'} required error={errors.id}>
          <Input
            value={form.id}
            maxLength={7}
            disabled={isEdit || !canWrite}
            placeholder={isGroup ? 'e.g. RG00010' : 'e.g. RCPT'}
            onChange={(e) => change({ id: isGroup ? e.target.value.trim().toUpperCase() : e.target.value.trim() })}
          />
        </SysField>
        <SysField label={isGroup ? 'Group Name' : 'Role Name'} required error={errors.name}>
          <Input value={form.name} maxLength={100} disabled={!canWrite} onChange={(e) => change({ name: e.target.value })} />
        </SysField>
        <SysField label="Use" required error={errors.useYn}>
          <Radio.Group
            options={USE_YN_RADIO_OPTIONS}
            value={form.useYn}
            disabled={!canWrite}
            onChange={(e) => change({ useYn: e.target.value as YesNo })}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
