import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import {
  createBatchJob,
  downloadBatchJobsExcel,
  executeBatchJob,
  getBatchJob,
  getBatchJobHistory,
  getBatchJobs,
  getBatchRegistry,
  refreshBatchSchedules,
  updateBatchJob,
} from '@/api/system/batch-api';
import type {
  BatchHistoryItem,
  BatchJobItem,
  BatchJobSaveRequest,
  BatchJobSearch,
  BatchRegistryJob,
} from '@/api/system/batch-api';

// Data hooks of Batch Management (menu A06040400); the history popup is also used by Exchange Rate.

export const BATCH_KEYS = {
  all: ['system', 'batch'] as const,
  jobs: ['system', 'batch', 'jobs'] as const,
  jobList: (search: BatchJobSearch, page: PageQuery) => ['system', 'batch', 'jobs', search, page] as const,
  registry: ['system', 'batch', 'registry'] as const,
  job: (jobName: string) => ['system', 'batch', 'jobs', 'detail', jobName] as const,
  history: (jobName: string) => ['system', 'batch', 'history', jobName] as const,
  historyPage: (jobName: string, page: PageQuery) => ['system', 'batch', 'history', jobName, page] as const,
};

/** Poll while a run is in progress (Run Now / Rerun start in the background). */
const RUNNING_POLL_MS = 3000;

export function useBatchJobs(search: BatchJobSearch, page: PageQuery) {
  return useApiQuery<PageResponse<BatchJobItem>>(BATCH_KEYS.jobList(search, page), () => getBatchJobs(search, page), {
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.content.some((job) => job.lastBtchStts === 'RUNNING') ? RUNNING_POLL_MS : false,
  });
}

/** Jobs registered in the backend code — options of the Job Name select. */
export function useBatchRegistry(enabled = true) {
  return useApiQuery<BatchRegistryJob[]>(
    BATCH_KEYS.registry,
    async () => {
      const response = await getBatchRegistry();
      return { ...response, data: response.data?.jobs ?? [] };
    },
    { enabled, staleTime: 5 * 60 * 1000 },
  );
}

/** One job's settings (Job Information of the history popup). */
export function useBatchJob(jobName: string | null) {
  return useApiQuery<BatchJobItem>(BATCH_KEYS.job(jobName ?? ''), () => getBatchJob(jobName as string), {
    enabled: jobName !== null,
  });
}

export function useBatchHistory(jobName: string | null, page: PageQuery) {
  return useApiQuery<PageResponse<BatchHistoryItem>>(
    BATCH_KEYS.historyPage(jobName ?? '', page),
    () => getBatchJobHistory(jobName as string, page),
    {
      enabled: jobName !== null,
      placeholderData: keepPreviousData,
      refetchInterval: (query) =>
        query.state.data?.content.some((row) => row.btchStts === 'RUNNING') ? RUNNING_POLL_MS : false,
    },
  );
}

export function useCreateBatchJob() {
  return useApiAction((body: BatchJobSaveRequest) => createBatchJob(body), { invalidate: [BATCH_KEYS.jobs] });
}

export function useUpdateBatchJob() {
  return useApiAction(({ jobName, body }: { jobName: string; body: BatchJobSaveRequest }) => updateBatchJob(jobName, body), {
    invalidate: [BATCH_KEYS.jobs],
  });
}

export function useRefreshBatchSchedules() {
  return useApiAction(() => refreshBatchSchedules(), { invalidate: [BATCH_KEYS.jobs] });
}

/** Run Now / Rerun: the run starts asynchronously; list and history refetch (and poll while RUNNING). */
export function useExecuteBatchJob() {
  return useApiAction((jobName: string) => executeBatchJob(jobName), { invalidate: [BATCH_KEYS.all] });
}

export function useDownloadBatchJobs() {
  return useApiDownload((search: BatchJobSearch) => downloadBatchJobsExcel(search));
}
