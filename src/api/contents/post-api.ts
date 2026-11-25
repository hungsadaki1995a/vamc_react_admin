import { apiClient } from '@/lib/api/client';
import { apiDelete, apiDownload, apiGet, apiPatch, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';

// Content board API — the admin backend serves every board (BBS_MNG) with the same
// shapes under `/api/v1/contents/{board}`:
//   notices · news · npl-announcements · careers · legal-documents · about · service-guides
// Only the request body of create / update differs per board.

/** Path segment under /api/v1/contents. */
export type BoardPath =
  | 'notices'
  | 'news'
  | 'npl-announcements'
  | 'careers'
  | 'legal-documents'
  | 'about'
  | 'service-guides';

/** `board` query value of the file endpoints (BoardType enum of the backend). */
export type FileBoard =
  | 'NOTICE'
  | 'NEWS'
  | 'NPL_ANNOUNCEMENT'
  | 'CAREER'
  | 'LEGAL'
  | 'ABOUT'
  | 'SERVICE_GUIDE';

export type YesNo = 'Y' | 'N';

/** List row (PostResponse). */
export interface Post {
  pstNo: string;
  /** Numeric post id (PST_SN) shown in the ID column. */
  postSn?: number;
  category?: string;
  categoryNm?: string;
  title: string;
  /** Document number (NPL announcement), section key (service guide), free tag (about). */
  tag?: string;
  name?: string;
  published: YesNo;
  /** Y when the English title is saved ("English" column: Y / -). */
  hasEnglish?: YesNo;
  pinned?: YesNo;
  pinOrder?: number;
  displayOrder?: number;
  attachmentCount?: number;
  viewCount?: number;
  // Legal documents
  docNumber?: string;
  /** ddMMyyyy */
  issueDate?: string;
  lawGroup?: string;
  lawGroupNm?: string;
  lawField?: string;
  lawFieldNm?: string;
  issuingAuthority?: string;
  issuingAuthorityNm?: string;
  crtDt?: string;
  crtBy?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
  mdfcnByNm?: string;
}

export interface ContentFile {
  fileUnqId: string;
  fileSeq: number;
  /** Stored name `<uuid>_<original>`. */
  fileNm: string;
  fileExtnNm?: string;
  fileSz?: number;
  downloadUrl?: string;
}

export interface ContentFileGroup {
  fileUnqId: string;
  files: ContentFile[];
}

/** Detail (PostDetailResponse). */
export interface PostDetail extends Post {
  content?: string;
  titleEn?: string;
  contentEn?: string;
  summary?: string;
  email?: string;
  phone?: string;
  extraJson?: string;
  thumbnailFileId?: string;
  imageFileId?: string;
  attachmentFileId?: string;
  attachments?: ContentFile[];
  /** false while a "locked while published" board post is posted. */
  contentEditable?: boolean;
}

export interface PostSearch {
  published?: YesNo;
  category?: string;
  /** dd/MM/yyyy */
  fromDate?: string;
  toDate?: string;
  keyword?: string;
  /** "Notice Type": Y = pinned (Notice), N = General. */
  pinned?: YesNo;
  /** Header sort; omitted = the board's default order. */
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  // Legal documents
  lawGroup?: string;
  lawField?: string;
  issueFromDate?: string;
  issueToDate?: string;
}

const base = (board: BoardPath) => `/api/v1/contents/${board}`;

export const getPosts = (board: BoardPath, search: PostSearch, page: number, size: number) =>
  apiGet<PageResponse<Post>>(base(board), { ...search, page, size });

export const getPost = (board: BoardPath, pstNo: string) =>
  apiGet<PostDetail>(`${base(board)}/${encodeURIComponent(pstNo)}`);

export const createPost = (board: BoardPath, body: object) => apiPost<PostDetail>(base(board), body);

export const updatePost = (board: BoardPath, pstNo: string, body: object) =>
  apiPut<PostDetail>(`${base(board)}/${encodeURIComponent(pstNo)}`, body);

/** Category / posting / top-display of one post (notices, news, npl-announcements). */
export const updatePostStatus = (
  board: BoardPath,
  pstNo: string,
  body: { category: string; published: YesNo; pinned?: YesNo; pinOrder?: number },
) => apiPatch<PostDetail>(`${base(board)}/${encodeURIComponent(pstNo)}/status`, body);

/** Bulk post / stop posting. */
export const publishPosts = (board: BoardPath, pstNos: string[], published: YesNo) =>
  apiPatch<void>(`${base(board)}/publish`, { pstNos, published });

export const deletePosts = (board: BoardPath, pstNos: string[]) =>
  apiDelete<void>(base(board), { pstNos });

/** Same filters and sort as the list (notices, news, npl-announcements, careers, legal-documents). */
export const downloadPostExcel = (board: BoardPath, search: PostSearch) =>
  apiDownload(`${base(board)}/excel`, `${board}.xlsx`, search);

// ── Legal document dropdowns ────────────────────────────────────────────────

export interface CodeOption {
  code: string;
  name: string;
}

export interface LegalOptions {
  docTypes: CodeOption[];
  groups: CodeOption[];
  fields: CodeOption[];
  issuingAuthorities: CodeOption[];
}

export const getLegalOptions = () => apiGet<LegalOptions>(`${base('legal-documents')}/options`);

// ── Attachments (ATCH_FILE groups) ──────────────────────────────────────────

/**
 * Uploads files into an attachment group (multipart part `files`, at most 10 per group).
 * Pass `fileUnqId` to append to an existing group; the answer lists the whole group.
 */
export async function uploadContentFiles(
  board: FileBoard,
  files: File[],
  fileUnqId?: string,
): Promise<ContentFileGroup> {
  const body = new FormData();
  files.forEach((file) => body.append('files', file));
  const { data } = await apiClient.post<{ data?: ContentFileGroup }>('/api/v1/contents/files', body, {
    params: { board, ...(fileUnqId ? { fileUnqId } : {}) },
  });
  if (!data.data) throw new Error('Upload did not return a file group.');
  return data.data;
}

export const getContentFiles = (board: FileBoard, fileUnqId: string) =>
  apiGet<ContentFileGroup>(`/api/v1/contents/files/${fileUnqId}`, { board });

export const deleteContentFile = (board: FileBoard, fileUnqId: string, fileSeq: number) =>
  apiClient.delete(`/api/v1/contents/files/${fileUnqId}/${fileSeq}`, { params: { board } });

/** Downloads one attachment through the authenticated client. */
export const downloadContentFile = (file: ContentFile) =>
  apiDownload(
    `/api/v1/attachments/${file.fileUnqId}/${file.fileSeq}/download`,
    originalFileName(file.fileNm),
  );

/** Stored names are `<uuid>_<original>` — show and save the original part. */
export function originalFileName(storedName: string): string {
  return storedName.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
}

/** Loads an attachment as an object URL (the preview endpoint needs the bearer token). */
export async function fetchAttachmentPreview(fileUnqId: string, fileSeq = 1): Promise<string> {
  const response = await apiClient.get(`/api/v1/attachments/${fileUnqId}/${fileSeq}/preview`, {
    responseType: 'blob',
  });
  return window.URL.createObjectURL(response.data as Blob);
}
