import { useState } from 'react';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useCommonCodes } from '@/hooks/use-common-codes';
import { COMMON_SCREEN_ID, RESERVED_LABEL_SCREEN_IDS } from '@/api/system/label-management-api';
import type { LabelKey, LabelListItem } from '@/api/system/label-management-api';
import { SYS_DIALOG_LABELS, SYS_MESSAGES } from '@/config/sys-messages';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { errorMessage } from '@/utils/system-utils';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import {
  composeLabelKey,
  isCommonScreen,
  LABEL_CODE_PATTERN,
  LABEL_KEY_MAX,
  LABEL_MESSAGES,
  labelCodeOf,
  SCREEN_ID_PATTERN,
} from './label-utils';
import { useCreateLabel, useDeleteLabel, useUpdateLabel } from './use-labels';
import styles from './label-management.module.scss';

type Scope = 'B' | 'C';
type LabelType = 'W' | 'A';
type FieldKey = 'scrnId' | 'lblSeCd' | 'code';

interface FormValues {
  type: LabelType;
  scope: Scope;
  scrnId: string;
  lblSeCd: string;
  code: string;
  lblExpln: string;
}

const TYPE_OPTIONS = [
  { value: 'W', label: 'Web' },
  { value: 'A', label: 'Admin' },
];

const SCOPE_OPTIONS = [
  { value: 'B', label: 'Business' },
  { value: 'C', label: 'Common' },
];

interface LabelModalProps {
  /** Edit mode when given, register mode otherwise. */
  label?: LabelListItem;
  canWrite: boolean;
  onClose: () => void;
  /** After register / edit: the label to select in the list. */
  onSaved: (key: LabelKey) => void;
  onDeleted: (key: LabelKey) => void;
}

function toFormValues(label?: LabelListItem): FormValues {
  if (!label) return { type: 'W', scope: 'B', scrnId: '', lblSeCd: '', code: '', lblExpln: '' };
  return {
    type: label.sysSeCd === 'A' ? 'A' : 'W',
    scope: isCommonScreen(label.scrnId) ? 'C' : 'B',
    scrnId: label.scrnId,
    lblSeCd: label.lblSeCd,
    code: label.lblCode ?? labelCodeOf(label),
    lblExpln: label.lblExpln ?? '',
  };
}

