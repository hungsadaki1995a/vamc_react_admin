import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiDownload } from '@/hooks/use-api-action';
import { downloadCollateralAssetsExcel, getCollateralAsset, getCollateralAssets } from '@/api/npl/npl-api';
import type { CollateralAssetItem, CollateralSearch } from '@/api/npl/npl-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Collateral Asset Management — the screen never calls the API itself.

const COLLATERAL_ASSET_KEYS = {
  all: ['npl', 'collateral-assets'] as const,
  list: (search: CollateralSearch, page: number, size: number) =>
    ['npl', 'collateral-assets', 'list', search, page, size] as const,
  detail: (cltrAstCd: string | null) => ['npl', 'collateral-assets', 'detail', cltrAstCd] as const,
};

/** Paged collateral asset list. */
export function useCollateralAssets(search: CollateralSearch, page: number, size: number) {
  return useApiQuery<PageResponse<CollateralAssetItem>>(
    COLLATERAL_ASSET_KEYS.list(search, page, size),
    () => getCollateralAssets(search, page, size),
    { placeholderData: keepPreviousData },
  );
}

/** One collateral asset; skipped while `cltrAstCd` is empty. */
export function useCollateralAsset(cltrAstCd: string | null) {
  return useApiQuery<Record<string, unknown>>(
    COLLATERAL_ASSET_KEYS.detail(cltrAstCd),
    () => getCollateralAsset(cltrAstCd as string),
    { enabled: !!cltrAstCd },
  );
}

export function useDownloadCollateralAssetsExcel() {
  return useApiDownload((search: CollateralSearch) => downloadCollateralAssetsExcel(search as Record<string, unknown>));
}
