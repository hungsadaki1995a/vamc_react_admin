import { useState } from 'react';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import type { YesNo } from '@/api/system/code-group-api';
import type { ScreenItem, ScreenRequest, ScreenType } from '@/api/system/program-screen-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/features/system/_shared/SysFormUi';
import { SysButton } from '@/features/system/_shared/SysListUi';
import { SYS_DIALOG_LABELS, SYS_MESSAGES } from '@/features/system/_shared/sys-messages';
import { useFieldErrors } from '@/features/system/_shared/use-field-errors';
import { useSysDialogs } from '@/features/system/_shared/use-sys-dialogs';
import { apiErrorCode, errorMessage } from '@/features/system/_shared/system-utils';
import { POPUP_OPTIONS, SCREEN_MESSAGES, SCREEN_TYPE_OPTIONS } from './screen-constants';
import { useBusinessOptions, useCreateScreen, useDeleteScreen, useUpdateScreen } from './use-screens';
import styles from './screen-management.module.scss';

// VPA090402P01 Screen Register / Edit.

type Field = 'sysSeCd' | 'menuCd' | 'scrnId' | 'scrnNm' | 'cmpntPathNm' | 'lblCd' | 'popupYn' | 'scrnExpln';

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
    sysSeCd: (item?.sysSeCd ?? 'W') as ScreenType,
    menuCd: item?.menuCd ?? '',
    scrnId: item?.scrnId ?? '',
    scrnNm: item?.scrnNm ?? '',
    cmpntPathNm: item?.cmpntPathNm ?? '',
    lblCd: item?.lblCd ?? '',
    popupYn: (item?.popupYn ?? 'N') as YesNo,
    scrnExpln: item?.scrnExpln ?? '',
  });
  const businessOptions = useBusinessOptions(values.sysSeCd);
  const createScreen = useCreateScreen();
  const updateScreen = useUpdateScreen();
  const deleteScreen = useDeleteScreen();
  const readOnly = !canWrite;

  const change = <K extends Field>(key: K, value: (typeof values)[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const changeType = (type: ScreenType) => {
    // Business options belong to one type: clear the business when the type changes.
    setValues((prev) => ({ ...prev, sysSeCd: type, menuCd: '' }));
    clearError('sysSeCd');
    clearError('menuCd');
  };

  const handleSubmit = async () => {
    if (!checkRequired(values, ['sysSeCd', 'menuCd', 'scrnId', 'scrnNm', 'cmpntPathNm', 'popupYn'])) return;
    const request: ScreenRequest = {
      sysSeCd: values.sysSeCd,
      menuCd: values.menuCd,
      scrnId: values.scrnId.trim(),
      scrnNm: values.scrnNm.trim(),
      cmpntPathNm: values.cmpntPathNm.trim(),
      lblCd: values.lblCd.trim() || undefined,
      popupYn: values.popupYn,
      scrnExpln: values.scrnExpln.trim() || undefined,
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
        SCR001: ['menuCd', SCREEN_MESSAGES.businessInvalid],
        SCR002: ['lblCd', SCREEN_MESSAGES.labelKeyNotFound],
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
          toast.error(apiErrorCode(e) === 'SYS409' ? SCREEN_MESSAGES.hasLabels : errorMessage(e));
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
      width={1200}
      leftActions={
        !isCreate &&
        canWrite && (
          <SysButton look="danger" loading={deleteScreen.isPending} onClick={handleDelete}>
            Delete
          </SysButton>
        )
      }
    >
      <SysFieldGrid columns={2}>
        <SysField label="Type" required error={errors.sysSeCd}>
          <AppRadio.Group
            options={SCREEN_TYPE_OPTIONS}
            value={values.sysSeCd}
            disabled={readOnly}
            onChange={(e) => changeType(e.target.value as ScreenType)}
          />
        </SysField>
        <SysField label="Business" required error={errors.menuCd}>
          <AppSelect
            className={styles.fullWidth}
            showSearch
            optionFilterProp="label"
            options={businessOptions}
            value={values.menuCd || undefined}
            placeholder="Select"
            disabled={readOnly}
            onChange={(v) => change('menuCd', String(v ?? ''))}
          />
        </SysField>
        <SysField label="Screen ID" required error={errors.scrnId}>
          <TextInput
            value={values.scrnId}
            disabled={!isCreate || readOnly}
            maxLength={20}
            placeholder="e.g. WB_AB_10000"
            onChange={(e) => change('scrnId', e.target.value)}
          />
        </SysField>
        <SysField label="Screen Name" required error={errors.scrnNm}>
          <TextInput
            value={values.scrnNm}
            maxLength={200}
            disabled={readOnly}
            onChange={(e) => change('scrnNm', e.target.value)}
          />
        </SysField>
        <SysField label="Popup" required error={errors.popupYn}>
          <AppRadio.Group
            options={POPUP_OPTIONS}
            value={values.popupYn}
            disabled={readOnly}
            onChange={(e) => change('popupYn', e.target.value as YesNo)}
          />
        </SysField>
        <SysField label="Component Path" required error={errors.cmpntPathNm}>
          <TextInput
            value={values.cmpntPathNm}
            maxLength={500}
            placeholder="e.g. /about/vamc/ceo"
            disabled={readOnly}
            onChange={(e) => change('cmpntPathNm', e.target.value)}
          />
        </SysField>
        <SysField label="Label Key" error={errors.lblCd}>
          <TextInput
            value={values.lblCd}
            maxLength={100}
            disabled={readOnly}
            onChange={(e) => change('lblCd', e.target.value)}
          />
        </SysField>
        <SysField label="Remarks" error={errors.scrnExpln}>
          <TextInput
            value={values.scrnExpln}
            maxLength={4000}
            disabled={readOnly}
            onChange={(e) => change('scrnExpln', e.target.value)}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
