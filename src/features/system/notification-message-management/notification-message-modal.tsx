import { useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Input, Radio, Select, Spin } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { NOTI_CHANNEL_LABELS, NOTIFICATION_ERRORS } from '@/api/system/notification-api';
import type {
  NotiChannel,
  NotiLang,
  NotiProcessType,
  NotiRecipientType,
  NotificationMessageItem,
  NotificationMessageRequest,
  YesNo,
} from '@/api/system/notification-api';
import { SysButton, SysNotAvailable } from '../_shared/sys-list-ui';
import { SysField, SysFieldGrid, SysFormModal, SysFormSection } from '../_shared/sys-form-ui';
import { USE_YN_RADIO_OPTIONS } from '../_shared/sys-constants';
import { SYS_MESSAGES } from '../_shared/sys-messages';
import { errorMessage } from '../_shared/system-utils';
import { useFieldErrors } from '../_shared/use-field-errors';
import {
  CHANNEL_OPTIONS,
  LANG_OPTIONS,
  MENU_CODE_PATTERN,
  NOT_AVAILABLE_REASON,
  PROCESS_TYPE_OPTIONS,
  RECIPIENT_TYPE_OPTIONS,
  TEMPLATE_VARIABLES,
} from './notification-message-constants';
import { useNotificationMessage, useRecipientGroups, useSaveNotificationMessage } from './use-notification-messages';
import styles from './notification-message-management.module.scss';

// Notification Message Management - Register / Edit popup (VPA090501P01), v0.8 model.
// No. / Service Type / Remarks have no backend column yet: shown disabled and not sent.
// Menu Code / Processing Type / Language are still required by the API: kept in a "Legacy" block.

type FieldKey =
  | 'notiMediaSe'
  | 'notiRcvrSeCd'
  | 'useYn'
  | 'roleGroupId'
  | 'notiTtl'
  | 'notiCn'
  | 'menuCd'
  | 'prcsSttsCd'
  | 'langCd';

type TemplateField = 'notiTtl' | 'notiCn';

const NOT_AVAILABLE_HINT = <SysNotAvailable variant="inline">{NOT_AVAILABLE_REASON}</SysNotAvailable>;

interface MessageFormState {
  notiMediaSe: NotiChannel;
  notiRcvrSeCd: NotiRecipientType;
  useYn: YesNo;
  roleGroupId: string | undefined;
  notiTtl: string;
  notiCn: string;
  menuCd: string;
  prcsSttsCd: NotiProcessType | undefined;
  langCd: NotiLang;
}

const MESSAGES = {
  menuCode: 'Menu code must be A followed by 8 digits.',
  duplicate:
    'Another template in use already has this menu code, processing type, channel, recipient type and language.',
} as const;

