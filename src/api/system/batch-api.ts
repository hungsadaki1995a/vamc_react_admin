import { apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// ── Batch Management (A09040400) — base path has no /v1 ──────────────────────

/** Run status of BTCH_JOB_EXCN_HSTRY. */
export type BatchRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface BatchJobItem {
  btchStngId?: number;
  btchJobNm: string;
  btchGroup?: string;
  jobExpln?: string;
  cronExpression?: string;
  /** true = Active (schedule enabled). */
  scheduleVtlzYn: boolean;
  jobParameters?: string;
  lastExcnAt?: string;
  /** Latest run status; absent when the job never ran. */
  lastBtchStts?: BatchRunStatus | string;
  crtDt?: string;
  crtBy?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface BatchJobSearch {
  /** '' = all, Y = Active, N = Inactive. */
  useYn: '' | 'Y' | 'N';
  /** Partial match. */
  btchGroup: string;
  /** Partial match. */
  btchJobNm: string;
}

export interface BatchJobSaveRequest {
  btchJobNm: string;
  btchGroup: string;
  jobExpln?: string;
  cronExpression: string;
  scheduleVtlzYn: boolean;
  /** JSON text; BAT005 when not valid JSON. */
  jobParameters?: string;
}

export interface BatchHistoryItem {
  btchHstryId: number;
  btchJobNm: string;
  btchGroup?: string;
  btchStts: BatchRunStatus | string;
  bgngDt?: string;
  endDt?: string;
  /** Duration in milliseconds. */
  prgrsHr?: number;
  tprcsNocs?: number;
  scsNocs?: number;
  failNocs?: number;
  errMsg?: string;
  excnBy?: string;
  /** SCHEDULED / MANUAL. */
  trgrType?: string;
}

/** A `@BatchJob` registered in the backend code. */
export interface BatchRegistryJob {
  jobName: string;
  jobGroup: string;
  className?: string;
  methodName?: string;
}

const BATCH_BASE = '/api/admin/batch';
const jobPath = (jobName: string) => `${BATCH_BASE}/jobs/${encodeURIComponent(jobName)}`;

export const getBatchJobs = (search: BatchJobSearch, page: PageQuery) =>
  apiGet<PageResponse<BatchJobItem>>(`${BATCH_BASE}/jobs`, { ...search, ...page });

export const downloadBatchJobsExcel = (search: BatchJobSearch) =>
  apiDownload(`${BATCH_BASE}/jobs/excel`, 'batch-jobs.xlsx', search);

export const getBatchJob = (jobName: string) => apiGet<BatchJobItem>(jobPath(jobName));

/** BAT002 duplicate, BAT004 cron, BAT005 parameters, BAT008 job not in the code registry. */
export const createBatchJob = (body: BatchJobSaveRequest) => apiPost<BatchJobItem>(`${BATCH_BASE}/jobs`, body);

/** Saves to DB only; the scheduler applies it on [Refresh Schedule]. */
export const updateBatchJob = (jobName: string, body: BatchJobSaveRequest) =>
  apiPut<BatchJobItem>(jobPath(jobName), body);

/** Re-registers the schedules of all jobs from the saved Use / Cron. */
export const refreshBatchSchedules = () => apiPost<void>(`${BATCH_BASE}/schedules/refresh`);

/** Starts the job in the background and returns its RUNNING history row (BAT006 inactive, BAT007 running). */
export const executeBatchJob = (jobName: string) => apiPost<BatchHistoryItem>(`${jobPath(jobName)}/execute`);

/** Execution history of one job, newest first. */
export const getBatchJobHistory = (jobName: string, page: PageQuery) =>
  apiGet<PageResponse<BatchHistoryItem>>(`${jobPath(jobName)}/history`, page);

export const getBatchRegistry = () =>
  apiGet<{ count: number; jobs: BatchRegistryJob[] }>(`${BATCH_BASE}/registry`);
