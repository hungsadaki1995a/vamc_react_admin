import type { LoginResponse, MeResponse } from '@/lib/api/types';

export function mockLogin(_username: string, _password: string): LoginResponse {
  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    tokenType: 'Bearer',
    expiresIn: 7200,
  };
}

export function mockGetMe(): MeResponse {
  return {
    usrId: 'admin',
    usrNm: '관리자',
    email: 'admin@mock.local',
    dpCd: 'DEPT001',
    usrCCd: 'USR001',
    phnNo: '',
    roles: ['ROLE_ADMIN'],
  };
}
