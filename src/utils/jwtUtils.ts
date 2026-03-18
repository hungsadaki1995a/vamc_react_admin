import type { MeResponse } from '@/lib/api/types';

interface JwtClaims {
  sub: string;
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
 * vamc-npl-backend payload: { sub, username, authorities, type, exp, iat }
 */
export function jwtToMeResponse(accessToken: string): MeResponse {
  const claims = parseJwt(accessToken);
  const username = claims.sub || claims.username || '';
  return {
    usrId: username,
    usrNm: username,
    roles: claims.authorities ?? [],
  };
}
