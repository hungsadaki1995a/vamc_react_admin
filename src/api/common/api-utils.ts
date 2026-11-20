import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// Shared helpers for hand-written admin API files (System Operation, Content Management).
// The admin backend answers `{ status, message, data }` (data omitted when null);
// `useApiQuery` / `useApiMutation` expect `success`, so every call is normalised here.

/** Body shape the admin backend actually returns. */
interface RawBody<T> {
  status?: number;
  message?: string;
  data?: T | null;
}

/** `PageResponse<T>` of the admin backend — `page` is 1-based. */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type SortDirection = 'ASC' | 'DESC';

/** Paging / sort query params of the admin backend `PageRequest` (page is 1-based, size ≤ 100). */
export interface PageQuery {
  page: number;
  size: number;
  /** Response field name; the server ignores fields it does not allow. */
  sortBy?: string;
  sortDirection?: SortDirection;
}

export const EMPTY_PAGE: PageResponse<never> = {
  content: [],
  page: 1,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

function normalize<T>(body: RawBody<T>, fallback?: T): ApiResponse<T> {
  return {
    status: body.status,
    success: body.status === 200,
    message: body.message ?? '',
    data: body.data ?? fallback ?? null,
  };
}

/** Drops empty-string / null / undefined params so the server sees "no filter". */
export function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<T>;
}

export async function apiGet<T>(url: string, params?: object, fallback?: T): Promise<ApiResponse<T>> {
  const { data } = await apiClient.get<RawBody<T>>(url, {
    params: params ? cleanParams(params) : undefined,
  });
  return normalize(data, fallback);
}

export async function apiPost<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  const { data } = await apiClient.post<RawBody<T>>(url, body);
  return normalize(data);
}

export async function apiPut<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  const { data } = await apiClient.put<RawBody<T>>(url, body);
  return normalize(data);
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  const { data } = await apiClient.patch<RawBody<T>>(url, body);
  return normalize(data);
}

/** DELETE with an optional JSON body (several admin endpoints take one). */
export async function apiDelete<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  const { data } = await apiClient.delete<RawBody<T>>(url, body ? { data: body } : undefined);
  return normalize(data);
}

/** Streams a binary response (xlsx, attachment) and saves it under `fileName`. */
export async function apiDownload(url: string, fileName: string, params?: object): Promise<void> {
  const response = await apiClient.get(url, {
    params: params ? cleanParams(params) : undefined,
    responseType: 'blob',
  });
  const objectUrl = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    window.URL.revokeObjectURL(objectUrl);
  }
}
