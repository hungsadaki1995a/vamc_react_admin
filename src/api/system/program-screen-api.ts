import { apiDelete, apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import type { YesNo } from './code-group-api';

// ── Program Management (A09040100) ───────────────────────────────────────────
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

// ── Screen Management (A09040200) ────────────────────────────────────────────
/** W = Web, A = Admin (MENU_SE_CD of the Business menu). */
export type ScreenType = 'W' | 'A';

export interface ScreenItem {
  scrnId: string;
  /** Absent for legacy rows without a Business menu. */
  sysSeCd?: ScreenType;
  /** Business: 1Depth menu code. */
  menuCd?: string;
  menuNmVn?: string;
  menuNmEn?: string;
  scrnNm?: string;
  cmpntPathNm?: string;
  /** Label Key. */
  lblCd?: string;
  popupYn?: YesNo;
  /** Remarks. */
  scrnExpln?: string;
  /** Legacy columns (not on the v0.8 screen). */
  prgrmCd?: string;
  scrnSeq?: number;
  useYn?: YesNo;
  crtDt?: string;
  crtByNm?: string;
}

/** Empty string = All (dropped from the query). */
export interface ScreenSearch {
  sysSeCd?: ScreenType | '';
  menuCd?: string;
  /** Partial match. */
  scrnId?: string;
  /** Partial match. */
  scrnNm?: string;
}

export interface ScreenRequest {
  sysSeCd: ScreenType;
  menuCd: string;
  scrnId: string;
  scrnNm: string;
  cmpntPathNm: string;
  lblCd?: string;
  popupYn: YesNo;
  scrnExpln?: string;
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
/** Errors: SYS409 duplicate Screen ID, SCR001 Business not a 1Depth menu of the Type, SCR002 unknown Label Key. */
export const createScreen = (req: ScreenRequest) => apiPost<ScreenItem>(SCRN_BASE, req);
export const updateScreen = (scrnId: string, req: ScreenRequest) =>
  apiPut<ScreenItem>(`${SCRN_BASE}/${encodeURIComponent(scrnId)}`, req);
/** Errors: SYS409 when labels still reference the screen. */
export const deleteScreens = (scrnIds: string[]) => apiDelete<number>(SCRN_BASE, { scrnIds });
/** Same filters and sort as the list. */
export const downloadScreensExcel = (search: ScreenSearch, sort?: Pick<PageQuery, 'sortBy' | 'sortDirection'>) =>
  apiDownload(`${SCRN_BASE}/excel`, 'screens.xlsx', { ...search, ...sort });
