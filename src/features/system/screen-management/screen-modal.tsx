import { useState } from 'react';
import { Input, InputNumber, Radio, Select } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import type { YesNo } from '@/api/system/code-group-api';
import type { ScreenItem } from '@/api/system/program-screen-api';
import { SysField, SysFieldGrid, SysFormModal, SysFormSection } from '@/features/system/_shared/sys-form-ui';
import { SysButton } from '@/features/system/_shared/sys-list-ui';
import { USE_YN_RADIO_OPTIONS } from '@/features/system/_shared/sys-constants';
import { SYS_DIALOG_LABELS, SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import { useSysDialogs } from '@/features/system/_shared/use-sys-dialogs';
import { apiErrorCode, errorMessage } from '@/features/system/_shared/system-utils';
import { NOT_AVAILABLE_NOTE, POPUP_OPTIONS, SCREEN_TYPE_OPTIONS, screenTypeOf } from './screen-constants';
import type { ScreenType } from './screen-constants';
import { useBusinessOptions, useCreateScreen, useDeleteScreen, useProgramOptions, useUpdateScreen } from './use-screens';
import styles from './screen-management.module.scss';

// VPA090402P01 Screen Register / Edit.
// Type, Business, Screen Name, Component Path, Label Key and Popup have no column yet:
// shown disabled and not sent. The legacy block holds what the API still requires.
// TODO(schema): SCRN_MNG DDL (ddl-proposals/03-SCRN_MNG.sql).

type Field = 'scrnId' | 'scrnExpln' | 'prgrmCd' | 'scrnSeq' | 'useYn';

interface ScreenModalProps {
  /** null = register. */
  item: ScreenItem | null;
  canWrite: boolean;
  onClose: () => void;
}

export function ScreenModal({ item, canWrite, onClose }: ScreenModalProps) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const { errors, clearError, checkRequired, applyApiError } = useFieldErrors<Field>();
  const [values, setValues] = useState({
    scrnId: item?.scrnId ?? '',
    scrnExpln: item?.scrnExpln ?? '',
    prgrmCd: item?.prgrmCd ?? '',
    scrnSeq: (item?.scrnSeq ?? null) as number | null,
    useYn: (item?.useYn ?? 'Y') as YesNo,
  });
  const screenType: ScreenType = screenTypeOf(item?.scrnId) ?? 'W';
  const programOptions = useProgramOptions();
  const businessOptions = useBusinessOptions(screenType);
  const createScreen = useCreateScreen();
  const updateScreen = useUpdateScreen();
  const deleteScreen = useDeleteScreen();

  const change = <K extends Field>(key: K, value: (typeof values)[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const handleSubmit = async () => {
    if (!checkRequired(values, ['scrnId', 'prgrmCd', 'scrnSeq', 'useYn'])) return;
    const request = {
      scrnId: values.scrnId.trim(),
      prgrmCd: values.prgrmCd,
      scrnExpln: values.scrnExpln.trim() || undefined,
      scrnSeq: values.scrnSeq as number,
      useYn: values.useYn,
    };
    try {
      if (isCreate) {
        await createScreen.mutateAsync(request);
        toast.success(SYS_MESSAGES.registered);
      } else {
        await updateScreen.mutateAsync({ scrnId: item.scrnId, request: { ...request, scrnId: item.scrnId } });
        toast.success(SYS_MESSAGES.updated);
      }
      onClose();
    } catch (e) {
      const handled = applyApiError(e, {
        SYS409: ['scrnId', SYS_MESSAGES.duplicate('Screen ID')],
        SYS400: ['prgrmCd', 'This program code does not exist.'],
      });
      if (!handled) toast.error(errorMessage(e));
    }
  };

  const handleDelete = () => {
    if (!item) return;
    confirm({
      content: SYS_MESSAGES.confirmDelete('this screen'),
      okText: SYS_DIALOG_LABELS.delete,
      danger: true,
      onOk: async () => {
        try {
          await deleteScreen.mutateAsync(item.scrnId);
          toast.success(SYS_MESSAGES.deleted);
          onClose();
        } catch (e) {
          toast.error(
            apiErrorCode(e) === 'SYS409' ? 'This screen cannot be deleted while labels still use it.' : errorMessage(e),
          );
        }
      },
    });
  };

  return (
    <SysFormModal
      open
      title={isCreate ? 'Register Screen' : 'Edit Screen'}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={canWrite ? () => void handleSubmit() : undefined}
      submitting={createScreen.isPending || updateScreen.isPending}
      onCancel={onClose}
      extraActions={
        !isCreate &&
        canWrite && (
          <SysButton className={styles.deleteAction} look="primary" danger loading={deleteScreen.isPending} onClick={handleDelete}>
            Delete
          </SysButton>
        )
      }
    >
      <SysFieldGrid columns={2}>
        <SysField label="Type" required hint={NOT_AVAILABLE_NOTE}>
          <Radio.Group options={SCREEN_TYPE_OPTIONS} value={screenType} disabled />
        </SysField>
        <SysField label="Business" required hint={NOT_AVAILABLE_NOTE}>
          <Select className={styles.fullWidth} options={businessOptions} placeholder="Select" disabled />
        </SysField>
        <SysField label="Screen ID" required error={errors.scrnId}>
          <Input
            value={values.scrnId}
            disabled={!isCreate}
            maxLength={20}
            placeholder="e.g. WB_AB_10000"
            onChange={(e) => change('scrnId', e.target.value)}
          />
        </SysField>
        <SysField label="Screen Name" required hint={NOT_AVAILABLE_NOTE}>
          <Input disabled />
        </SysField>
        <SysField label="Popup" required hint={NOT_AVAILABLE_NOTE}>
          <Radio.Group options={POPUP_OPTIONS} value="N" disabled />
        </SysField>
        <SysField label="Component Path" required hint={NOT_AVAILABLE_NOTE}>
          <Input disabled />
        </SysField>
        <SysField label="Label Key" hint={NOT_AVAILABLE_NOTE}>
          <Input disabled />
        </SysField>
        <SysField label="Remarks" error={errors.scrnExpln}>
          <Input value={values.scrnExpln} maxLength={4000} onChange={(e) => change('scrnExpln', e.target.value)} />
        </SysField>
      </SysFieldGrid>

      <SysFormSection title="Legacy (until schema change)">
        <SysFieldGrid columns={3}>
          <SysField label="Program" required error={errors.prgrmCd}>
            <Select
              className={styles.fullWidth}
              showSearch
              optionFilterProp="label"
              options={programOptions}
              value={values.prgrmCd || undefined}
              placeholder="Select"
              onChange={(v: string) => change('prgrmCd', v)}
            />
          </SysField>
          <SysField label="Order" required error={errors.scrnSeq}>
            <InputNumber
              value={values.scrnSeq}
              min={0}
              max={99}
              precision={0}
              onChange={(v) => change('scrnSeq', typeof v === 'number' ? v : null)}
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
      </SysFormSection>
    </SysFormModal>
  );
}