/** i18n Label Management - Register/Edit (VPA090403P01). Registers the key only; texts are entered on the list. */
export default function LabelModal({ label, canWrite, onClose, onSaved, onDeleted }: LabelModalProps) {
  const isEdit = label !== undefined;
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const labelTypes = useCommonCodes('LBL_SE_CD');
  const [values, setValues] = useState<FormValues>(() => toFormValues(label));
  const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();

  const createLabel = useCreateLabel();
  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();

  const labelKey = isEdit
    ? label.lblCd
    : values.scrnId && values.lblSeCd && values.code
      ? composeLabelKey(values.scrnId.trim(), values.lblSeCd, values.code.trim())
      : '';

  const change = (patch: Partial<FormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    (['scrnId', 'lblSeCd', 'code'] as const).forEach((key) => {
      if (key in patch) clearError(key);
    });
  };

  const changeScope = (scope: Scope) =>
    change({ scope, scrnId: scope === 'C' ? COMMON_SCREEN_ID : values.scope === 'C' ? '' : values.scrnId });

  const validateFormat = (): boolean => {
    let valid = true;
    if (!SCREEN_ID_PATTERN.test(values.scrnId.trim())) {
      setError('scrnId', LABEL_MESSAGES.invalidScreenId);
      valid = false;
    }
    if (!LABEL_CODE_PATTERN.test(values.code.trim())) {
      setError('code', LABEL_MESSAGES.invalidLabelCode);
      valid = false;
    } else if (labelKey.length > LABEL_KEY_MAX) {
      setError('code', LABEL_MESSAGES.keyTooLong);
      valid = false;
    }
    return valid;
  };

  const register = async () => {
    if (!checkRequired(values, ['scrnId', 'lblSeCd', 'code']) || !validateFormat()) return;
    try {
      // Key only — texts are entered in Text by Language after registration. The server builds the key.
      const response = await createLabel.run({
        sysSeCd: values.type,
        scrnId: values.scrnId.trim(),
        lblSeCd: values.lblSeCd,
        lblCode: values.code.trim(),
        lblExpln: values.lblExpln.trim() || undefined,
      });
      const saved = response.data;
      toast.success(SYS_MESSAGES.registered);
      onSaved(
        saved
          ? { scrnId: saved.scrnId, lblSeCd: saved.lblSeCd, lblCd: saved.lblCd }
          : { scrnId: values.scrnId.trim(), lblSeCd: values.lblSeCd, lblCd: labelKey },
      );
    } catch (error) {
      if (
        applyApiError(error, {
          LBL004: ['scrnId', LABEL_MESSAGES.menuScreenReserved],
          LBL012: ['scrnId', LABEL_MESSAGES.screenNotRegistered],
          LBL013: ['code', LABEL_MESSAGES.keyTooLong],
        })
      )
        return;
      if (applyApiError(error, { LBL002: ['scrnId', LABEL_MESSAGES.duplicate] })) {
        // E02 marks Screen ID, Label Type and Label Code.
        setError('lblSeCd', LABEL_MESSAGES.duplicate);
        setError('code', LABEL_MESSAGES.duplicate);
        return;
      }
      toast.error(errorMessage(error));
    }
  };

  const edit = async () => {
    if (!label) return;
    const key: LabelKey = { scrnId: label.scrnId, lblSeCd: label.lblSeCd, lblCd: label.lblCd };
    try {
      // No translations → the server keeps the stored texts.
      await updateLabel.run({ ...key, lblExpln: values.lblExpln.trim() });
      toast.success(SYS_MESSAGES.updated);
      onSaved(key);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const remove = () => {
    if (!label) return;
    const key: LabelKey = { scrnId: label.scrnId, lblSeCd: label.lblSeCd, lblCd: label.lblCd };
    confirm({
      content: LABEL_MESSAGES.confirmDelete,
      okText: SYS_DIALOG_LABELS.delete,
      danger: true,
      onOk: async () => {
        try {
          await deleteLabel.run(key);
          toast.success(SYS_MESSAGES.deleted);
          onDeleted(key);
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });
  };

  const keyFieldsLocked = isEdit || !canWrite;

  return (
    <SysFormModal
      open
      title={isEdit ? 'Edit i18n Label' : 'Register i18n Label'}
      submitText={isEdit ? 'Edit' : 'Register'}
      onSubmit={canWrite ? (isEdit ? edit : register) : undefined}
      submitting={createLabel.isPending || updateLabel.isPending}
      onCancel={onClose}
      width={800}
      leftActions={
        isEdit &&
        canWrite &&
        !RESERVED_LABEL_SCREEN_IDS.includes(label?.scrnId ?? '') && (
          <SysButton look="danger" loading={deleteLabel.isPending} onClick={remove}>
            Delete
          </SysButton>
        )
      }
    >
      <SysFieldGrid columns={2}>
        <SysField label="Type" required>
          <AppRadio.Group
            options={TYPE_OPTIONS}
            value={isEdit && !label.sysSeCd ? undefined : values.type}
            disabled={keyFieldsLocked}
            onChange={(e) => change({ type: e.target.value as LabelType })}
          />
        </SysField>
        <SysField label="Scope" required>
          <AppRadio.Group
            options={SCOPE_OPTIONS}
            value={values.scope}
            disabled={keyFieldsLocked}
            onChange={(e) => changeScope(e.target.value as Scope)}
          />
        </SysField>
        <SysField label="Screen ID" required span="full" error={errors.scrnId}>
          <TextInput
            value={values.scrnId}
            maxLength={20}
            placeholder="e.g. WB_AB_10004"
            disabled={keyFieldsLocked || values.scope === 'C'}
            onChange={(e) => change({ scrnId: e.target.value })}
          />
        </SysField>
        <SysField label="Label Type" required error={errors.lblSeCd}>
          <AppSelect
            placeholder="Select"
            value={values.lblSeCd || undefined}
            options={labelTypes}
            disabled={keyFieldsLocked}
            onChange={(lblSeCd) => change({ lblSeCd: String(lblSeCd ?? '') })}
            className={styles.fullWidth}
          />
        </SysField>
        <SysField label="Label Code" required error={errors.code}>
          <TextInput
            value={values.code}
            maxLength={LABEL_KEY_MAX}
            placeholder="e.g. download"
            disabled={keyFieldsLocked}
            onChange={(e) => change({ code: e.target.value })}
          />
        </SysField>
        <SysField label="Label Key" span="full">
          <TextInput value={labelKey} placeholder="[Screen ID].[Label Type]_[Label Code]" disabled />
        </SysField>
        <SysField label="Description" span="full">
          <TextArea
            value={values.lblExpln}
            maxLength={4000}
            autoSize={{ minRows: 5, maxRows: 8 }}
            disabled={!canWrite}
            onChange={(e) => change({ lblExpln: e.target.value })}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
