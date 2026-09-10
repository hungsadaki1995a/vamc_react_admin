import type { MeResponse } from '@/lib/api/types';

interface JwtClaims {
  sub: string;
  /** 로그인 ID — 회원 MBR_NO / 직원 EMP_NO. 구버전 토큰은 username 이었다 */
  userNo?: string;
  /** @deprecated 2026-09-10 이전에 발급된 토큰 호환용 */
  username?: string;
  authorities?: string[];
  type?: 'ACCESS' | 'REFRESH';
  exp?: number;
  iat?: number;
}

function parseJwt(token: string): JwtClaims {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtClaims;
  } catch {
    return { sub: '' };
  }
}

/**
 * Extract user info from a JWT access token.
 * payload: { sub, userNo, authorities, type, exp, iat }
 */
export function jwtToMeResponse(accessToken: string): MeResponse {
  const claims = parseJwt(accessToken);
  const userNo = claims.sub || claims.userNo || claims.username || '';
  return {
    usrId: userNo,
    usrNm: userNo,
    roles: claims.authorities ?? [],
  };
}
