import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import {
  createApprovalProcess,
  deleteApprovalProcess,
  getApprovalProcess,
  getApprovalProcesses,
  updateApprovalProcess,
  updateApprovalProcessStatus,
} from '@/api/system/approval-process-api';
import type {
  ApprovalProcessDetail,
  ApprovalProcessItem,
  ApprovalProcessSearch,
  UpdateApprovalProcessRequest,
  YesNo,
} from '@/api/system/approval-process-api';
import { getRoleGroups, getRoles } from '@/api/system/role-group-api';
import type { Role, RoleGroup } from '@/api/system/role-group-api';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Data hooks of Approval Process Management (menu A09040500).

const PROCESS_KEYS = {
  all: ['system', 'approval-process'] as const,
  lists: ['system', 'approval-process', 'list'] as const,
  list: (search: ApprovalProcessSearch, page: PageQuery) => ['system', 'approval-process', 'list', search, page] as const,
  detail: (atrzProcId: string | null) => ['system', 'approval-process', 'detail', atrzProcId] as const,
  roleGroups: ['system', 'approval-process', 'role-groups'] as const,
  roles: (roleGroupId: string | null) => ['system', 'approval-process', 'roles', roleGroupId] as const,
};

export function useApprovalProcesses(search: ApprovalProcessSearch, page: PageQuery) {
  return useApiQuery<PageResponse<ApprovalProcessItem>>(
    PROCESS_KEYS.list(search, page),
    () => getApprovalProcesses(search, page),
    { placeholderData: keepPreviousData },
  );
}

/** Process with its ordered steps; skipped while no row is open. */
export function useApprovalProcess(atrzProcId: string | null) {
  return useApiQuery<ApprovalProcessDetail>(PROCESS_KEYS.detail(atrzProcId), () => getApprovalProcess(atrzProcId as string), {
    enabled: !!atrzProcId,
    refetchOnWindowFocus: false,
  });
}

/** Active role groups for the step role pickers. */
export function useActiveRoleGroups() {
  return useApiQuery<RoleGroup[]>(PROCESS_KEYS.roleGroups, () => getRoleGroups({ useYn: 'Y' }), {
    staleTime: 5 * 60 * 1000,
  });
}

/** Active roles of one group (the server refuses an inactive role, PRC005); skipped without a group. */
export function useActiveRoles(roleGroupId: string | null) {
  return useApiQuery<Role[]>(PROCESS_KEYS.roles(roleGroupId), () => getRoles(roleGroupId as string), {
    enabled: !!roleGroupId,
    staleTime: 5 * 60 * 1000,
    select: (roles) => roles.filter((role) => role.useYn === 'Y'),
  });
}

export function useCreateApprovalProcess() {
  return useApiAction(createApprovalProcess, { invalidate: [PROCESS_KEYS.all] });
}

export function useUpdateApprovalProcess() {
  return useApiAction(
    ({ atrzProcId, request }: { atrzProcId: string; request: UpdateApprovalProcessRequest }) =>
      updateApprovalProcess(atrzProcId, request),
    { invalidate: [PROCESS_KEYS.all] },
  );
}

export function useUpdateApprovalProcessStatus() {
  return useApiAction(
    ({ atrzProcId, useYn }: { atrzProcId: string; useYn: YesNo }) => updateApprovalProcessStatus(atrzProcId, useYn),
    { invalidate: [PROCESS_KEYS.all] },
  );
}

/** Refreshes the lists only: refetching the deleted process's detail would answer 404. */
export function useDeleteApprovalProcess() {
  return useApiAction((atrzProcId: string) => deleteApprovalProcess(atrzProcId), { invalidate: [PROCESS_KEYS.lists] });
}
