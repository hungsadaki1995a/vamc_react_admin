import { useMemo } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import {
  createScreen,
  deleteScreens,
  downloadScreensExcel,
  getScreens,
  updateScreen,
} from '@/api/system/program-screen-api';
import type { ScreenItem, ScreenRequest, ScreenSearch } from '@/api/system/program-screen-api';
import { getMenuOptions } from '@/api/system/menu-setting-api';
import type { MenuOption } from '@/api/system/menu-setting-api';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import type { ScreenType } from './screen-constants';

// Data hooks of Screen Management (menu A09040200).

const SCREEN_KEYS = {
  all: ['system', 'screens'] as const,
  list: (search: ScreenSearch, page: PageQuery) => ['system', 'screens', 'list', search, page] as const,
  business: (menuSeCd: ScreenType | '') => ['system', 'screens', 'business-options', menuSeCd] as const,
};

export function useScreens(search: ScreenSearch, page: PageQuery) {
  return useApiQuery<PageResponse<ScreenItem>>(SCREEN_KEYS.list(search, page), () => getScreens(search, page), {
    placeholderData: keepPreviousData,
  });
}

/** Business select: 1Depth menus of Web (W) or Admin (A); '' = both (web first). */
export function useBusinessOptions(menuSeCd: ScreenType | '') {
  const { data = [] } = useApiQuery<MenuOption[]>(
    SCREEN_KEYS.business(menuSeCd),
    () => getMenuOptions({ menuSeCd: menuSeCd || undefined }),
    { staleTime: 5 * 60 * 1000 },
  );
  return useMemo(() => data.map((m) => ({ value: m.menuCd, label: m.menuNmEn || m.menuNmVn || m.menuCd })), [data]);
}

export function useDownloadScreensExcel() {
  return useApiDownload(({ search, sort }: { search: ScreenSearch; sort?: Pick<PageQuery, 'sortBy' | 'sortDirection'> }) =>
    downloadScreensExcel(search, sort),
  );
}

export function useCreateScreen() {
  return useApiAction(createScreen, { invalidate: [SCREEN_KEYS.all] });
}

export function useUpdateScreen() {
  return useApiAction(({ scrnId, request }: { scrnId: string; request: ScreenRequest }) => updateScreen(scrnId, request), {
    invalidate: [SCREEN_KEYS.all],
  });
}

export function useDeleteScreen() {
  return useApiAction((scrnId: string) => deleteScreens([scrnId]), { invalidate: [SCREEN_KEYS.all] });
}
