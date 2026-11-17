import { isTokenExpired, getTokenExp } from './jwtUtils';

export const ACCESS_TOKEN_KEY = 'accessToken';
export const LEGACY_ACCESS_TOKEN_KEY = 'vamc_access_token';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const LEGACY_REFRESH_TOKEN_KEY = 'vamc_refresh_token';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds?: number): void {
  if (typeof document === 'undefined') return;
  let cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
  if (typeof maxAgeSeconds === 'number') {
    cookie += `; max-age=${Math.max(0, maxAgeSeconds)}`;
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    cookie += '; Secure';
  }
  document.cookie = cookie;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Retrieve access token from localStorage or cookie.
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token =
      localStorage.getItem(ACCESS_TOKEN_KEY) ||
      localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY) ||
      getCookie(ACCESS_TOKEN_KEY) ||
      getCookie(LEGACY_ACCESS_TOKEN_KEY);
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Persist access token in both localStorage and cookie.
 */
export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, token);

    // Compute remaining cookie TTL based on JWT exp claim
    const exp = getTokenExp(token);
    const maxAge = exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 86400; // default 24h
    setCookie(ACCESS_TOKEN_KEY, token, maxAge);
    setCookie(LEGACY_ACCESS_TOKEN_KEY, token, maxAge);
  } catch {
    // Storage access might fail in private browsing mode
  }
}

/**
 * Retrieve refresh token from localStorage or cookie.
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token =
      localStorage.getItem(REFRESH_TOKEN_KEY) ||
      localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY) ||
      getCookie(REFRESH_TOKEN_KEY) ||
      getCookie(LEGACY_REFRESH_TOKEN_KEY);
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Persist refresh token in both localStorage and cookie.
 */
export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    localStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, token);
    const exp = getTokenExp(token);
    const maxAge = exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 7 * 86400; // default 7 days
    setCookie(REFRESH_TOKEN_KEY, token, maxAge);
    setCookie(LEGACY_REFRESH_TOKEN_KEY, token, maxAge);
  } catch {
    // ignore
  }
}

/**
 * Clear all tokens from localStorage and cookies on logout.
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    deleteCookie(ACCESS_TOKEN_KEY);
    deleteCookie(LEGACY_ACCESS_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
    deleteCookie(LEGACY_REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export { isTokenExpired, getTokenExp };

