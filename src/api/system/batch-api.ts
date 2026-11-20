import { apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';

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
