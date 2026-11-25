import { useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { NOTI_CHANNEL_LABELS, NOTIFICATION_ERRORS } from '@/api/system/notification-api';
import type {
  NotiChannel,
  NotiRecipientType,
  NotificationMessageItem,
  NotificationMessageRequest,
  YesNo,
} from '@/api/system/notification-api';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { USE_YN_RADIO_OPTIONS } from '@/config/sys-constants';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { errorMessage } from '@/utils/system-utils';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { CHANNEL_OPTIONS, RECIPIENT_TYPE_OPTIONS } from './notification-message-constants';
import {
  useNotificationMessage,
  useRecipientGroups,
  useSaveNotificationMessage,
  useTemplateVariables,
} from './use-notification-messages';
import styles from './notification-message-management.module.scss';

// Notification Message Management - Register / Edit popup (VPA090501P01), v0.8 model.
// No. is assigned by the server on register and read-only on edit; active templates can be edited.

type FieldKey = 'notiSrvcNm' | 'notiMediaSe' | 'notiRcvrSeCd' | 'useYn' | 'roleGroupId' | 'notiTtl' | 'notiCn' | 'noteCn';

type TemplateField = 'notiTtl' | 'notiCn';

interface MessageFormState {
  notiSrvcNm: string;
  notiMediaSe: NotiChannel;
  notiRcvrSeCd: NotiRecipientType;
  useYn: YesNo;
  roleGroupId: string | undefined;
  notiTtl: string;
  notiCn: string;
  noteCn: string;
}

function toState(item: NotificationMessageItem | null): MessageFormState {
  return {
    notiSrvcNm: item?.notiSrvcNm ?? '',
    notiMediaSe: item?.notiMediaSe ?? 'MAIL',
    notiRcvrSeCd: item?.notiRcvrSeCd ?? 'MBR',
    useYn: item?.useYn ?? 'Y',
    roleGroupId: item?.roleGroupId || undefined,
    notiTtl: item?.notiTtl ?? '',
    notiCn: item?.notiCn ?? '',
    noteCn: item?.noteCn ?? '',
  };
}

interface NotificationMessageModalProps {
  /** null = register. */
  notiMsgId: string | null;
  canWrite: boolean;
  onClose: () => void;
}

/** Loads the template in edit mode (the list has no content), then mounts the form with it. */
export default function NotificationMessageModal({ notiMsgId, canWrite, onClose }: NotificationMessageModalProps) {
  const { t } = useTranslation();
  const { data: detail, isFetching, isError } = useNotificationMessage(notiMsgId);

  if (notiMsgId !== null && !detail) {
    return (
      <SysFormModal width={1200} open title="Edit Notification Message" onCancel={onClose}>
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? t('messages.system.notificationMessage.loadFailed') : null}</div>
        </LoadingSpinner>
      </SysFormModal>
    );
  }

  return <MessageForm item={detail ?? null} canWrite={canWrite} onClose={onClose} />;
}

