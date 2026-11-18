import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import {
  createRole,
  createRoleGroup,
  deleteRole,
  deleteRoleGroup,
  getRoleAssignees,
  getRoleGroups,
  getRoles,
  saveRoleAssignees,
  updateRole,
  updateRoleGroup,
} from '@/api/system/role-group-api';
import type { Role, RoleGroup, RoleUser } from '@/api/system/role-group-api';
import { lookupEmployees } from '@/api/system/employee-api';
import type { EmployeeLookup, EmployeeLookupSearch } from '@/api/system/employee-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of User Group Management (VPA004601 / VPA0046P01).

const ROLE_GROUP_KEYS = {
  all: ['system', 'role-groups'] as const,
  list: () => ['system', 'role-groups', 'list'] as const,
};

const ROLE_KEYS = {
  all: ['system', 'roles'] as const,
  list: (roleGroupId: string | null) => ['system', 'roles', 'list', roleGroupId] as const,
};

const ROLE_ASSIGNEE_KEYS = {
  all: ['system', 'role-assignees'] as const,
  list: (roleGroupId: string | null, roleId: string | null) =>
    ['system', 'role-assignees', 'list', roleGroupId, roleId] as const,
};

// Lives under the employee prefix so employee writes refresh the lookup too.
const EMPLOYEE_LOOKUP_KEYS = {
  list: (search: EmployeeLookupSearch, page: number, size: number) =>
    ['system', 'employees', 'lookup', search, page, size] as const,
};

/** Every user group. */
export function useRoleGroups() {
  return useApiQuery<RoleGroup[]>(ROLE_GROUP_KEYS.list(), getRoleGroups);
}

/** Roles of one group; skipped while no group is selected. */
export function useRoles(roleGroupId: string | null) {
  return useApiQuery<Role[]>(ROLE_KEYS.list(roleGroupId), () => getRoles(roleGroupId as string), {
    enabled: roleGroupId !== null,
  });
}

/** Assignees of one role; skipped while no group / role is selected. */
export function useRoleAssignees(roleGroupId: string | null, roleId: string | null) {
  return useApiQuery<RoleUser[]>(
    ROLE_ASSIGNEE_KEYS.list(roleGroupId, roleId),
    () => getRoleAssignees(roleGroupId as string, roleId as string),
    { enabled: roleGroupId !== null && roleId !== null },
  );
}

export interface SaveRoleGroupVariables {
  isEdit: boolean;
  request: Pick<RoleGroup, 'roleGroupId' | 'roleGroupNm' | 'useYn'>;
}

export function useSaveRoleGroup() {
  return useApiAction(
    ({ isEdit, request }: SaveRoleGroupVariables) =>
      isEdit ? updateRoleGroup(request) : createRoleGroup(request),
    { invalidate: [ROLE_GROUP_KEYS.all] },
  );
}

export function useDeleteRoleGroup() {
  return useApiAction(deleteRoleGroup, { invalidate: [ROLE_GROUP_KEYS.all] });
}

export interface SaveRoleVariables {
  isEdit: boolean;
  request: Role;
}

export function useSaveRole() {
  return useApiAction(
    ({ isEdit, request }: SaveRoleVariables) => (isEdit ? updateRole(request) : createRole(request)),
    { invalidate: [ROLE_KEYS.all] },
  );
}

export function useDeleteRole() {
  return useApiAction(deleteRole, { invalidate: [ROLE_KEYS.all] });
}

export interface SaveRoleAssigneesVariables {
  roleGroupId: string;
  roleId: string;
  addEmpNos: string[];
  removeEmpNos: string[];
}

/** Batch add / remove of a role's assignees. */
export function useSaveRoleAssignees() {
  return useApiAction(
    ({ roleGroupId, roleId, addEmpNos, removeEmpNos }: SaveRoleAssigneesVariables) =>
      saveRoleAssignees(roleGroupId, roleId, addEmpNos, removeEmpNos),
    { invalidate: [ROLE_ASSIGNEE_KEYS.all] },
  );
}

/** Paged lookup of active employees not yet assigned to the role in `search`. */
export function useEmployeeLookup(search: EmployeeLookupSearch, page: number, size: number) {
  return useApiQuery<PageResponse<EmployeeLookup>>(
    EMPLOYEE_LOOKUP_KEYS.list(search, page, size),
    () => lookupEmployees(search, page, size),
    { placeholderData: keepPreviousData },
  );
}
