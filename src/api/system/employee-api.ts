import { apiDelete, apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// User (employee) Management API — EmployeeController (`/api/v1/employees`).
// Screens VPA09020201 (list) / VPA090202P01 (popup); the lookup endpoint also serves
// the Staff Search popup of User Group Management (VPA09020301).

/** COM_CD EMP_STTS_CD — H employed, L on leave, S suspended, R resigned. */
export type EmpStatus = 'H' | 'L' | 'R' | 'S';

/** Login lock state derived by the server from the password fail count. */
export type AccountStatus = 'ACTIVE' | 'LOCKED';

/** List row. */
export interface Employee {
  empNo: string;
  empNm: string;
  empEmlAddr?: string;
  empTelno?: string;
  empMoblTelno?: string;
  empSttsCd: EmpStatus;
  jbpsNm?: string;
  pswdFailNmtm?: number;
  acntSttsCd?: AccountStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** Detail — always load this before editing (update is a full overwrite). */
export interface EmployeeDetail {
  empNo: string;
  empNm: string;
  empEmlAddr?: string;
  empTelno?: string;
  empMoblTelno?: string;
  empSttsCd: EmpStatus;
  jbpsNm?: string;
  pswdFailNmtm?: number;
  /** ddMMyyyy */
  pswdChgDmy?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface EmployeeSearch {
  /** LIKE %x% */
  empNo?: string;
  empNm?: string;
}

export interface UpdateEmployeeRequest {
  empNm: string;
  empEmlAddr: string;
  /** Max 11 chars. */
  empTelno?: string;
  /** Required, `^\+?[0-9][0-9 .-]{7,18}[0-9]$`. */
  empMoblTelno: string;
  empSttsCd: EmpStatus;
  jbpsNm?: string;
}

/** No password: the server generates a temporary one and mails it to the user. */
export interface CreateEmployeeRequest extends UpdateEmployeeRequest {
  /** `^[a-zA-Z0-9_-]{3,10}$` */
  empNo: string;
}

/** Register answer: the employee plus the temporary-password mail result (the password itself is never returned). */
export interface CreateEmployeeResponse extends EmployeeDetail {
  mailSent: boolean;
  mailSentTo?: string;
}

export interface ResetPasswordResponse {
  empNo: string;
  mailSent: boolean;
  mailSentTo?: string;
}

export interface EmployeeLookup {
  empNo: string;
  empNm: string;
  jbpsNm?: string;
  empSttsCd: EmpStatus;
}

export interface EmployeeLookupSearch {
  empNo?: string;
  empNm?: string;
  /** Both must be set to hide employees already assigned to that role. */
  excludeRoleGroupId?: string;
  excludeRoleId?: string;
  /** Only employees holding this role in any role group (PRCS officer, RCPT receiver). */
  roleId?: string;
}

const BASE = '/api/v1/employees';

export const getEmployees = (search: EmployeeSearch, query: PageQuery) =>
  apiGet<PageResponse<Employee>>(BASE, { ...search, ...query });

export const downloadEmployeesExcel = (search: EmployeeSearch) =>
  apiDownload(`${BASE}/excel`, 'employees.xlsx', search);

export const getEmployee = (empNo: string) => apiGet<EmployeeDetail>(`${BASE}/${empNo}`);

/** Errors: EMP_DUPLICATED (emp no.), EMP001 (email), EMP002 (mobile). */
export const createEmployee = (request: CreateEmployeeRequest) =>
  apiPost<CreateEmployeeResponse>(BASE, request);

/** Errors: EMP001, EMP002, EMP009, EMP010, CANNOT_DEACTIVATE_SELF. */
export const updateEmployee = (empNo: string, request: UpdateEmployeeRequest) =>
  apiPut<EmployeeDetail>(`${BASE}/${empNo}`, request);

/** Issues a new temporary password by mail, unlocks the account and resets the fail count. */
export const resetEmployeePassword = (empNo: string) =>
  apiPost<ResetPasswordResponse>(`${BASE}/${empNo}/reset-password`);

/** Hard delete. Errors: CANNOT_DELETE_SELF, EMP003 (has references), EMP004 (last admin), EMP009. */
export const deleteEmployee = (empNo: string) => apiDelete<void>(`${BASE}/${empNo}`);

/**
 * Employed (H) staff only, no contact data. Open to User Management / Role Group readers and to readers of the
 * trade application / contract menus (A0501xxxx, A0502xxxx).
 */
export const lookupEmployees = (search: EmployeeLookupSearch, query: PageQuery) =>
  apiGet<PageResponse<EmployeeLookup>>(`${BASE}/lookup`, { ...search, ...query });
