import { apiDelete, apiGet, apiPost, apiPut } from '@/api/common/api-utils';

// Menu Settings API — MenuSettingController (`/api/v1/menus`).
// Shared by Platform Menu Management (VPA003901, menuSeCd=W, guard A06010100)
// and Admin Menu Management (VPA004401, menuSeCd=A, guard A06020100).

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
  /** 0–99 */
  menuSeq: number;
  menuUrlAddr?: string;
  /** Blank → server uses `lbl.menu.{menuCd}`. */
  lblCd?: string;
  menuExpln?: string;
  /** Blank on create → `N`. */
  useYn?: YesNo;
}

/** Flat tree ordered by sortPath, including not-in-use menus and the root row. */
export const getMenuSettings = (params: MenuSettingSearch) =>
  apiGet<MenuSetting[]>('/api/v1/menus', params, []);

export const getMenuSetting = (menuCd: string) =>
  apiGet<MenuSetting>(`/api/v1/menus/${menuCd}`);

export const createMenuSetting = (request: SaveMenuSettingRequest) =>
  apiPost<void>('/api/v1/menus', request);

/**
 * A menu in use (stored useYn=Y) only accepts a change of `useYn` — any other
 * difference is rejected with 409 MNU007. Resend the stored values to deactivate.
 */
export const updateMenuSetting = (request: SaveMenuSettingRequest) =>
  apiPut<void>(`/api/v1/menus/${request.menuCd}`, request);

/** Deletes the menu and its whole subtree; every node must be not-in-use (409 MNU009). */
export const deleteMenuSetting = (menuCd: string) =>
  apiDelete<void>(`/api/v1/menus/${menuCd}`);
