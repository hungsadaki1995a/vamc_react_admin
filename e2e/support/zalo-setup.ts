import { webcrypto } from 'node:crypto';
import { credentials } from './session';

// Direct admin API calls for the Zalo demo spec (status check and clean-up), with the E2E_USER account.
// Calls go straight to E2E_API_TARGET (no browser, no Origin header, so no CORS involved).

const API_TARGET = (process.env.E2E_API_TARGET ?? 'http://127.0.0.1:7200').replace(/\/+$/, '');

interface Body<T> {
  status?: number;
  message?: string;
  data?: T;
}

let token: string | undefined;

async function login(): Promise<string> {
  if (token) return token;
  const { user, pass } = credentials();
  const keyRes = (await (await fetch(`${API_TARGET}/api/auth/public-key`)).json()) as Body<{ publicKey: string }>;
  const der = Buffer.from(keyRes.data?.publicKey ?? '', 'base64');
  const publicKey = await webcrypto.subtle.importKey('spki', der, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  const encrypted = await webcrypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, new TextEncoder().encode(pass));
  const res = await fetch(`${API_TARGET}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept-Language': 'en' },
    body: JSON.stringify({ loginId: user, password: Buffer.from(encrypted).toString('base64') }),
  });
  const body = (await res.json()) as { accessToken?: string; data?: { accessToken?: string } };
  const accessToken = body.accessToken ?? body.data?.accessToken;
  if (!res.ok || !accessToken) throw new Error(`API login failed (HTTP ${res.status})`);
  token = accessToken;
  return accessToken;
}

/** Calls the admin API; returns the HTTP status and `data` (no throw, clean-up tolerates 404 / 409). */
export async function zaloApi<T>(method: string, path: string, body?: unknown): Promise<{ status: number; data?: T }> {
  const res = await fetch(`${API_TARGET}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await login()}`,
      'Accept-Language': 'en',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Body<T>;
  return { status: res.status, data: json.data };
}

export interface ZaloStatusBody {
  enabled: boolean;
  mockMode: boolean;
  phoneIndexReady: boolean;
}

export interface ZaloUserRow {
  zaloUserId: string;
  linkStatus: 'LINKED' | 'PENDING';
  userNo?: string;
}

/** Zalo users currently linked to `userNo` (exact account number search). */
export async function zaloUsersOf(userNo: string): Promise<ZaloUserRow[]> {
  const { data } = await zaloApi<{ content: ZaloUserRow[] }>('GET', `/api/v1/zalo/users?page=1&size=20&keyword=${encodeURIComponent(userNo)}`);
  return data?.content ?? [];
}