function toState(item: NotificationMessageItem | null): MessageFormState {
  return {
    notiMediaSe: item?.notiMediaSe ?? 'MAIL',
    notiRcvrSeCd: item?.notiRcvrSeCd ?? 'MBR',
    useYn: item?.useYn ?? 'Y',
    roleGroupId: item?.roleGroupId || undefined,
    notiTtl: item?.notiTtl ?? '',
    notiCn: item?.notiCn ?? '',
    menuCd: item?.menuCd ?? '',
    prcsSttsCd: item?.prcsSttsCd,
    langCd: item?.langCd ?? 'VN',
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
  const { data: detail, isFetching, isError } = useNotificationMessage(notiMsgId);

  if (notiMsgId !== null && !detail) {
    return (
      <SysFormModal open title="Edit Notification Message" onCancel={onClose}>
        <Spin spinning={isFetching}>
          <div className={styles.loading}>{isError ? 'The notification message could not be loaded.' : null}</div>
        </Spin>
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
  const isCreate = item === null;
  const { toast } = useNotify();
  const recipients = useRecipientGroups();
  const saveMessage = useSaveNotificationMessage();
  const { errors, setError, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();
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
    const required: FieldKey[] = ['notiMediaSe', 'notiRcvrSeCd', 'useYn', 'notiTtl', 'notiCn', 'menuCd', 'prcsSttsCd', 'langCd'];
    if (isAdmin) required.push('roleGroupId');
    if (!checkRequired(values, required)) return false;
    if (!MENU_CODE_PATTERN.test(values.menuCd.trim())) {
      setError('menuCd', MESSAGES.menuCode);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const request: NotificationMessageRequest = {
      useYn: values.useYn,
      menuCd: values.menuCd.trim(),
      notiMediaSe: values.notiMediaSe,
      prcsSttsCd: values.prcsSttsCd as NotiProcessType,
      notiRcvrSeCd: values.notiRcvrSeCd,
      roleGroupId: isAdmin ? values.roleGroupId : undefined,
      langCd: values.langCd,
      notiTtl: values.notiTtl.trim(),
      notiCn: values.notiCn,
    };
    try {
      await saveMessage.mutateAsync({ current: item, request });
      toast.success(isCreate ? SYS_MESSAGES.registered : SYS_MESSAGES.updated);
      onClose();
    } catch (error) {
      const handled = applyApiError(error, { [NOTIFICATION_ERRORS.duplicate]: ['menuCd', MESSAGES.duplicate] });
      if (!handled) toast.error(errorMessage(error));
    }
  };

  const channelOptions =
    values.notiMediaSe === 'PUSH' ? [...CHANNEL_OPTIONS, { value: 'PUSH' as const, label: NOTI_CHANNEL_LABELS.PUSH }] : CHANNEL_OPTIONS;

  return (
    <SysFormModal
      open
      title={isCreate ? 'Register Notification Message' : 'Edit Notification Message'}
      submitText={isCreate ? 'Register' : 'Edit'}
      onSubmit={canWrite ? handleSubmit : undefined}
      submitting={saveMessage.isPending}
      onCancel={onClose}
    >
      {/* Frame layout: [No. |] Service Type | Channel / Recipient Type | Use | Recipient / Title / Content + Insert Variable / Remarks */}
      <SysFieldGrid columns={3}>
        {!isCreate && (
          <SysField label="No." hint={NOT_AVAILABLE_HINT}>
            <Input value="" placeholder="-" disabled />
          </SysField>
        )}
        <SysField label="Service Type" required span={isCreate ? 2 : 1} hint={NOT_AVAILABLE_HINT}>
          <Input placeholder="e.g. OTP Verification, Sign Up, Auction" disabled />
        </SysField>
        <SysField label="Channel" required error={errors.notiMediaSe}>
          <Select<NotiChannel>
            className={styles.fullWidth}
            value={values.notiMediaSe}
            options={channelOptions}
            disabled={disabled}
            onChange={(notiMediaSe) => patch('notiMediaSe', { notiMediaSe })}
          />
        </SysField>
        <SysField label="Recipient Type" required error={errors.notiRcvrSeCd}>
          <Radio.Group
            value={values.notiRcvrSeCd}
            options={RECIPIENT_TYPE_OPTIONS}
            disabled={disabled}
            onChange={(e) => changeRecipientType(e.target.value as NotiRecipientType)}
          />
        </SysField>
        <SysField label="Use" required error={errors.useYn}>
          <Radio.Group
            value={values.useYn}
            options={USE_YN_RADIO_OPTIONS}
            disabled={disabled}
            onChange={(e) => patch('useYn', { useYn: e.target.value as YesNo })}
          />
        </SysField>
        <SysField label="Recipient" required={isAdmin} error={errors.roleGroupId}>
          <Select<string>
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
          <Input
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
            <Input.TextArea
              value={values.notiCn}
              rows={6}
              placeholder="e.g. New membership request: {mbrName}"
              disabled={disabled}
              onChange={(e) => patch('notiCn', { notiCn: e.target.value })}
              onSelect={trackCaret('notiCn')}
              onFocus={trackCaret('notiCn')}
            />
            <div className={styles.variableBar}>
              <span className={styles.variableLabel}>Insert Variable</span>
              {TEMPLATE_VARIABLES.map((variable) => (
                <SysButton
                  key={variable.key}
                  size="small"
                  disabled={disabled}
                  title={variable.label}
                  // Keep the caret in the template field.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertVariable(variable.key)}
                >
                  {variable.key}
                </SysButton>
              ))}
            </div>
          </div>
        </SysField>
        <SysField label="Remarks" span="full" hint={NOT_AVAILABLE_HINT}>
          <Input disabled />
        </SysField>
      </SysFieldGrid>
      <SysFormSection title="Legacy (until schema change)">
        <p className={styles.legacyNote}>
          Still required by the current API to save the template; removed once the v0.8 fields are available.
        </p>
        <SysFieldGrid columns={3}>
          <SysField label="Menu Code" required error={errors.menuCd} hint={item?.menuNm}>
            <Input
              value={values.menuCd}
              maxLength={9}
              placeholder="e.g. A01010000"
              disabled={disabled}
              onChange={(e) => patch('menuCd', { menuCd: e.target.value.toUpperCase() })}
            />
          </SysField>
          <SysField label="Processing Type" required error={errors.prcsSttsCd}>
            <Select<NotiProcessType>
              className={styles.fullWidth}
              value={values.prcsSttsCd}
              placeholder="Select"
              options={PROCESS_TYPE_OPTIONS}
              disabled={disabled}
              onChange={(prcsSttsCd) => patch('prcsSttsCd', { prcsSttsCd })}
            />
          </SysField>
          <SysField label="Language" required error={errors.langCd}>
            <Select<NotiLang>
              className={styles.fullWidth}
              value={values.langCd}
              options={LANG_OPTIONS}
              disabled={disabled}
              onChange={(langCd) => patch('langCd', { langCd })}
            />
          </SysField>
        </SysFieldGrid>
      </SysFormSection>
    </SysFormModal>
  );
}
