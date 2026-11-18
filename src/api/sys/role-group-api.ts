import { apiDelete, apiGet, apiPost, apiPut } from '@/api/common/api-util';

// User Group Management API — RoleGroupController (`/api/v1/role-groups`) and
// RoleInfoController (`/api/v1/roles`). Guard menu A06020300 (VPA004601 / VPA0046P01).
// Protected records: group RG09999 and role ADMIN (Super Admin).

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
  jbpsNm?: string;
  empSttsCd?: string;
  roleGroupId: string;
  roleId: string;
}

// ── Groups ──────────────────────────────────────────────────────────────────

export const getRoleGroups = () => apiGet<RoleGroup[]>('/api/v1/role-groups/all', undefined, []);

/** `roleGroupId` must match `^RG\d{5}$` and is supplied by the client. */
export const createRoleGroup = (request: Pick<RoleGroup, 'roleGroupId' | 'roleGroupNm' | 'useYn'>) =>
  apiPost<RoleGroup>('/api/v1/role-groups', request);

export const updateRoleGroup = (request: Pick<RoleGroup, 'roleGroupId' | 'roleGroupNm' | 'useYn'>) =>
  apiPut<RoleGroup>(`/api/v1/role-groups/${request.roleGroupId}`, {
    roleGroupNm: request.roleGroupNm,
    useYn: request.useYn,
  });

/** Rejected while the group still has roles (error.roleGroup.hasRoles). */
export const deleteRoleGroup = (roleGroupId: string) =>
  apiDelete<void>(`/api/v1/role-groups/${roleGroupId}`);

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

/** Rejected while the role still has assignees or menu permissions (error.role.hasMappings). */
export const deleteRole = (roleId: string) => apiDelete<void>(`/api/v1/roles/${roleId}`);

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
