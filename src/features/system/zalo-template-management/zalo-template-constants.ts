// Constants of Zalo Templates (menu A09050400).

/** Process groups of the seeded templates (PROC_GRP_CD); labels in `zalo.processes`. */
export const ZALO_PROCESS_GROUPS = ['MBR_JOIN', 'AUTH'] as const;

/** Same rule as the server (CreateZaloTemplateRequest.TPL_CD_PATTERN). */
export const ZALO_TPL_CD_PATTERN = /^[A-Z0-9_]{3,20}$/;

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
