import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import {
  createProgram,
  deletePrograms,
  downloadProgramsExcel,
  getPrograms,
  updateProgram,
} from '@/api/system/program-screen-api';
import type { ProgramItem, ProgramRequest, ProgramSearch } from '@/api/system/program-screen-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Program Management (VPA005101 / VPA0051P01, menu A06040100).

const PROGRAM_KEYS = {
  all: ['system', 'programs'] as const,
  list: (search: ProgramSearch, page: number, size: number) => ['system', 'programs', 'list', search, page, size] as const,
};

export function usePrograms(search: ProgramSearch, page: number, size: number) {
  return useApiQuery<PageResponse<ProgramItem>>(PROGRAM_KEYS.list(search, page, size), () => getPrograms(search, page, size), {
    placeholderData: keepPreviousData,
  });
}

export function useDeletePrograms() {
  return useApiAction(deletePrograms, { invalidate: [PROGRAM_KEYS.all] });
}

export function useDownloadProgramsExcel() {
  return useApiDownload(downloadProgramsExcel);
}

export interface SaveProgramVariables {
  /** null = register. */
  prgrmCd: string | null;
  request: ProgramRequest;
}

/** Registers or edits a program. */
export function useSaveProgram() {
  return useApiAction(
    ({ prgrmCd, request }: SaveProgramVariables) =>
      prgrmCd === null ? createProgram(request) : updateProgram(prgrmCd, request),
    { invalidate: [PROGRAM_KEYS.all] },
  );
}
