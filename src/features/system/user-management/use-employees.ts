import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import {
  createEmployee,
  deleteEmployee,
  downloadEmployeesExcel,
  getEmployee,
  getEmployees,
  resetEmployeePassword,
  updateEmployee,
} from '@/api/system/employee-api';
import type {
  Employee,
  EmployeeDetail,
  EmployeeSearch,
  UpdateEmployeeRequest,
} from '@/api/system/employee-api';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Data hooks of User Management (VPA09020201 / VPA090202P01).

const EMPLOYEE_KEYS = {
  all: ['system', 'employees'] as const,
  list: (search: EmployeeSearch, query: PageQuery) => ['system', 'employees', 'list', search, query] as const,
  detail: (empNo: string | null) => ['system', 'employees', 'detail', empNo] as const,
};

/** Paged employee list (20 rows). */
export function useEmployees(search: EmployeeSearch, query: PageQuery) {
  return useApiQuery<PageResponse<Employee>>(EMPLOYEE_KEYS.list(search, query), () => getEmployees(search, query), {
    placeholderData: keepPreviousData,
  });
}

/** Employee detail for the edit popup; skipped while `empNo` is null. */
export function useEmployee(empNo: string | null) {
  return useApiQuery<EmployeeDetail>(EMPLOYEE_KEYS.detail(empNo), () => getEmployee(empNo as string), {
    enabled: empNo !== null,
    gcTime: 0,
    retry: false,
  });
}

export function useEmployeesExcel() {
  return useApiDownload(downloadEmployeesExcel);
}

export function useCreateEmployee() {
  return useApiAction(createEmployee, { invalidate: [EMPLOYEE_KEYS.all] });
}

export interface UpdateEmployeeVariables {
  empNo: string;
  request: UpdateEmployeeRequest;
}

export function useUpdateEmployee() {
  return useApiAction(({ empNo, request }: UpdateEmployeeVariables) => updateEmployee(empNo, request), {
    invalidate: [EMPLOYEE_KEYS.all],
  });
}

export function useDeleteEmployee() {
  return useApiAction(deleteEmployee, { invalidate: [EMPLOYEE_KEYS.all] });
}

/** Mails a new temporary password, unlocks the account and resets P/W Fail. */
export function useResetEmployeePassword() {
  return useApiAction(resetEmployeePassword, { invalidate: [EMPLOYEE_KEYS.all] });
}
