import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import { createProgram, downloadProgramsExcel, getPrograms, updateProgram } from '@/api/system/program-screen-api';
import type { ProgramItem, ProgramRequest, ProgramSearch } from '@/api/system/program-screen-api';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Data hooks of Program Management (menu A06040100).

const PROGRAM_KEYS = {
  all: ['system', 'programs'] as const,
  list: (search: ProgramSearch, page: PageQuery) => ['system', 'programs', 'list', search, page] as const,
};

export function usePrograms(search: ProgramSearch, page: PageQuery) {
  return useApiQuery<PageResponse<ProgramItem>>(PROGRAM_KEYS.list(search, page), () => getPrograms(search, page), {
    placeholderData: keepPreviousData,
  });
}

export function useDownloadProgramsExcel() {
  return useApiDownload(downloadProgramsExcel);
}

export function useCreateProgram() {
  return useApiAction(createProgram, { invalidate: [PROGRAM_KEYS.all] });
}

export function useUpdateProgram() {
  return useApiAction(({ prgrmCd, request }: { prgrmCd: string; request: ProgramRequest }) => updateProgram(prgrmCd, request), {
    invalidate: [PROGRAM_KEYS.all],
  });
}