function MessageForm({
  item,
  canWrite,
  onClose,
}: {
  item: NotificationMessageItem | null;
  canWrite: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const isCreate = item === null;
  const { toast } = useNotify();
  const recipients = useRecipientGroups();
  const variables = useTemplateVariables();
  const saveMessage = useSaveNotificationMessage();
  const { errors, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();
  const [values, setValues] = useState<MessageFormState>(() => toState(item));
  // Caret of the last focused template field, for [Insert Variable].
  const caret = useRef<{ field: TemplateField; start: number; end: number }>({ field: 'notiTtl', start: -1, end: -1 });

  const isAdmin = values.notiRcvrSeCd === 'EMP';
  const disabled = !canWrite;

  const patch = (key: FieldKey, value: Partial<MessageFormState>) => {
    setValues((prev) => ({ ...prev, ...value }));
    clearError(key);
  };

  const trackCaret = (field: TemplateField) => (e: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    caret.current = { field, start: target.selectionStart ?? target.value.length, end: target.selectionEnd ?? target.value.length };
  };

  const insertVariable = (variable: string) => {
    const { field, start, end } = caret.current;
    const text = values[field];
    const from = start < 0 ? text.length : start;
    const to = end < 0 ? text.length : end;
    caret.current = { field, start: from + variable.length, end: from + variable.length };
    patch(field, { [field]: text.slice(0, from) + variable + text.slice(to) });
  };

  const changeRecipientType = (notiRcvrSeCd: NotiRecipientType) => {
    // A user recipient has no staff group.
    setValues((prev) => ({ ...prev, notiRcvrSeCd, roleGroupId: notiRcvrSeCd === 'MBR' ? undefined : prev.roleGroupId }));
    clearError('notiRcvrSeCd');
    clearError('roleGroupId');
  };

  const validate = (): boolean => {
    const required: FieldKey[] = ['notiSrvcNm', 'notiMediaSe', 'notiRcvrSeCd', 'useYn', 'notiTtl', 'notiCn'];
    if (isAdmin) required.push('roleGroupId');
    return checkRequired(values, required);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const request: NotificationMessageRequest = {
      useYn: values.useYn,
      notiSrvcNm: values.notiSrvcNm.trim(),
      notiMediaSe: values.notiMediaSe,
      notiRcvrSeCd: values.notiRcvrSeCd,
      roleGroupId: isAdmin ? values.roleGroupId : undefined,
      notiTtl: values.notiTtl.trim(),
      notiCn: values.notiCn,
      noteCn: values.noteCn.trim() || undefined,
    };
    try {
      await saveMessage.mutateAsync({ current: item, request });
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.updated);
      onClose();
    } catch (error) {
      const handled = applyApiError(error, {
        [NOTIFICATION_ERRORS.roleGroupNotFound]: ['roleGroupId', t('messages.system.notificationMessage.roleGroupNotFound')],
        [NOTIFICATION_ERRORS.unknownVariable]: ['notiCn', errorMessage(error)],
      });
      if (!handled) toast.error(errorMessage(error));
    }
  };

  const channelOptions =
    values.notiMediaSe === 'PUSH' ? [...CHANNEL_OPTIONS, { value: 'PUSH' as const, label: NOTI_CHANNEL_LABELS.PUSH }] : CHANNEL_OPTIONS;

  const headFields = (
    <>
      <SysField label="Service Type" required error={errors.notiSrvcNm}>
        <TextInput
          value={values.notiSrvcNm}
          maxLength={100}
          placeholder="e.g. OTP Verification, Sign Up, Auction"
          disabled={disabled}
          onChange={(e) => patch('notiSrvcNm', { notiSrvcNm: e.target.value })}
        />
      </SysField>
      <SysField label="Channel" required error={errors.notiMediaSe}>
        <AppSelect<NotiChannel>
          className={styles.fullWidth}
          value={values.notiMediaSe}
          options={channelOptions}
          disabled={disabled}
          onChange={(notiMediaSe) => patch('notiMediaSe', { notiMediaSe })}
        />
      </SysField>
    </>
  );

  const restFields = (
    <>
      <SysField label="Recipient Type" required error={errors.notiRcvrSeCd}>
        <AppRadio.Group
          value={values.notiRcvrSeCd}
          options={RECIPIENT_TYPE_OPTIONS}
          disabled={disabled}
          onChange={(e) => changeRecipientType(e.target.value as NotiRecipientType)}
        />
      </SysField>
      <SysField label="Use" required error={errors.useYn}>
        <AppRadio.Group
          value={values.useYn}
          options={USE_YN_RADIO_OPTIONS}
          disabled={disabled}
          onChange={(e) => patch('useYn', { useYn: e.target.value as YesNo })}
        />
      </SysField>
      <SysField label="Recipient" required={isAdmin} error={errors.roleGroupId}>
        <AppSelect<string>
          className={styles.fullWidth}
          value={values.roleGroupId}
          placeholder="Select"
          options={recipients.options}
          loading={recipients.loading}
          disabled={disabled || !isAdmin}
          allowClear
          showSearch={{ optionFilterProp: 'label' }}
          onChange={(roleGroupId) => patch('roleGroupId', { roleGroupId })}
        />
      </SysField>
      <SysField label="Title Template" required span="full" error={errors.notiTtl}>
        <TextInput
          value={values.notiTtl}
          maxLength={256}
          disabled={disabled}
          onChange={(e) => patch('notiTtl', { notiTtl: e.target.value })}
          onSelect={trackCaret('notiTtl')}
          onFocus={trackCaret('notiTtl')}
        />
      </SysField>
      <SysField label="Content Template" required span="full" error={errors.notiCn}>
        <div className={styles.contentCell}>
          <TextArea
            value={values.notiCn}
            rows={4}
            placeholder="e.g. New membership request: {mbrName}"
            disabled={disabled}
            onChange={(e) => patch('notiCn', { notiCn: e.target.value })}
            onSelect={trackCaret('notiCn')}
            onFocus={trackCaret('notiCn')}
          />
          <div className={styles.variableBar}>
            <span className={styles.variableLabel}>Insert Variable</span>
            {variables.map((variable) => (
              <SysButton
                key={variable.name}
                size="small"
                disabled={disabled}
                title={variable.secret ? `${variable.description} (masked in the send history)` : variable.description}
                // Keep the caret in the template field.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertVariable(variable.placeholder)}
              >
                {variable.placeholder}
              </SysButton>
            ))}
          </div>
        </div>
      </SysField>
      <SysField label="Remarks" span="full" error={errors.noteCn}>
        <TextInput
          value={values.noteCn}
          maxLength={1000}
          disabled={disabled}
          onChange={(e) => patch('noteCn', { noteCn: e.target.value })}
        />
      </SysField>
    </>
  );

  return (
    <SysFormModal
      width={1200}
      open
      title={isCreate ? 'Register Notification Message' : 'Edit Notification Message'}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={canWrite ? handleSubmit : undefined}
      submitting={saveMessage.isPending}
      onCancel={onClose}
    >
      {/* Register: Service Type | Channel in halves, then Recipient Type | Use | Recipient / Title / Content + Insert
          Variable / Remarks. Edit: No. | Service Type | Channel first, all on the 3-pair grid. */}
      {isCreate ? (
        <div className={styles.registerGrid}>
          <SysFieldGrid columns={2}>{headFields}</SysFieldGrid>
          <SysFieldGrid columns={3}>{restFields}</SysFieldGrid>
        </div>
      ) : (
        <SysFieldGrid columns={3}>
          <SysField label="No.">
            <TextInput value={item?.notiTmplCd ?? ''} placeholder="-" disabled />
          </SysField>
          {headFields}
          {restFields}
        </SysFieldGrid>
      )}
    </SysFormModal>
  );
}
