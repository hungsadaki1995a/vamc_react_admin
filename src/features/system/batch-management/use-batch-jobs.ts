import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import {
  executeBatchJob,
  getBatchHistory,
  getBatchJobs,
  updateBatchSchedule,
} from '@/api/system/system-operations-api';
import type { BatchHistoryItem, BatchJobItem } from '@/api/system/system-operations-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Batch Management (menu A06040400).

const BATCH_KEYS = {
  all: ['system', 'batch'] as const,
  jobs: ['system', 'batch', 'jobs'] as const,
  history: (page: number, size: number) => ['system', 'batch', 'history', page, size] as const,
};

/** All batch jobs (single page of 100). */
export function useBatchJobs() {
  return useApiQuery<PageResponse<BatchJobItem>>(BATCH_KEYS.jobs, () => getBatchJobs(1, 100), {
    placeholderData: keepPreviousData,
  });
}

/** Paged execution history; fetched only while `enabled`. */
export function useBatchHistory(page: number, size: number, enabled: boolean) {
  return useApiQuery<PageResponse<BatchHistoryItem>>(BATCH_KEYS.history(page, size), () => getBatchHistory(page, size), {
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useExecuteBatchJob() {
  return useApiAction(executeBatchJob, { invalidate: [BATCH_KEYS.all] });
}

export interface UpdateBatchScheduleVariables {
  jobName: string;
  cronExpression: string;
  scheduleVtlzYn: 'Y' | 'N';
}

export function useUpdateBatchSchedule() {
  return useApiAction(
    ({ jobName, cronExpression, scheduleVtlzYn }: UpdateBatchScheduleVariables) =>
      updateBatchSchedule(jobName, cronExpression, scheduleVtlzYn),
    { invalidate: [BATCH_KEYS.jobs] },
  );
}
