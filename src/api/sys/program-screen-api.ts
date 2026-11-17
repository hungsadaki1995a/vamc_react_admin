import { apiDelete, apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-util';
import type { PageResponse } from '@/api/common/api-util';

export interface ProgramItem {
  prgrmCd: string;
  menuCd: string;
  prgrmSeCd: string;
  prgrmNm: string;
  prgrmExpln?: string;
  prgrmSeq: number;
  useYn: 'Y' | 'N';
  crtDt?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnByNm?: string;
}

export interface ProgramSearch {
  useYn?: 'Y' | 'N';
  prgrmSeCd?: string;
  prgrmCd?: string;
  prgrmNm?: string;
  menuCd?: string;
}

export interface ProgramRequest {
  prgrmCd: string;
  menuCd: string;
  prgrmSeCd: string;
  prgrmNm: string;
  prgrmExpln?: string;
  prgrmSeq: number;
  useYn: 'Y' | 'N';
}

export interface ScreenItem {
  scrnId: string;
  prgrmCd: string;
  prgrmNm?: string;
  scrnExpln?: string;
  scrnSeq: number;
  useYn: 'Y' | 'N';
  crtDt?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnByNm?: string;
}

export interface ScreenSearch {
  useYn?: 'Y' | 'N';
  prgrmCd?: string;
  scrnId?: string;
  keyword?: string;
}

export interface ScreenRequest {
  scrnId: string;
  prgrmCd: string;
  scrnExpln?: string;
  scrnSeq: number;
  useYn: 'Y' | 'N';
}

const PRGRM_BASE = '/api/v1/programs';
const SCRN_BASE = '/api/v1/screens';

export const getPrograms = (search: ProgramSearch, page: number, size: number) =>
  apiGet<PageResponse<ProgramItem>>(PRGRM_BASE, { ...search, page, size });
export const getProgramOptions = (useYn?: string, menuCd?: string) =>
  apiGet<ProgramItem[]>(`${PRGRM_BASE}/options`, { useYn, menuCd });
export const createProgram = (req: ProgramRequest) => apiPost<ProgramItem>(PRGRM_BASE, req);
export const updateProgram = (prgrmCd: string, req: ProgramRequest) =>
  apiPut<ProgramItem>(`${PRGRM_BASE}/${prgrmCd}`, req);
export const deletePrograms = (prgrmCds: string[]) => apiDelete<number>(PRGRM_BASE, { prgrmCds });
export const downloadProgramsExcel = (search: ProgramSearch) =>
  apiDownload(`${PRGRM_BASE}/excel`, 'programs.xlsx', search);

export const getScreens = (search: ScreenSearch, page: number, size: number) =>
  apiGet<PageResponse<ScreenItem>>(SCRN_BASE, { ...search, page, size });
export const createScreen = (req: ScreenRequest) => apiPost<ScreenItem>(SCRN_BASE, req);
export const updateScreen = (scrnId: string, req: ScreenRequest) =>
  apiPut<ScreenItem>(`${SCRN_BASE}/${scrnId}`, req);
export const deleteScreens = (scrnIds: string[]) => apiDelete<number>(SCRN_BASE, { scrnIds });
export const downloadScreensExcel = (search: ScreenSearch) =>
  apiDownload(`${SCRN_BASE}/excel`, 'screens.xlsx', search);
