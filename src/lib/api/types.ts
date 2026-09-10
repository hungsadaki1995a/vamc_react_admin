// ─── Common response wrapper ──────────────────────────────────────────────────
// Matches actual backend format: { success, message, data }
// success true = success, false = error
export interface ApiResponse<T = unknown> {
  status?: number;
  success: boolean;
  message: string;
  data: T | null | undefined;
}

// Pagination meta
export interface PaginationMeta {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Internal error response shape (used by ApiError class)
export interface ApiErrorResponse {
  code: string;
  /** Business error code matching DB label key (e.g. "E100040") */
  errorCode?: string;
  /** i18n label substitution values for $1, $2, ... */
  errorArgs?: string[];
  data: null;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
}

// ─── Pagination request params ────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ─── Auth types ───────────────────────────────────────────────────────────────

// Matches server t_cco_usr_m model
export interface UserInfo {
  usrId: string;
  usrNm: string;
  email?: string;
  dpCd?: string;
  usrCCd?: string;
  phnNo?: string;
}

// POST /api/auth/login request body
// loginId — 로그인 ID. 관리자앱은 직원번호(EMP_INFO.EMP_NO) 다.
// Spring Security 는 이 값을 username 이라 부르지만 사람 이름이 아니라 계정 식별자다.
export interface LoginRequest {
  loginId: string;
  password: string;
}

// POST /api/auth/login response — vamc-npl-backend returns raw LoginResponse (no ApiResponse wrapper)
// Refresh token is set as httpOnly cookie by the backend
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  mustChangePassword?: boolean;
}

// POST /api/auth/refresh response — httpOnly cookie rotation handled by backend
export interface RefreshResponse {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
}

// ─── Project types ────────────────────────────────────────────────────────────

export interface ProjectRoleDto {
  roleId: string;
  roleNm: string;
}

export interface MyProjectResponseDto {
  projId: string;
  projNm: string | null;
  projType: string | null;
  clnNm: string | null;
  bzDpNm: string | null;
  pmId: string | null;
  adminId: string;
  pnSrDt: string | null;
  pnEdDt: string | null;
  rltSrDt: string | null;
  rltEdDt: string | null;
  bigo: string | null;
  rgDttm: string;
  roles: ProjectRoleDto[];
}

// GET /users/me response
export interface MeResponse {
  usrId: string;
  usrNm: string;
  email?: string;
  dpCd?: string;
  usrCCd?: string;
  phnNo?: string;
  roles: string[];
}
