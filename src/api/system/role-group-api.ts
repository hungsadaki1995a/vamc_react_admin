import { apiGet, apiPost, apiPut } from '@/api/common/api-utils';

// User Group Management API — RoleGroupController (`/api/v1/role-groups`) and
// RoleInfoController (`/api/v1/roles`). Screens VPA09020301 / VPA090203P01.
// Protected records: group RG09999 and role ADMIN (Super Admin).
// Groups RG00100 (logged-out visitor GUEST) and RG00200 (member types) are Web Menu Permission data.

export type YesNo = 'Y' | 'N';

export interface RoleGroup {
  roleGroupId: string;
  roleGroupNm: string;
  useYn: YesNo;
  crtDt?: string;
  crtBy?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface Role {
  roleId: string;
  roleNm: string;
  roleGroupId: string;
  useYn: YesNo;
}

/** Assignee row — e-mail and mobile are masked by the server. */
export interface RoleUser {
  userNo: string;
  userNm: string;
  email?: string;
  mobilePhone?: string;
  jbpsNm?: string;
  empSttsCd?: string;
  roleGroupId: string;
  roleId: string;
  assignedAt?: string;
  assignedBy?: string;
}

/** E02 codes of the register calls. */
export const ROLE_GROUP_DUPLICATED = 'error.roleGroup.alreadyExists';
export const ROLE_DUPLICATED = 'error.role.alreadyExists';

// ── Groups ──────────────────────────────────────────────────────────────────

/** All role groups (no paging); `useYn` filters by use status, empty = all. */
export const getRoleGroups = (params?: { useYn?: 'Y' | 'N'; keyword?: string }) =>
  apiGet<RoleGroup[]>('/api/v1/role-groups/all', params, []);

/** `roleGroupId` must match `^RG\d{5}$` and is supplied by the client. */
export const createRoleGroup = (request: Pick<RoleGroup, 'roleGroupId' | 'roleGroupNm' | 'useYn'>) =>
  apiPost<RoleGroup>('/api/v1/role-groups', request);

export const updateRoleGroup = (request: Pick<RoleGroup, 'roleGroupId' | 'roleGroupNm' | 'useYn'>) =>
  apiPut<RoleGroup>(`/api/v1/role-groups/${request.roleGroupId}`, {
    roleGroupNm: request.roleGroupNm,
    useYn: request.useYn,
  });

// ── Roles ───────────────────────────────────────────────────────────────────

export const getRoles = (roleGroupId: string) =>
  apiGet<Role[]>('/api/v1/roles/all', { roleGroupId }, []);

/** `roleId` is at most 7 chars and globally unique. */
export const createRole = (request: Role) => apiPost<Role>('/api/v1/roles', request);

/** `roleGroupId` is immutable — send the stored value. */
export const updateRole = (request: Role) =>
  apiPut<Role>(`/api/v1/roles/${request.roleId}`, {
    roleNm: request.roleNm,
    roleGroupId: request.roleGroupId,
    useYn: request.useYn,
  });

// ── Assignees ───────────────────────────────────────────────────────────────

export const getRoleAssignees = (roleGroupId: string, roleId: string) =>
  apiGet<RoleUser[]>('/api/v1/roles/assigned-users/all', { roleGroupId, roleId }, []);

/** Batch add / remove; answers the full assignee list after the change. */
export const saveRoleAssignees = (
  roleGroupId: string,
  roleId: string,
  addEmpNos: string[],
  removeEmpNos: string[],
) =>
  apiPut<RoleUser[]>(`/api/v1/role-groups/${roleGroupId}/roles/${roleId}/assignees`, {
    addEmpNos,
    removeEmpNos,
  });
