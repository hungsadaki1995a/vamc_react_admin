import { apiDelete, apiDownload, apiGet, apiPatch, apiPost, apiPut } from '@/api/common/api-util';
import type { PageResponse } from '@/api/common/api-util';

// ── Exchange Rate (A06010500) ────────────────────────────────────────────────
export interface ExchangeRateItem {
  currencyCode: string;
  currencyName: string;
  cashBuy?: number | string | null;
  transferBuy?: number | string | null;
  sell?: number | string | null;
  displayed: string | boolean;
  inUse: string | boolean;
  referenceDateTime?: string;
  lastModifiedAt?: string;
}

export const getExchangeRates = (displayedOnly = false) =>
  apiGet<ExchangeRateItem[]>('/api/v1/contents/service-guides/exchange-rates', { displayedOnly });

export const syncExchangeRates = () =>
  apiPost<{ total?: number; success?: number; fail?: number }>('/api/v1/contents/service-guides/exchange-rates/sync', {});

// ── Terms & Policies (A06010700) ─────────────────────────────────────────────
export interface TermsPolicyItem {
  termsId: string;
  type: string;
  version: string;
  effectiveDate?: string;
  title: string;
  titleEn?: string;
  published: 'Y' | 'N';
  current?: boolean;
  editable?: boolean;
  crtDt?: string;
  crtBy?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface TermsPolicyDetail extends TermsPolicyItem {
  content?: string;
  contentEn?: string;
}

export interface TermsPolicySearch {
  type?: string;
  published?: 'Y' | 'N';
  keyword?: string;
}

export interface TermsPolicyRequest {
  type?: string;
  version: string;
  effectiveDate?: string;
  title: string;
  titleEn?: string;
  content?: string;
  contentEn?: string;
  published?: 'Y' | 'N';
}

const TERMS_BASE = '/api/v1/contents/terms-policies';
export const getTermsPolicies = (search: TermsPolicySearch, page: number, size: number) =>
  apiGet<PageResponse<TermsPolicyItem>>(TERMS_BASE, { ...search, page, size });
export const getTermsPolicy = (termsId: string) => apiGet<TermsPolicyDetail>(`${TERMS_BASE}/${termsId}`);
export const createTermsPolicy = (req: TermsPolicyRequest) => apiPost<TermsPolicyDetail>(TERMS_BASE, req);
export const updateTermsPolicy = (termsId: string, req: TermsPolicyRequest) =>
  apiPut<TermsPolicyDetail>(`${TERMS_BASE}/${termsId}`, req);
export const publishTermsPolicies = (termsIds: string[], published: 'Y' | 'N') =>
  apiPatch<number>(`${TERMS_BASE}/publish`, { termsIds, published });
export const deleteTermsPolicies = (termsIds: string[]) => apiDelete<number>(TERMS_BASE, { termsIds });

// ── Common Code (A06030100) ──────────────────────────────────────────────────
export interface CodeGroupItem {
  groupCd: string;
  groupNm: string;
  groupExpln?: string;
  useYn: 'Y' | 'N';
  lblCd?: string;
  codeCount?: number;
  crtDt?: string;
  crtBy?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface CommonCodeItem {
  groupCd: string;
  cd: string;
  cdNm: string;
  cdExpln?: string;
  sortSeq?: number;
  useYn: 'Y' | 'N';
  lblCd?: string;
}

const CODE_BASE = '/api/v1/common-codes';
export const getCodeGroups = (search: { useYn?: 'Y' | 'N'; keyword?: string }, page: number, size: number) =>
  apiGet<PageResponse<CodeGroupItem>>(`${CODE_BASE}/groups`, { ...search, page, size });
export const downloadCodeGroupsExcel = (search: { useYn?: 'Y' | 'N'; keyword?: string }) =>
  apiDownload(`${CODE_BASE}/groups/excel`, 'code-groups.xlsx', search);
export const createCodeGroup = (req: { groupCd: string; groupNm: string; groupExpln?: string }) =>
  apiPost<CodeGroupItem>(`${CODE_BASE}/groups`, req);
export const updateCodeGroup = (groupCd: string, req: { groupNm: string; groupExpln?: string; useYn: 'Y' | 'N' }) =>
  apiPut<CodeGroupItem>(`${CODE_BASE}/groups/${groupCd}`, req);
export const deleteCodeGroup = (groupCd: string) => apiDelete<void>(`${CODE_BASE}/groups/${groupCd}`);
export const getCodesByGroup = (groupCd: string) => apiGet<CommonCodeItem[]>(`${CODE_BASE}/groups/${groupCd}/codes`);
export const batchSaveCodes = (groupCd: string, toSave: Partial<CommonCodeItem>[], deleteCds: string[]) =>
  apiPost<void>(`${CODE_BASE}/groups/${groupCd}/codes/batch`, { toSave, deleteCds });

// ── Region / Locations (A06030200) ───────────────────────────────────────────
export interface ProvinceItem {
  mctpvCd: string;
  mctpvNm: string;
  admdstCd?: string;
  sortSeq?: number;
  useYn: 'Y' | 'N';
  districtCount?: number;
  crtDt?: string;
  crtBy?: string;
}

export interface DistrictItem {
  distCd: string;
  mctpvCd: string;
  mctpvNm?: string;
  distNm: string;
  sortSeq?: number;
  useYn: 'Y' | 'N';
}

const LOC_BASE = '/api/v1/locations';
export const getProvinces = (search: { useYn?: 'Y' | 'N'; keyword?: string }, page: number, size: number) =>
  apiGet<PageResponse<ProvinceItem>>(`${LOC_BASE}/provinces`, { ...search, page, size });
export const downloadProvincesExcel = (search: { useYn?: 'Y' | 'N'; keyword?: string }) =>
  apiDownload(`${LOC_BASE}/provinces/excel`, 'provinces.xlsx', search);
export const createProvince = (req: Partial<ProvinceItem>) => apiPost<ProvinceItem>(`${LOC_BASE}/provinces`, req);
export const updateProvince = (mctpvCd: string, req: Partial<ProvinceItem>) =>
  apiPut<ProvinceItem>(`${LOC_BASE}/provinces/${mctpvCd}`, req);
export const deleteProvince = (mctpvCd: string) => apiDelete<void>(`${LOC_BASE}/provinces/${mctpvCd}`);
export const getDistrictsByProvince = (mctpvCd: string) =>
  apiGet<DistrictItem[]>(`${LOC_BASE}/provinces/${mctpvCd}/districts`);
export const createDistrict = (req: Partial<DistrictItem>) => apiPost<DistrictItem>(`${LOC_BASE}/districts`, req);
export const updateDistrict = (distCd: string, req: Partial<DistrictItem>) =>
  apiPut<DistrictItem>(`${LOC_BASE}/districts/${distCd}`, req);
export const deleteDistrict = (distCd: string) => apiDelete<void>(`${LOC_BASE}/districts/${distCd}`);

// ── Finance Institutions (A06030300) ─────────────────────────────────────────
export interface InstitutionItem {
  fnstId?: string;
  fnstCd: string;
  fnstNm: string;
  fnstAbbrNm?: string;
  useYn: 'Y' | 'N';
  branchCount?: number;
  crtDt?: string;
  crtBy?: string;
}

export interface BranchItem {
  fnstBrnchId?: string;
  fnstCd: string;
  fnstBrnchCd: string;
  fnstBrnchNm: string;
  fnstSlsbrNm?: string;
  fnstBrnchAddr?: string;
  fnstBrnchClsfCd?: string;
  admdstCd?: string;
  useYn: 'Y' | 'N';
}

const INST_BASE = '/api/v1/institutions';
export const getInstitutions = (search: { useYn?: 'Y' | 'N'; keyword?: string }, page: number, size: number) =>
  apiGet<PageResponse<InstitutionItem>>(INST_BASE, { ...search, page, size });
export const downloadInstitutionsExcel = (search: { useYn?: 'Y' | 'N'; keyword?: string }) =>
  apiDownload(`${INST_BASE}/excel`, 'institutions.xlsx', search);
export const createInstitution = (req: Partial<InstitutionItem>) => apiPost<InstitutionItem>(INST_BASE, req);
export const updateInstitution = (fnstCd: string, req: Partial<InstitutionItem>) =>
  apiPut<InstitutionItem>(`${INST_BASE}/${fnstCd}`, req);
export const deleteInstitution = (fnstCd: string) => apiDelete<void>(`${INST_BASE}/${fnstCd}`);
export const getBranchesByInstitution = (fnstCd: string) => apiGet<BranchItem[]>(`${INST_BASE}/${fnstCd}/branches`);
export const createBranch = (req: Partial<BranchItem>) => apiPost<BranchItem>(`${INST_BASE}/branches`, req);
export const updateBranch = (fnstBrnchCd: string, req: Partial<BranchItem>) =>
  apiPut<BranchItem>(`${INST_BASE}/branches/${fnstBrnchCd}`, req);
export const deleteBranch = (fnstBrnchCd: string) => apiDelete<void>(`${INST_BASE}/branches/${fnstBrnchCd}`);

// ── Batch Management (A06040400) ─────────────────────────────────────────────
export interface BatchJobItem {
  btchStngId?: string;
  btchJobNm: string;
  btchGroup?: string;
  jobExpln?: string;
  cronExpression?: string;
  scheduleVtlzYn?: 'Y' | 'N';
  jobParameters?: string;
  lastExcnAt?: string;
}

export interface BatchHistoryItem {
  btchHstryId: string;
  btchJobNm: string;
  btchGroup?: string;
  btchStts: string;
  bgngDt?: string;
  endDt?: string;
  prgrsHr?: number;
  tprcsNocs?: number;
  scsNocs?: number;
  failNocs?: number;
  errMsg?: string;
  excnBy?: string;
  trgrType?: string;
}

const BATCH_BASE = '/api/admin/batch';
export const getBatchJobs = (page = 1, size = 100) =>
  apiGet<PageResponse<BatchJobItem>>(`${BATCH_BASE}/jobs`, { page, size });
export const updateBatchSchedule = (jobName: string, cronExpression: string, scheduleVtlzYn: 'Y' | 'N') =>
  apiPut<void>(`${BATCH_BASE}/jobs/${jobName}/schedule`, { cronExpression, scheduleVtlzYn });
export const executeBatchJob = (jobName: string) => apiPost<void>(`${BATCH_BASE}/jobs/${jobName}/execute`, {});
export const getBatchHistory = (page: number, size: number, jobName?: string) =>
  apiGet<PageResponse<BatchHistoryItem>>(
    jobName ? `${BATCH_BASE}/jobs/${jobName}/history` : `${BATCH_BASE}/history`,
    { page, size },
  );

// ── Notification Message & History (A06060100, A06060200) ────────────────────
export interface NotificationMessageItem {
  notiMsgId: string;
  useYn: 'Y' | 'N';
  menuCd?: string;
  menuNm?: string;
  notiMediaSe: string;
  prcsSttsCd?: string;
  notiRcvrSeCd?: string;
  roleGroupId?: string;
  roleId?: string;
  langCd?: string;
  notiTtl: string;
  notiCn: string;
  editable?: boolean;
  crtDt?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnByNm?: string;
}

export interface NotificationHistoryItem {
  no?: number;
  logId: string;
  notiMediaSe: string;
  notiTtl: string;
  notiRcvrSeCd?: string;
  notiRcvrId?: string;
  notiSndngDt?: string;
  sndngScsYn: 'Y' | 'N';
  notiCn?: string;
  failRsn?: string;
}

const NOTI_MSG_BASE = '/api/v1/notification-messages';
const NOTI_HIST_BASE = '/api/v1/notification-histories';
export const getNotificationMessages = (
  search: { crtFromDt?: string; crtToDt?: string; prcsSttsCd?: string; notiTtl?: string },
  page: number,
  size: number,
) => apiGet<PageResponse<NotificationMessageItem>>(NOTI_MSG_BASE, { ...search, page, size });
export const getNotificationMessage = (id: string) => apiGet<NotificationMessageItem>(`${NOTI_MSG_BASE}/${id}`);
export const createNotificationMessage = (req: Partial<NotificationMessageItem>) =>
  apiPost<NotificationMessageItem>(NOTI_MSG_BASE, req);
export const updateNotificationMessage = (id: string, req: Partial<NotificationMessageItem>) =>
  apiPut<NotificationMessageItem>(`${NOTI_MSG_BASE}/${id}`, req);
export const toggleNotificationMessageUse = (id: string, useYn: 'Y' | 'N') =>
  apiPatch<void>(`${NOTI_MSG_BASE}/${id}/use`, { useYn });
export const deleteNotificationMessages = (notiMsgIds: string[]) =>
  apiDelete<void>(NOTI_MSG_BASE, { notiMsgIds });

export const getNotificationHistories = (
  search: { fromDt?: string; toDt?: string; keyword?: string; notiMediaSe?: string; sndngScsYn?: string },
  page: number,
  size: number,
) => apiGet<PageResponse<NotificationHistoryItem>>(NOTI_HIST_BASE, { ...search, page, size });
export const downloadNotificationHistoriesExcel = (search: Record<string, unknown>) =>
  apiDownload(`${NOTI_HIST_BASE}/excel`, 'notification-history.xlsx', search);
