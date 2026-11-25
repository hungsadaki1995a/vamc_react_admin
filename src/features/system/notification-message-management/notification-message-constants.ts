import type { NotiChannel, NotiRecipientType } from '@/api/system/notification-api';
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

/** Variables shown until the server list (GET /variables) is loaded; the three drawn in the v0.8 frame. */
export const FALLBACK_TEMPLATE_VARIABLES = [
  { name: 'mbrName', placeholder: '{mbrName}', description: 'Member name', secret: false },
  { name: 'otpCode', placeholder: '{otpCode}', description: '6-digit verification code', secret: true },
  { name: 'expireTime', placeholder: '{expireTime}', description: 'Expiry time of the code or link', secret: false },
] as const;

/** Web role groups (Web Menu Permission: logged-out visitor, member types), not staff groups: hidden from Recipient. */
export const HIDDEN_ROLE_GROUP_IDS: readonly string[] = ['RG00100', 'RG00200'];
