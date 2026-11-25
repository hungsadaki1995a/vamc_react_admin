import i18n from '@/lib/i18n';
import { apiClient } from '@/lib/api/client';

// Staff upload of a member's ID documents (paper sign-up, VPA030100P01).
// Flow: open a session for the member type → upload each file into its slot → send `regSessionId`
// and the returned file ids with create / update member. Sessions expire after 30 minutes idle.

/** Member type of the session: P individual, F foreigner, O organization. */
export type MemberDocumentType = 'P' | 'F' | 'O';

/** Document slot. P: ID_FRONT, ID_BACK, PASSPORT; F: PASSPORT; O: the remaining five. */
export type MemberDocumentSlot =
  | 'ID_FRONT'
  | 'ID_BACK'
  | 'PASSPORT'
  | 'BIZ_LICENSE'
  | 'AUTH_REP_ID_FRONT'
  | 'AUTH_REP_ID_BACK'
  | 'AUTH_REP_PASSPORT'
  | 'POA';

export interface MemberDocumentSession {
  regSessionId: string;
  mbrTypeCd: MemberDocumentType;
  expiresAt?: string;
  slots?: { slot: MemberDocumentSlot; maxFiles: number }[];
}

export interface MemberDocumentUpload {
  fileId: string;
  slot: MemberDocumentSlot;
  contentType?: string;
  fileSize?: number;
  /** File this upload replaced (single-file slots keep the newest file). */
  replacedFileId?: string;
}

const BASE = '/api/v1/member-document-sessions';

export async function openMemberDocumentSession(mbrTypeCd: MemberDocumentType): Promise<MemberDocumentSession> {
  const { data } = await apiClient.post<{ data?: MemberDocumentSession }>(BASE, { mbrTypeCd });
  if (!data.data) throw new Error(i18n.t('messages.api.uploadSessionNotOpened'));
  return data.data;
}

/** One file (jpg, jpeg, png, pdf; max 10MB) into one slot. */
export async function uploadMemberDocument(
  sessionId: string,
  slot: MemberDocumentSlot,
  file: File,
): Promise<MemberDocumentUpload> {
  const body = new FormData();
  body.append('file', file);
  const { data } = await apiClient.post<{ data?: MemberDocumentUpload }>(`${BASE}/${sessionId}/files`, body, {
    params: { slot },
  });
  if (!data.data) throw new Error(i18n.t('messages.api.uploadNoFile'));
  return data.data;
}

export const removeMemberDocument = (sessionId: string, fileId: string) =>
  apiClient.delete(`${BASE}/${sessionId}/files/${fileId}`);

export const cancelMemberDocumentSession = (sessionId: string) => apiClient.delete(`${BASE}/${sessionId}`);
