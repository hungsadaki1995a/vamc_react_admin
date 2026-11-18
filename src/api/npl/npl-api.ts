import { apiDelete, apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';

// ── NPL Management (A03010100) ───────────────────────────────────────────────
export interface NplItem {
  bndCd: string;
  bndNm: string;
  bndEngNm?: string;
  expsrYn?: 'Y' | 'N';
  mscrnPstgYn?: 'Y' | 'N';
  rcmdtnYn?: 'Y' | 'N';
  bndSttsCd?: string;
  nplAstSeCd?: string;
  lotYn?: 'Y' | 'N';
  bndLotId?: string;
  bndLotNo?: string;
  rprsDbtrCd?: string;
  dbtrCnt?: number;
  cltrAstCnt?: number;
  loanExcnDmy?: string;
  loanMtryDmy?: string;
  crncCd?: string;
  bndEvlAmt?: number;
}

export interface NplSearch {
  loanFromDt?: string;
  loanToDt?: string;
  expsrYn?: 'Y' | 'N';
  lotYn?: 'Y' | 'N';
  bndSttsCds?: string[];
  bndCd?: string;
  bndNm?: string;
  dbtrCd?: string;
}

export const getNpls = (search: NplSearch, page: number, size: number) =>
  apiGet<PageResponse<NplItem>>('/api/v1/npls', { ...search, page, size });
export const getNpl = (bndCd: string) => apiGet<NplItem>(`/api/v1/npls/${bndCd}`);

// ── Collateral Asset Management (A03010200) ──────────────────────────────────
export interface CollateralAssetItem {
  cltrAstCd: string;
  cltrAstNm: string;
  cltrAstEngNm?: string;
  expsrYn?: 'Y' | 'N';
  rprsBndCd?: string;
  nplAstSeCd?: string;
  bndCnt?: number;
  cltrAstTypeCd?: string;
  cltrAstTypeNm?: string;
}

export interface CollateralSearch {
  expsrYn?: 'Y' | 'N';
  notarYn?: 'Y' | 'N';
  cltrAstTypeCd?: string;
  cltrAstCd?: string;
  cltrAstNm?: string;
}

export const getCollateralAssets = (search: CollateralSearch, page: number, size: number) =>
  apiGet<PageResponse<CollateralAssetItem>>('/api/v1/collateral-assets', { ...search, page, size });
export const getCollateralAsset = (cltrAstCd: string) =>
  apiGet<Record<string, unknown>>(`/api/v1/collateral-assets/${cltrAstCd}`);
export const downloadCollateralAssetsExcel = (search: Record<string, unknown>) =>
  apiDownload('/api/v1/collateral-assets/excel', 'collateral-assets.xlsx', search);

// ── Debtor Management (A03010300) ────────────────────────────────────────────
export interface DebtorItem {
  dbtrCd: string;
  dbtrTypeCd?: string;
  dbtrNm: string;
  dbtrEngNm?: string;
  cicCd?: string;
  brno?: string;
  uiiNo?: string;
  crncCd?: string;
  cptl?: number;
}

export interface DebtorSearch {
  crtFromDt?: string;
  crtToDt?: string;
  dbtrTypeCd?: 'P' | 'O';
  entSalsSttsYn?: 'Y' | 'N';
  dbtrCd?: string;
  dbtrNm?: string;
  cicCd?: string;
}

export const getDebtors = (search: DebtorSearch, page: number, size: number) =>
  apiGet<PageResponse<DebtorItem>>('/api/v1/debtors', { ...search, page, size });
export const getDebtor = (dbtrCd: string) => apiGet<Record<string, unknown>>(`/api/v1/debtors/${dbtrCd}`);
export const deleteDebtors = (dbtrCds: string[]) => apiDelete<void>('/api/v1/debtors', { dbtrCds });
export const downloadDebtorsExcel = (search: Record<string, unknown>) =>
  apiDownload('/api/v1/debtors/excel', 'debtors.xlsx', search);

// ── NPL LOT Change Management (A03010400) ────────────────────────────────────
export interface NplLotItem {
  bndLotId: string;
  bndLotNo: string;
  bndLotNm: string;
  nplCnt?: number;
  bndLotExpln?: string;
  crtDt?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnByNm?: string;
}

export interface NplLotSearch {
  bndLotNo?: string;
  bndLotNm?: string;
}

export const getNplLots = (search: NplLotSearch, page: number, size: number) =>
  apiGet<PageResponse<NplLotItem>>('/api/v1/npl-lots', { ...search, page, size });
export const getNplLot = (bndLotId: string) => apiGet<NplLotItem>(`/api/v1/npl-lots/${bndLotId}`);
export const createNplLot = (req: { bndLotNo?: string; bndLotNm: string; bndLotExpln?: string }) =>
  apiPost<NplLotItem>('/api/v1/npl-lots', req);
export const updateNplLot = (bndLotId: string, req: { bndLotNm: string; bndLotExpln?: string }) =>
  apiPut<NplLotItem>(`/api/v1/npl-lots/${bndLotId}`, req);
export const deleteNplLot = (bndLotId: string) => apiDelete<void>(`/api/v1/npl-lots/${bndLotId}`);
export const downloadNplLotsExcel = (search: Record<string, unknown>) =>
  apiDownload('/api/v1/npl-lots/excel', 'npl-lots.xlsx', search);
