import { apiDelete, apiDownload, apiGet, apiPatch, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import type { YesNo } from '@/config/sys-constants';

// Zalo API — ZaloStatusController (/api/v1/zalo/status), ZaloUserController (/api/v1/zalo/users, menu A09050300),
// ZaloTemplateController (/api/v1/zalo/templates, menu A09050400). Tables ZALO_USER / ZALO_TPL_INFO / ZALO_CHG_HSTRY.
// Sending limits, prices and channel stop: zalo-limit-api.ts; OA connection: zalo-connection-api.ts.

/** ZNS = Zalo Notification Service (by phone), OA = Official Account message (followers only). */
export type ZaloSendMode = 'ZNS' | 'OA';
/** LINKED = bound to an account, PENDING = waiting for a link. */
export type ZaloLinkStatus = 'LINKED' | 'PENDING';
/** MBR = member (MBR_NO), EMP = employee (EMP_NO). */
export type ZaloUserType = 'MBR' | 'EMP';
export type ZaloLinkMethod = 'AUTO' | 'MANUAL';
/** Message type of a template (ZALO_TPL_INFO.ZALO_MSG_TYPE_CD); sets the unit price of a ZNS sending. */
export type ZaloTemplateMsgType = 'INVITE' | 'OTP' | 'STATUS';
/** Message type of a sending: TEST = test send, OA = OA message (free), else the template type. */
export type ZaloMsgType = ZaloTemplateMsgType | 'TEST' | 'OA';

/** One change of a template, limit rule, user link… (ZALO_CHG_HSTRY), newest first. */
export interface ZaloChangeHistory {
  /** ISO local date-time. */
  chgDt: string;
  /** EMP_NO, `SYSTEM` (automatic) or `ZALO` (event from Zalo). */
  chgBy?: string;
  /** Changed item, e.g. `Content`, `Status`; Zalo users: FOLLOW, SHARE_PHONE, LINK_AUTO, LINK_MANUAL, UNLINK. */
  chgItemNm: string;
  /** Null when created. */
  bfrVal?: string | null;
  /** Null when removed. */
  aftrVal?: string | null;
}

export interface ZaloStatus {
  /** Real sending on (`zalo.enabled`). */
  enabled: boolean;
  /** Demo mode: sending is simulated and simulate-follow is available. */
  mockMode: boolean;
  /** NOTIFICATION_ADDRESS_HASH_KEY configured (phone index, simulate-follow). */
  phoneIndexReady: boolean;
}

// ── Templates (A09050400) ────────────────────────────────────────────────────

export interface ZaloTemplate {
  tplCd: string;
  /** Process group, e.g. MBR_JOIN, AUTH. */
  procGrpCd: string;
  tplNm: string;
  zaloSndMode: ZaloSendMode;
  /** Template id given by Zalo (ZNS only). */
  znsTplId?: string;
  /** Text with `{{variables}}`. */
  tplCn: string;
  /** JSON object variable → ZNS parameter. */
  paramMapCn?: string;
  useYn: YesNo;
  /** Null for rows older than dev-sync 77. */
  zaloMsgTypeCd?: ZaloTemplateMsgType | null;
  /** Unit price in effect today, VND per send; OA templates 0; null when no price is set. */
  untprc?: number | null;
  /** ISO local date-time. */
  crtDt?: string;
  crtBy?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface ZaloTemplateSearch {
  procGrpCd?: string;
  zaloSndMode?: ZaloSendMode | '';
  useYn?: YesNo | '';
  /** Code or name, partial. */
  keyword?: string;
}

export interface ZaloTemplateRequest {
  procGrpCd: string;
  /** ≤ 255 */
  tplNm: string;
  zaloSndMode: ZaloSendMode;
  /** ≤ 100; on update an empty string clears it. */
  znsTplId?: string;
  /** ≤ 4000 */
  tplCn: string;
  /** JSON object, ≤ 4000; on update an empty string clears it. */
  paramMapCn?: string;
  /** Default STATUS. */
  zaloMsgTypeCd?: ZaloTemplateMsgType;
  useYn?: YesNo;
}

export interface CreateZaloTemplateRequest extends ZaloTemplateRequest {
  /** A-Z 0-9 _, 3–20 characters. */
  tplCd: string;
}

export interface ZaloPreviewRequest {
  tplCn: string;
  /** Values that replace the sample data. */
  params?: Record<string, string>;
}

export interface ZaloPreview {
  text: string;
  /** Variables left as `{{name}}`. */
  missingVariables: string[];
}

export interface ZaloSendResult {
  /** LOG_NOTI_SNDNG id (Notification Send History). */
  logId: string;
  /** `MOCK-…` in demo mode. */
  extMsgId?: string;
  zaloSndMode: ZaloSendMode;
  mock: boolean;
}

/** Sample variables filled by the server on preview / test send. */
export const ZALO_SAMPLE_VARIABLES = ['mbrNm', 'mbrNo', 'empNm', 'otp', 'validMinutes', 'link', 'reason'] as const;

// ── Users (A09050300) ────────────────────────────────────────────────────────

export interface ZaloUser {
  /** `MOCK-…` in demo mode. */
  zaloUserId: string;
  /** Masked. */
  zaloNm?: string;
  /** Masked. */
  telno?: string;
  linkStatus: ZaloLinkStatus;
  flwYn?: YesNo;
  flwDt?: string;
  shareAgreYn?: YesNo;
  shareAgreDt?: string;
  lstItrctDt?: string;
  userTypeCd?: ZaloUserType;
  userNo?: string;
  /** Masked. */
  userNm?: string;
  linkMthdCd?: ZaloLinkMethod;
  linkDt?: string;
  crtDt?: string;
}

export interface ZaloUserSearch {
  linkStatus?: ZaloLinkStatus | '';
  followYn?: YesNo | '';
  userTypeCd?: ZaloUserType | '';
  /** Zalo name (partial) or account number (exact). */
  keyword?: string;
}

export interface ZaloUserSummary {
  linked: number;
  pending: number;
  following: number;
  /** Successful invitations sent today by the signed-in employee. */
  invitesToday: number;
  /** Daily invitation limit of the signed-in employee (active SENDER INVITE rule); null = no limit. */
  inviteLimit?: number | null;
  inviteLmtCd?: string | null;
}

/** Zalo message sent to a user (LOG_NOTI_SNDNG, 20 newest); the content is never returned. */
export interface ZaloUserMessage {
  logId: string;
  sentAt: string;
  tplCd?: string;
  mode?: ZaloSendMode;
  success: boolean;
  /** Phone and secrets masked. */
  failRsn?: string;
}

export interface LinkZaloUserRequest {
  userTypeCd: ZaloUserType;
  /** MBR_NO or EMP_NO, ≤ 10. */
  userNo: string;
}

export interface ZaloInvitationRequest {
  /** 0xxxxxxxxx or 84xxxxxxxxx */
  phone: string;
  /** ≤ 100, server default "Quý khách". */
  recipientName?: string;
}

export interface SimulateZaloFollowRequest {
  /** ≤ 255 */
  zaloNm: string;
  phone: string;
}

export interface ZaloSimulateResult {
  user: ZaloUser;
  /** Linked now to the only account with this phone. */
  autoLinked: boolean;
  /** Accounts having this phone. */
  matchCount: number;
}

/** Server error codes the screens react to (ZAL001–ZAL024). */
export const ZALO_ERRORS = {
  templateNotFound: 'ZAL001',
  templateDuplicate: 'ZAL002',
  znsTemplateIdRequired: 'ZAL003',
  templateDisabled: 'ZAL004',
  invalidParamMap: 'ZAL005',
  userNotFound: 'ZAL006',
  accountNotFound: 'ZAL007',
  accountAlreadyLinked: 'ZAL008',
  userAlreadyLinked: 'ZAL009',
  userNotLinked: 'ZAL010',
  simulationDisabled: 'ZAL011',
  phoneIndexUnavailable: 'ZAL012',
  sendFailed: 'ZAL013',
  recipientNotReachable: 'ZAL014',
  invalidPhone: 'ZAL015',
  /** Sending stopped on Zalo Sending Limits; the message was logged as held. */
  channelStopped: 'ZAL016',
  /** Blocked by a limit rule; the server message names the rule (LMT-…). */
  limitExceeded: 'ZAL017',
  limitRuleNotFound: 'ZAL018',
  limitExceptionScope: 'ZAL019',
  limitExceptionNotFound: 'ZAL020',
  channelAlreadyStopped: 'ZAL021',
  channelNotStopped: 'ZAL022',
  oaPriceNotZero: 'ZAL023',
  limitRuleInvalid: 'ZAL024',
} as const;

const BASE = '/api/v1/zalo';
const TEMPLATES = `${BASE}/templates`;
const USERS = `${BASE}/users`;

/** Read permission of A09050300. */
export const getZaloStatus = () => apiGet<ZaloStatus>(`${BASE}/status`);

export const getZaloTemplates = (search: ZaloTemplateSearch, query: PageQuery) =>
  apiGet<PageResponse<ZaloTemplate>>(TEMPLATES, { ...search, ...query });

export const getZaloTemplate = (tplCd: string) => apiGet<ZaloTemplate>(`${TEMPLATES}/${encodeURIComponent(tplCd)}`);

export const createZaloTemplate = (request: CreateZaloTemplateRequest) => apiPost<ZaloTemplate>(TEMPLATES, request);

export const updateZaloTemplate = (tplCd: string, request: ZaloTemplateRequest) =>
  apiPut<ZaloTemplate>(`${TEMPLATES}/${encodeURIComponent(tplCd)}`, request);

export const getZaloTemplateHistory = (tplCd: string) =>
  apiGet<ZaloChangeHistory[]>(`${TEMPLATES}/${encodeURIComponent(tplCd)}/history`);

export const downloadZaloTemplatesExcel = (search: ZaloTemplateSearch) =>
  apiDownload(`${TEMPLATES}/excel`, 'zalo-templates.xlsx', search);

export const changeZaloTemplateUse = (tplCd: string, useYn: YesNo) =>
  apiPatch<ZaloTemplate>(`${TEMPLATES}/${encodeURIComponent(tplCd)}/use`, { useYn });

export const previewZaloTemplate = (request: ZaloPreviewRequest) => apiPost<ZaloPreview>(`${TEMPLATES}/preview`, request);

/** Demo mode: simulated; the sending shows in Notification Send History. */
export const testSendZaloTemplate = (tplCd: string, phone: string, params?: Record<string, string>) =>
  apiPost<ZaloSendResult>(`${TEMPLATES}/${encodeURIComponent(tplCd)}/test-send`, { phone, params });

export const getZaloUsers = (search: ZaloUserSearch, query: PageQuery) =>
  apiGet<PageResponse<ZaloUser>>(USERS, { ...search, ...query });

export const getZaloUserSummary = () => apiGet<ZaloUserSummary>(`${USERS}/summary`);

/** Masked like the list. */
export const downloadZaloUsersExcel = (search: ZaloUserSearch) => apiDownload(`${USERS}/excel`, 'zalo-users.xlsx', search);

export const getZaloUser = (zaloUserId: string) => apiGet<ZaloUser>(`${USERS}/${encodeURIComponent(zaloUserId)}`);

/** Follow, phone share, link and unlink events (50 newest). */
export const getZaloUserHistory = (zaloUserId: string) =>
  apiGet<ZaloChangeHistory[]>(`${USERS}/${encodeURIComponent(zaloUserId)}/history`);

export const getZaloUserMessages = (zaloUserId: string) =>
  apiGet<ZaloUserMessage[]>(`${USERS}/${encodeURIComponent(zaloUserId)}/messages`);

/** Sends a template in use to this user with the sample data, counted as TEST (limit rules apply). */
export const sendZaloUserTestMessage = (zaloUserId: string, tplCd: string) =>
  apiPost<ZaloSendResult>(`${USERS}/${encodeURIComponent(zaloUserId)}/test-message`, { tplCd });

export const linkZaloUser = (zaloUserId: string, request: LinkZaloUserRequest) =>
  apiPut<ZaloUser>(`${USERS}/${encodeURIComponent(zaloUserId)}/link`, request);

export const unlinkZaloUser = (zaloUserId: string) => apiDelete<ZaloUser>(`${USERS}/${encodeURIComponent(zaloUserId)}/link`);

/** ZNS template MBR_JOIN_WELCOME with the OA follow link. */
export const sendZaloInvitation = (request: ZaloInvitationRequest) => apiPost<ZaloSendResult>(`${USERS}/invitations`, request);

/** Demo mode only (404 ZAL011 otherwise): follow + phone share, auto link on a single match. */
export const simulateZaloFollow = (request: SimulateZaloFollowRequest) =>
  apiPost<ZaloSimulateResult>(`${USERS}/simulate-follow`, request);
