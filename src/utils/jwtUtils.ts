import type { MeResponse } from '@/lib/api/types';

export interface JwtClaims {
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

/**
 * Base64URL decoder supporting UTF-8 strings safely.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return atob(base64);
  }
}

/**
 * Parse JWT payload without external libraries.
 */
export function parseJwt(token: string): JwtClaims {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return { sub: '' };
    const decoded = base64UrlDecode(parts[1]);
    return JSON.parse(decoded) as JwtClaims;
  } catch {
    return { sub: '' };
  }
}

/**
 * Check if a JWT token is expired.
 * Returns true if the token is null, invalid, or current time >= exp (with 5s safety margin).
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  try {
    const claims = parseJwt(token);
    if (!claims || typeof claims.exp !== 'number') {
      return true;
    }
    const nowInSeconds = Math.floor(Date.now() / 1000);
    // 5-second buffer against minor clock skew
    return claims.exp <= nowInSeconds + 5;
  } catch {
    return true;
  }
}

/**
 * Get the expiration timestamp (in seconds) of a JWT token, or null if invalid.
 */
export function getTokenExp(token: string | null | undefined): number | null {
  if (!token) return null;
  try {
    const claims = parseJwt(token);
    return typeof claims.exp === 'number' ? claims.exp : null;
  } catch {
    return null;
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
