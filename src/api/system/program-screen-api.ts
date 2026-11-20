import { apiDelete, apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import type { YesNo } from './code-group-api';

// ── Program Management (A06040100) ───────────────────────────────────────────
export type ProgramType = 'PAGE' | 'POPUP';

export interface ProgramItem {
  prgrmCd: string;
  menuCd: string;
  prgrmSeCd: ProgramType;
  prgrmNm: string;
  prgrmExpln?: string;
  prgrmSeq: number;
  useYn: YesNo;
  crtDt?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnByNm?: string;
}

/** Empty string = All (dropped from the query). */
export interface ProgramSearch {
  useYn?: YesNo | '';
  prgrmSeCd?: ProgramType | '';
  prgrmCd?: string;
  prgrmNm?: string;
}

export interface ProgramRequest {
  prgrmCd: string;
  menuCd: string;
  prgrmSeCd: ProgramType;
  prgrmNm: string;
  prgrmExpln?: string;
  prgrmSeq: number;
  useYn: YesNo;
}

// ── Screen Management (A06040200) ────────────────────────────────────────────
export interface ScreenItem {
  scrnId: string;
  prgrmCd: string;
  prgrmNm?: string;
  /** Shown as "Remarks" in v0.8. */
  scrnExpln?: string;
  scrnSeq: number;
  useYn: YesNo;
  crtDt?: string;
  crtByNm?: string;
}

export interface ScreenSearch {
  scrnId?: string;
  /** Matches the description or program name. */
  keyword?: string;
}

/**
 * Current SCRN_MNG columns. The v0.8 fields (type, business, name, component path,
 * label key, popup) are not stored yet. TODO(schema): SCRN_MNG DDL.
 */
export interface ScreenRequest {
  scrnId: string;
  prgrmCd: string;
  scrnExpln?: string;
  scrnSeq: number;
  useYn: YesNo;
}

export interface ProgramOption {
  prgrmCd: string;
  menuCd: string;
  prgrmNm: string;
}

const PRGRM_BASE = '/api/v1/programs';
const SCRN_BASE = '/api/v1/screens';

export const getPrograms = (search: ProgramSearch, page: PageQuery) =>
  apiGet<PageResponse<ProgramItem>>(PRGRM_BASE, { ...search, ...page });
export const getProgramOptions = (useYn?: YesNo) =>
  apiGet<ProgramOption[]>(`${PRGRM_BASE}/options`, { useYn }, []);
/** Errors: SYS409 duplicate code, SYS400 unknown menu code. */
export const createProgram = (req: ProgramRequest) => apiPost<ProgramItem>(PRGRM_BASE, req);
export const updateProgram = (prgrmCd: string, req: ProgramRequest) =>
  apiPut<ProgramItem>(`${PRGRM_BASE}/${encodeURIComponent(prgrmCd)}`, req);
export const downloadProgramsExcel = (search: ProgramSearch) =>
  apiDownload(`${PRGRM_BASE}/excel`, 'programs.xlsx', search);

export const getScreens = (search: ScreenSearch, page: PageQuery) =>
  apiGet<PageResponse<ScreenItem>>(SCRN_BASE, { ...search, ...page });
/** Errors: SYS409 duplicate screen ID, SYS400 unknown program code. */
export const createScreen = (req: ScreenRequest) => apiPost<ScreenItem>(SCRN_BASE, req);
export const updateScreen = (scrnId: string, req: ScreenRequest) =>
  apiPut<ScreenItem>(`${SCRN_BASE}/${encodeURIComponent(scrnId)}`, req);
/** Errors: SYS409 when labels still reference the screen. */
export const deleteScreens = (scrnIds: string[]) => apiDelete<number>(SCRN_BASE, { scrnIds });
export const downloadScreensExcel = (search: ScreenSearch) =>
  apiDownload(`${SCRN_BASE}/excel`, 'screens.xlsx', search);
