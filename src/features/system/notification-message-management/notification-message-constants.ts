import type { NotiChannel, NotiLang, NotiProcessType, NotiRecipientType } from '@/api/system/notification-api';
import { NOTI_CHANNEL_LABELS, NOTI_RECIPIENT_LABELS } from '@/api/system/notification-api';
import { ALL } from '../_shared/sys-constants';

// Options and texts of Notification Message Management (v0.8 wording).

/** Channels offered by the v0.8 design (PUSH is legacy and only shown for existing rows). */
export const CHANNEL_OPTIONS: { value: NotiChannel; label: string }[] = [
  { value: 'MAIL', label: NOTI_CHANNEL_LABELS.MAIL },
  { value: 'ZALO', label: NOTI_CHANNEL_LABELS.ZALO },
];

export const CHANNEL_FILTER_OPTIONS: { value: NotiChannel | ''; label: string }[] = [
  { value: ALL, label: 'All' },
  ...CHANNEL_OPTIONS,
];

export const RECIPIENT_TYPE_OPTIONS: { value: NotiRecipientType; label: string }[] = [
  { value: 'MBR', label: NOTI_RECIPIENT_LABELS.MBR },
  { value: 'EMP', label: NOTI_RECIPIENT_LABELS.EMP },
];

export const RECIPIENT_TYPE_FILTER_OPTIONS: { value: NotiRecipientType | ''; label: string }[] = [
  { value: ALL, label: 'All' },
  ...RECIPIENT_TYPE_OPTIONS,
];

/** Legacy fields the API still requires until the NOTI_MSG_MNG schema change. */
export const PROCESS_TYPE_OPTIONS: { value: NotiProcessType; label: string }[] = [
  { value: 'RCPT', label: 'RCPT - Receipt' },
  { value: 'PRCS', label: 'PRCS - Processing' },
  { value: '1ST_ATRZ', label: '1ST_ATRZ - 1st Approval' },
  { value: '2ND_ATRZ', label: '2ND_ATRZ - 2nd Approval' },
  { value: 'CMPTN', label: 'CMPTN - Completion' },
];

export const LANG_OPTIONS: { value: NotiLang; label: string }[] = [
  { value: 'VN', label: 'VN' },
  { value: 'EN', label: 'EN' },
  { value: 'KR', label: 'KR' },
];

export const MENU_CODE_PATTERN = /^A\d{8}$/;

/**
 * Variables offered by [Insert Variable]. TODO(api): replace with the server list once the
 * send timing / variable registry exists; the names follow the design example `{mbrName}`.
 */
export const TEMPLATE_VARIABLES = [
  { key: '{mbrName}', label: 'Member Name' },
  { key: '{mbrId}', label: 'Member ID' },
  { key: '{empName}', label: 'Staff Name' },
  { key: '{serviceName}', label: 'Service' },
  { key: '{applicationNo}', label: 'Application No.' },
  { key: '{processDate}', label: 'Date' },
  { key: '{linkUrl}', label: 'Link' },
] as const;

export const NOT_AVAILABLE_HINT = 'Not available yet (waiting for a schema change); not saved.';
