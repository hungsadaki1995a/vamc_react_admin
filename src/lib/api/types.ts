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

// POST /api/auth/login request body — vamc-npl-backend uses { username, password }
export interface LoginRequest {
  username: string;
  password: string;
}

// POST /api/auth/login response — vamc-npl-backend returns raw LoginResponse (no ApiResponse wrapper)
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

// POST /api/auth/refresh response
export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
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
