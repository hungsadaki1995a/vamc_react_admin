import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import {
  createScreen,
  deleteScreens,
  downloadScreensExcel,
  getProgramOptions,
  getScreens,
  updateScreen,
} from '@/api/system/program-screen-api';
import type { ProgramItem, ScreenItem, ScreenRequest, ScreenSearch } from '@/api/system/program-screen-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Screen Management (VPA005201 / VPA0052P01, menu A06040200).

const SCREEN_KEYS = {
  all: ['system', 'screens'] as const,
  list: (search: ScreenSearch, page: number, size: number) => ['system', 'screens', 'list', search, page, size] as const,
  programOptions: ['system', 'program-options'] as const,
};

export function useScreens(search: ScreenSearch, page: number, size: number) {
  return useApiQuery<PageResponse<ScreenItem>>(SCREEN_KEYS.list(search, page, size), () => getScreens(search, page, size), {
    placeholderData: keepPreviousData,
  });
}

/** Programs in use, for the Program Code select. */
export function useProgramOptions() {
  return useApiQuery<ProgramItem[]>(SCREEN_KEYS.programOptions, () => getProgramOptions('Y'));
}

export function useDeleteScreens() {
  return useApiAction(deleteScreens, { invalidate: [SCREEN_KEYS.all] });
}

export function useDownloadScreensExcel() {
  return useApiDownload(downloadScreensExcel);
}

export interface SaveScreenVariables {
  /** null = register. */
  scrnId: string | null;
  request: ScreenRequest;
}

/** Registers or edits a screen. */
export function useSaveScreen() {
  return useApiAction(
    ({ scrnId, request }: SaveScreenVariables) =>
      scrnId === null ? createScreen(request) : updateScreen(scrnId, request),
    { invalidate: [SCREEN_KEYS.all] },
  );
}
