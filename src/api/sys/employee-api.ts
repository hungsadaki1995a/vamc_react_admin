import { apiDelete, apiGet, apiPost, apiPut } from '@/api/common/api-util';
import type { PageResponse } from '@/api/common/api-util';

// User (employee) Management API — EmployeeController (`/api/v1/employees`).
// Guard menu A06020200. Screens VPA004501 (list) / VPA0045P01 (popup); the lookup
// endpoint also serves the "Select Person in Charge" popup (VPA0046P01).

/** COM_CD EMP_STTS_CD — H employed, L leave / locked, R retired, S suspended. */
export type EmpStatus = 'H' | 'L' | 'R' | 'S';

/** List row — e-mail and mobile are masked by the server. */
export interface Employee {
  empNo: string;
  empNm: string;
  empEmlAddr?: string;
  empTelno?: string;
  empMoblTelno?: string;
  empSttsCd: EmpStatus;
  jbpsNm?: string;
  pswdFailNmtm?: number;
  updatedAt?: string;
}

/** Detail — unmasked. Always load this before editing (update is a full overwrite). */
export interface EmployeeDetail extends Employee {
  /** ddMMyyyy */
  pswdChgDmy?: string;
  createdAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface EmployeeSearch {
  /** LIKE %x% */
  empNo?: string;
  /** Accepted but ignored by the list endpoint (name column is encrypted). */
  empNm?: string;
  empSttsCd?: EmpStatus;
}

export interface UpdateEmployeeRequest {
  empNm: string;
  empEmlAddr: string;
  empTelno?: string;
  empMoblTelno?: string;
  empSttsCd: EmpStatus;
  jbpsNm?: string;
}

export interface CreateEmployeeRequest extends UpdateEmployeeRequest {
  /** `^[a-zA-Z0-9_-]{3,10}$` */
  empNo: string;
  /** 8–50 chars, sent as plain text and hashed by the server. */
  password: string;
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
}

const BASE = '/api/v1/employees';

export const getEmployees = (search: EmployeeSearch, page: number, size: number) =>
  apiGet<PageResponse<Employee>>(BASE, { ...search, page, size });

export const getEmployee = (empNo: string) => apiGet<EmployeeDetail>(`${BASE}/${empNo}`);

export const createEmployee = (request: CreateEmployeeRequest) =>
  apiPost<EmployeeDetail>(BASE, request);

export const updateEmployee = (empNo: string, request: UpdateEmployeeRequest) =>
  apiPut<EmployeeDetail>(`${BASE}/${empNo}`, request);

/** Sets a new password, resets the fail count and clears the login block. */
export const resetEmployeePassword = (empNo: string, newPassword: string) =>
  apiPut<void>(`${BASE}/${empNo}/password`, { newPassword });

/** Hard delete, one employee per call; the caller cannot delete their own account. */
export const deleteEmployee = (empNo: string) => apiDelete<void>(`${BASE}/${empNo}`);

/** Active (H) employees only. */
export const lookupEmployees = (search: EmployeeLookupSearch, page: number, size: number) =>
  apiGet<PageResponse<EmployeeLookup>>(`${BASE}/lookup`, { ...search, page, size });
