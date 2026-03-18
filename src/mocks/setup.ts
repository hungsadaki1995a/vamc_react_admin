// ─── axios-mock-adapter setup for VITE_MOCK=true ────────────────────────────
// Intercepts all apiClient requests and returns mock data.
// Import and call setupMocks() in main.tsx before rendering.

import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/lib/api/client';
import {
  MOCK_ACCESS_TOKEN,
  MOCK_REFRESH_TOKEN,
  MOCK_ME,
  MOCK_MENUS,
  MOCK_PROJECTS,
  MOCK_LABELS,
  MOCK_CODES,
  MOCK_PUBLIC_KEY,
} from './data';
import { getMockMenus } from './handlers/menu';

export function setupMocks(): void {
  // passThrough: false → unmatched routes return 404 (no real network calls)
  const mock = new MockAdapter(apiClient, { onNoMatch: 'passthrough' });

  // ── Auth ──────────────────────────────────────────────────────────────────

  // GET /api/auth/public-key
  mock.onGet('/api/auth/public-key').reply(200, {
    data: { publicKey: MOCK_PUBLIC_KEY },
  });

  // POST /api/auth/login — accept any credentials
  mock.onPost('/api/auth/login').reply(200, {
    accessToken: MOCK_ACCESS_TOKEN,
    refreshToken: MOCK_REFRESH_TOKEN,
    tokenType: 'Bearer',
    expiresIn: 3600,
    mustChangePassword: false,
  });

  // POST /api/auth/refresh
  mock.onPost('/api/auth/refresh').reply(200, {
    accessToken: MOCK_ACCESS_TOKEN,
    refreshToken: MOCK_REFRESH_TOKEN,
    tokenType: 'Bearer',
    expiresIn: 3600,
  });

  // POST /api/auth/logout
  mock.onPost('/api/auth/logout').reply(200, { success: true, message: 'success', data: null });

  // POST /api/auth/change-password
  mock.onPost('/api/auth/change-password').reply(200, { success: true, message: 'success', data: null });

  // ── User ──────────────────────────────────────────────────────────────────

  // GET /api/usr/:usrId
  mock.onGet(/\/api\/usr\/(.+)/).reply(200, {
    status: 200,
    message: 'success',
    data: {
      usrId: MOCK_ME.usrId,
      usrNm: MOCK_ME.usrNm,
      email: MOCK_ME.email,
      dpCd: MOCK_ME.dpCd,
      dpNm: '개발팀',
      phnNo: MOCK_ME.phnNo,
      usrCCd: MOCK_ME.usrCCd,
      useYn: 'Y',
      pswdErrCnt: 0,
      lgnLockYn: 'N',
    },
  });

  // ── Project ───────────────────────────────────────────────────────────────

  // GET /api/proj/my
  mock.onGet('/api/proj/my').reply(200, {
    status: 200,
    success: true,
    message: 'success',
    data: MOCK_PROJECTS,
  });

  // ── Menu ──────────────────────────────────────────────────────────────────

  // GET /api/common/menus/all (AdminMenuManagement)
  mock.onGet('/api/common/menus/all').reply(200, {
    status: 200,
    success: true,
    message: 'success',
    data: getMockMenus(),
  });

  // GET /api/mnu/auth-list
  mock.onGet('/api/mnu/auth-list').reply(200, {
    status: 200,
    message: 'success',
    data: MOCK_MENUS,
  });

  // ── Labels ────────────────────────────────────────────────────────────────

  // GET /api/lbl/bulk
  mock.onGet('/api/lbl/bulk').reply(200, {
    status: 200,
    message: 'success',
    data: MOCK_LABELS,
  });

  // ── Common codes ──────────────────────────────────────────────────────────

  // GET /api/comcd/all
  mock.onGet('/api/comcd/all').reply(200, {
    status: 200,
    success: true,
    message: 'success',
    data: MOCK_CODES,
  });

  // GET /api/comcd/codes
  mock.onGet('/api/comcd/codes').reply((config: { params?: Record<string, string> }) => {
    const cdDmnId = config.params?.cdDmnId as string | undefined;
    const filtered = cdDmnId ? MOCK_CODES.filter((c) => c.cdDmnId === cdDmnId) : MOCK_CODES;
    return [200, { status: 200, success: true, message: 'success', data: filtered }];
  });

  // GET /api/comcd/domains
  mock.onGet('/api/comcd/domains').reply(200, {
    status: 200,
    success: true,
    message: 'success',
    data: [],
  });

  // ── CCO (사용자관리) ──────────────────────────────────────────────────────

  // GET /api/cco/usr (사용자 목록)
  mock.onGet('/api/cco/usr').reply(200, {
    status: 200,
    success: true,
    message: 'success',
    data: [
      { usrId: 'admin', usrNm: '관리자', email: 'admin@shinhan.com', dpCd: 'IT001', dpNm: '개발팀', usrCCd: 'ADM', useYn: 'Y', phnNo: '010-0000-0000', pswdErrCnt: 0, lgnLockYn: 'N' },
      { usrId: 'user01', usrNm: '홍길동', email: 'hong@shinhan.com', dpCd: 'IT001', dpNm: '개발팀', usrCCd: 'USR', useYn: 'Y', phnNo: '010-1111-2222', pswdErrCnt: 0, lgnLockYn: 'N' },
      { usrId: 'user02', usrNm: '김철수', email: 'kim@shinhan.com', dpCd: 'IT002', dpNm: '기획팀', usrCCd: 'USR', useYn: 'Y', phnNo: '010-3333-4444', pswdErrCnt: 0, lgnLockYn: 'N' },
    ],
  });

  console.info('[Mock] API mock enabled — all requests intercepted');
}
