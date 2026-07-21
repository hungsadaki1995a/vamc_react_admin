/**
 * Mock data and mock API implementations for template/offline use.
 * Activated when VITE_MOCK_MODE=true in .env.local
 *
 * Mock credentials: any username / any password
 */

import type { ApiResponse, LoginResponse, MeResponse, MyProjectResponseDto } from '@/lib/api/types';
import type { MenuItem } from '@/types/menu';
import type { CodeDetail } from '@/api/common';

// ─── Mock credentials ─────────────────────────────────────────────────────────
// Any username + any password is accepted in mock mode.

// ─── Mock login ───────────────────────────────────────────────────────────────
export async function mockLogin(_username: string): Promise<ApiResponse<LoginResponse>> {
  await delay(300);
  return {
    success: true,
    message: 'success',
    data: {
      accessToken: 'mock-access-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      mustChangePassword: false,
    },
  };
}

// ─── Mock getMe ───────────────────────────────────────────────────────────────
export async function mockGetMe(usrId: string): Promise<ApiResponse<MeResponse>> {
  await delay(100);
  return {
    success: true,
    message: 'success',
    data: {
      usrId,
      usrNm: usrId === 'admin' ? '관리자' : usrId,
      email: `${usrId}@example.com`,
      dpCd: 'DEPT001',
      usrCCd: 'KR',
      phnNo: '010-0000-0000',
      roles: ['ROLE_ADMIN'],
    },
  };
}

// ─── Mock getMyProjects ───────────────────────────────────────────────────────
export async function mockGetMyProjects(): Promise<ApiResponse<MyProjectResponseDto[]>> {
  await delay(100);
  return {
    success: true,
    message: 'success',
    data: [
      {
        projId: 'PROJ001',
        projNm: '샘플 프로젝트',
        projType: 'SI',
        clnNm: '고객사',
        bzDpNm: '사업부서',
        pmId: 'admin',
        adminId: 'admin',
        pnSrDt: '2025-01-01',
        pnEdDt: '2025-12-31',
        rltSrDt: null,
        rltEdDt: null,
        bigo: null,
        rgDttm: '2025-01-01T00:00:00',
        roles: [{ roleId: 'ROLE_ADMIN', roleNm: '관리자' }],
      },
    ],
  };
}

// ─── Mock fetchAuthMenuList ───────────────────────────────────────────────────
export async function mockFetchAuthMenuList(): Promise<MenuItem[]> {
  await delay(100);
  return [];
}

// ─── Mock fetchBulkLabels ─────────────────────────────────────────────────────
export async function mockFetchBulkLabels(): Promise<Record<string, string>> {
  await delay(50);
  return {};
}

// ─── Mock getAllCodeList ──────────────────────────────────────────────────────
export async function mockGetAllCodeList(): Promise<CodeDetail[]> {
  await delay(50);
  return [];
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const IS_MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';
