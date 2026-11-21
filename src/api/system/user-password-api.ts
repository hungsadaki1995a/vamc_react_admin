import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import { encryptPassword } from '@/lib/crypto';
import { fetchPublicKey } from '@/api/common/auth-api';

/**
 * User password change API — system operations domain.
 *
 * Used by the initial password change modal right after login (`features/auth/InitChangePwModal`).
 *
 * ⚠️ Keep **only calls actually implemented on the server** in this file. User lookup/register/update APIs
 *    have no controllers in either backend, so when building a user management screen, implement the server first
 *    and create a new `usrMngApi.ts`.
 */

// Server response is { status, message, data } — convert to ApiResponse checked by success
interface RawResp<T> { status: number; message: string; data: T | null }

/**
 * POST /api/usr/change-password — change password (sent encrypted with RSA-OAEP).
 * Always fetch the public key fresh (no caching — server rotates keys).
 */
export async function changePwd(usrId: string, newPswd: string): Promise<ApiResponse<void>> {
  // Public key lookup uses the same endpoint as login — reuse `@/api/common/authApi`.
  // Unlike login, password change has no plaintext fallback (always encrypted).
  const publicKey = await fetchPublicKey();
  if (!publicKey) {
    return { success: false, message: 'Unable to change password because the public key could not be retrieved.', data: null };
  }
  const [encUsrId, encChgPasswd] = await Promise.all([
    encryptPassword(publicKey, usrId),
    encryptPassword(publicKey, newPswd),
  ]);
  const { data } = await apiClient.post<RawResp<void>>('/api/usr/change-password', { usrId: encUsrId, encChgPasswd });
  return data.status === 200
    ? { success: true,  message: data.message, data: null }
    : { success: false, message: data.message, data: null };
}
