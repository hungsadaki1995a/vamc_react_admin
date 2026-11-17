import { apiGet, apiPut } from '@/api/common/api-util';
import type { MenuSeCd } from './menu-setting-api';

// Menu Permission matrix API — MenuPermissionController (`/api/v1/menu-permissions`).
// Guard menu A06020400 (VPA004701). The backend currently supports menuSeCd=A only:
// menuSeCd=W (VPA004301, Web menu permissions) answers 400 PRM003.

export interface MatrixColumn {
  roleGroupId: string;
  roleGroupNm?: string;
  roleId: string;
  roleNm?: string;
  /** Always index 0; read/write are fixed to true and must never be sent back. */
  superAdmin: boolean;
}

export interface MatrixCell {
  roleGroupId: string;
  roleId: string;
  read: boolean;
  write: boolean;
}

export interface MatrixRow {
  menuCd: string;
  upMenuCd: string;
  menuDpth: number;
  sortPath: string;
  useYn: string;
  menuNmVn?: string;
  menuNmEn?: string;
  /** One entry per column, in column order. */
  permissions: MatrixCell[];
}

export interface MenuPermissionMatrix {
  menuSeCd: MenuSeCd;
  columns: MatrixColumn[];
  rows: MatrixRow[];
}

export interface SaveMatrixRequest {
  menuSeCd: MenuSeCd;
  /** Full replace per role sent; roles left out are untouched. */
  roles: Array<{
    roleGroupId: string;
    roleId: string;
    /** A menu left out (or read=write=false) loses its mapping. write implies read. */
    menus: Array<{ menuCd: string; read: boolean; write: boolean }>;
  }>;
}

export const getMenuPermissionMatrix = (menuSeCd: MenuSeCd) =>
  apiGet<MenuPermissionMatrix>('/api/v1/menu-permissions/matrix', { menuSeCd });

export const saveMenuPermissionMatrix = (request: SaveMatrixRequest) =>
  apiPut<void>('/api/v1/menu-permissions/matrix', request);
