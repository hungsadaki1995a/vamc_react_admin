import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/api/common/api-utils';

// Menu Settings API — MenuSettingController (`/api/v1/menus`).
// Shared by Menu Settings (VPA09010101, menuSeCd=W, max 3 depths)
// and Admin Menu Settings (VPA09020101, menuSeCd=A).
// Errors: MNU002 duplicate code, MNU006 depth limit, MNU012 label used by another menu,
// MNU013 sibling list mismatch, MNU014 label key not found, MNU015 too many siblings.

export type MenuSeCd = 'W' | 'A';
export type YesNo = 'Y' | 'N';

export interface MenuSetting {
  menuCd: string;
  /** Root rows point to themselves (W00000000 / A00000000). */
  upMenuCd: string;
  menuSeCd: MenuSeCd;
  menuSeq: number;
  /** 0 = root */
  menuDpth: number;
  useYn: YesNo;
  menuNmVn?: string;
  menuNmEn?: string;
  menuUrlAddr?: string;
  lblCd?: string;
  menuExpln?: string;
  /** List only, e.g. `001-006-001`. */
  sortPath?: string;
  /** Detail only — number of direct children. */
  childCount?: number;
  crtDt?: string;
  crtBy?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface MenuSettingSearch {
  menuSeCd: MenuSeCd;
  /** LIKE %x% */
  menuCd?: string;
  menuNmVn?: string;
  menuNmEn?: string;
  useYn?: YesNo;
}

export interface SaveMenuSettingRequest {
  menuSeCd: MenuSeCd;
  /** `^[WA]\d{8}$` — supplied by the client, immutable after creation. */
  menuCd: string;
  upMenuCd: string;
  menuNmVn: string;
  menuNmEn: string;
  /** 0–99; omitted → appended after the last sibling. */
  menuSeq?: number;
  /** Web: path under the site root. Admin: screen id opened by the component registry. */
  menuUrlAddr?: string;
  /** Blank → server uses `lbl.menu.{menuCd}`. */
  lblCd?: string;
  menuExpln?: string;
  /** Blank on create → `N`. */
  useYn?: YesNo;
}

/** Flat tree ordered by sortPath, including Inactive menus and the root row (depth 0). */
export const getMenuSettings = (params: MenuSettingSearch) =>
  apiGet<MenuSetting[]>('/api/v1/menus', params, []);

export const getMenuSetting = (menuCd: string) =>
  apiGet<MenuSetting>(`/api/v1/menus/${menuCd}`);

export const createMenuSetting = (request: SaveMenuSettingRequest) =>
  apiPost<void>('/api/v1/menus', request);

export const updateMenuSetting = (request: SaveMenuSettingRequest) =>
  apiPut<void>(`/api/v1/menus/${request.menuCd}`, request);

/** Deletes the menu and its whole subtree; every node must be not-in-use (409 MNU009). */
export const deleteMenuSetting = (menuCd: string) =>
  apiDelete<void>(`/api/v1/menus/${menuCd}`);

export interface MoveMenuSettingRequest {
  /** New parent (root row W00000000 / A00000000 for a top menu). */
  upMenuCd: string;
  /** All children of the new parent, in their new order, including the moved menu. */
  siblingOrder: string[];
}

/**
 * Drag & drop move: re-parents and re-orders in one call and answers the refreshed flat tree.
 * Errors: MNU006 depth limit (Web 3), MNU013 sibling list mismatch.
 */
export const moveMenuSetting = (menuCd: string, request: MoveMenuSettingRequest) =>
  apiPatch<MenuSetting[]>(`/api/v1/menus/${menuCd}/move`, request);

export interface MenuOption {
  menuCd: string;
  menuSeCd: MenuSeCd;
  menuNmVn?: string;
  menuNmEn?: string;
  useYn: YesNo;
}

/** Lightweight menu list for selects (e.g. Screen Management "Business"). */
export const getMenuOptions = (params: { menuSeCd?: MenuSeCd; useYn?: YesNo }) =>
  apiGet<MenuOption[]>('/api/v1/menus/options', params, []);
