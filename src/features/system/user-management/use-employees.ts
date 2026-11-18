import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  getEmployees,
  resetEmployeePassword,
  updateEmployee,
} from '@/api/system/employee-api';
import type {
  CreateEmployeeRequest,
  Employee,
  EmployeeDetail,
  EmployeeSearch,
  UpdateEmployeeRequest,
} from '@/api/system/employee-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of User Management (VPA004501 / VPA0045P01).

const EMPLOYEE_KEYS = {
  all: ['system', 'employees'] as const,
  list: (search: EmployeeSearch, page: number, size: number) =>
    ['system', 'employees', 'list', search, page, size] as const,
  detail: (empNo: string | null) => ['system', 'employees', 'detail', empNo] as const,
};

/** Paged employee list (masked rows). */
export function useEmployees(search: EmployeeSearch, page: number, size: number) {
  return useApiQuery<PageResponse<Employee>>(
    EMPLOYEE_KEYS.list(search, page, size),
    () => getEmployees(search, page, size),
    { placeholderData: keepPreviousData },
  );
}

/** Unmasked employee detail; skipped while `empNo` is null (register mode). */
export function useEmployee(empNo: string | null) {
  return useApiQuery<EmployeeDetail>(EMPLOYEE_KEYS.detail(empNo), () => getEmployee(empNo as string), {
    enabled: empNo !== null,
    gcTime: 0,
  });
}

export interface DeleteEmployeeFailure {
  empNo: string;
  error: unknown;
}

/** Deletes employees one by one (the API takes one per call) and resolves the rejected ones. */
export function useDeleteEmployees() {
  return useApiTask(
    async (empNos: string[]) => {
      const failed: DeleteEmployeeFailure[] = [];
      for (const empNo of empNos) {
        try {
          await deleteEmployee(empNo);
        } catch (error) {
          failed.push({ empNo, error });
        }
      }
      return failed;
    },
    { invalidate: [EMPLOYEE_KEYS.all] },
  );
}

export type SaveEmployeeVariables =
  | { empNo: null; request: CreateEmployeeRequest }
  | { empNo: string; request: UpdateEmployeeRequest };

/** Registers (`empNo` null) or fully overwrites an employee. */
export function useSaveEmployee() {
  return useApiAction(
    (variables: SaveEmployeeVariables) =>
      variables.empNo === null
        ? createEmployee(variables.request)
        : updateEmployee(variables.empNo, variables.request),
    { invalidate: [EMPLOYEE_KEYS.all] },
  );
}

export interface ResetEmployeePasswordVariables {
  empNo: string;
  newPassword: string;
}

export function useResetEmployeePassword() {
  return useApiAction(
    ({ empNo, newPassword }: ResetEmployeePasswordVariables) => resetEmployeePassword(empNo, newPassword),
    { invalidate: [EMPLOYEE_KEYS.all] },
  );
}
