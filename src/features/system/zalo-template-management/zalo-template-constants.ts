import i18n from '@/lib/i18n';
import type { ZaloSendMode, ZaloTemplate, ZaloTemplateMsgType, ZaloTemplateRequest } from '@/api/system/zalo-api';

// Constants and form helpers of Zalo Templates (menu A09050400).

/** Process groups of the seeded templates (PROC_GRP_CD); labels in `zalo.processes`. */
export const ZALO_PROCESS_GROUPS = ['MBR_JOIN', 'AUTH'] as const;

/** Message types a template can have; labels in `zalo.msgTypes`. */
export const ZALO_TEMPLATE_MSG_TYPES: ZaloTemplateMsgType[] = ['INVITE', 'OTP', 'STATUS'];

/** Same rule as the server (CreateZaloTemplateRequest.TPL_CD_PATTERN). */
export const ZALO_TPL_CD_PATTERN = /^[A-Z0-9_]{3,20}$/;

export type TemplateFieldKey = 'tplCd' | 'procGrpCd' | 'tplNm' | 'zaloSndMode' | 'zaloMsgTypeCd' | 'znsTplId' | 'tplCn' | 'paramMapCn';

export interface TemplateFormState {
  tplCd: string;
  procGrpCd: string;
  tplNm: string;
  zaloSndMode: ZaloSendMode;
  zaloMsgTypeCd: ZaloTemplateMsgType;
  znsTplId: string;
  tplCn: string;
  paramMapCn: string;
}

/** Form values of a template; a copy keeps everything but the code. */
export function toFormState(template: ZaloTemplate | null, copy = false): TemplateFormState {
  return {
    tplCd: copy ? '' : (template?.tplCd ?? ''),
    procGrpCd: template?.procGrpCd ?? ZALO_PROCESS_GROUPS[0],
    tplNm: template?.tplNm ?? '',
    zaloSndMode: template?.zaloSndMode ?? 'ZNS',
    zaloMsgTypeCd: template?.zaloMsgTypeCd ?? 'STATUS',
    znsTplId: template?.znsTplId ?? '',
    tplCn: template?.tplCn ?? '',
    paramMapCn: template?.paramMapCn ?? '',
  };
}

/** Request body; an empty string clears the stored value on update and OA templates have no ZNS id. */
export function toRequest(values: TemplateFormState): ZaloTemplateRequest {
  const isZns = values.zaloSndMode === 'ZNS';
  return {
    procGrpCd: values.procGrpCd,
    tplNm: values.tplNm.trim(),
    zaloSndMode: values.zaloSndMode,
    zaloMsgTypeCd: values.zaloMsgTypeCd,
    znsTplId: isZns ? values.znsTplId.trim() : '',
    tplCn: values.tplCn,
    paramMapCn: values.paramMapCn.trim(),
  };
}

/** True for an empty value or a JSON object (the server rejects arrays and scalars with ZAL005). */
export function isParamMap(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

/** Client checks beyond "required": code pattern (create) and parameter map shape. */
export function formatErrors(values: TemplateFormState, isCreate: boolean): Partial<Record<TemplateFieldKey, string>> {
  const errors: Partial<Record<TemplateFieldKey, string>> = {};
  if (isCreate && !ZALO_TPL_CD_PATTERN.test(values.tplCd.trim())) errors.tplCd = i18n.t('messages.zalo.invalidTplCd');
  if (!isParamMap(values.paramMapCn)) errors.paramMapCn = i18n.t('messages.zalo.invalidParamMap');
  return errors;
}

/**
 * Price line beside the channel: OA is free; a ZNS template shows the unit price the server returned for its saved
 * channel and type, and a hint when the form changed them (prices live on Zalo Sending Limits).
 */
export function priceText(values: TemplateFormState, saved: ZaloTemplate | null): string {
  if (values.zaloSndMode === 'OA') return i18n.t('zalo.templates.detail.free');
  const unchanged = saved?.zaloSndMode === 'ZNS' && (saved.zaloMsgTypeCd ?? 'STATUS') === values.zaloMsgTypeCd;
  if (!unchanged) return i18n.t('zalo.templates.detail.priceUnknown');
  if (saved.untprc == null) return i18n.t('zalo.templates.detail.priceNone');
  return i18n.t('zalo.templates.detail.price', { price: saved.untprc.toLocaleString('en-US') });
}

/** True when the form differs from the saved template. */
export function isDirty(values: TemplateFormState, saved: ZaloTemplate): boolean {
  const base = toFormState(saved);
  return (Object.keys(base) as (keyof TemplateFormState)[]).some((key) => base[key] !== values[key]);
}
