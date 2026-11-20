import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import {
  createRole,
  createRoleGroup,
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
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Data hooks of User Group Management (VPA09020301 / VPA090203P01 / Staff Search).

/** Web member grades (GUEST / MEM_*) — managed by Web Menu Permission Management, not here. */
const HIDDEN_GROUP_IDS = new Set(['RG00100']);

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

// Under the employee prefix so employee writes refresh the lookup too.
const EMPLOYEE_LOOKUP_KEYS = {
  all: ['system', 'employees', 'lookup'] as const,
  list: (search: EmployeeLookupSearch, query: PageQuery) => ['system', 'employees', 'lookup', search, query] as const,
};

// Group / role writes change the matrix columns as well.
const MENU_PERMISSION_PREFIX = ['system', 'menu-permissions'] as const;

/** Admin user groups (the Web member grade group is left out). */
export function useRoleGroups() {
  return useApiQuery<RoleGroup[]>(ROLE_GROUP_KEYS.list(), () => getRoleGroups(), {
    select: (groups) => groups.filter((group) => !HIDDEN_GROUP_IDS.has(group.roleGroupId)),
  });
}

/** Roles of one group; skipped while no group is selected. */
export function useRoles(roleGroupId: string | null) {
  return useApiQuery<Role[]>(ROLE_KEYS.list(roleGroupId), () => getRoles(roleGroupId as string), {
    enabled: roleGroupId !== null,
  });
}

/** Staff of one role; skipped while no role is selected. */
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

/** Errors: error.roleGroup.alreadyExists (E02), error.roleGroup.protected. */
export function useSaveRoleGroup() {
  return useApiAction(
    ({ isEdit, request }: SaveRoleGroupVariables) => (isEdit ? updateRoleGroup(request) : createRoleGroup(request)),
    { invalidate: [ROLE_GROUP_KEYS.all, MENU_PERMISSION_PREFIX] },
  );
}

export interface SaveRoleVariables {
  isEdit: boolean;
  request: Role;
}

/** Errors: error.role.alreadyExists (E02). */
export function useSaveRole() {
  return useApiAction(
    ({ isEdit, request }: SaveRoleVariables) => (isEdit ? updateRole(request) : createRole(request)),
    { invalidate: [ROLE_KEYS.all, MENU_PERMISSION_PREFIX] },
  );
}

export interface SaveRoleAssigneesVariables {
  roleGroupId: string;
  roleId: string;
  addEmpNos: string[];
  removeEmpNos: string[];
}

/** Adds / removes role staff in one call (saved immediately). */
export function useSaveRoleAssignees() {
  return useApiAction(
    ({ roleGroupId, roleId, addEmpNos, removeEmpNos }: SaveRoleAssigneesVariables) =>
      saveRoleAssignees(roleGroupId, roleId, addEmpNos, removeEmpNos),
    { invalidate: [ROLE_ASSIGNEE_KEYS.all, EMPLOYEE_LOOKUP_KEYS.all] },
  );
}

/** Employed staff not yet assigned to the role in `search` (Staff Search popup). */
export function useEmployeeLookup(search: EmployeeLookupSearch, query: PageQuery) {
  return useApiQuery<PageResponse<EmployeeLookup>>(
    EMPLOYEE_LOOKUP_KEYS.list(search, query),
    () => lookupEmployees(search, query),
    { placeholderData: keepPreviousData },
  );
}
