import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './error';
import { apiNotify } from './apiNotify';
import type { ApiResponse, LoginResponse } from './types';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useLocaleStore } from '@/stores/localeStore';

// Extend config type to support retry flag
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ─── Silent refresh queue ─────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(token: string | null, error: unknown = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
}

// ─── Axios instance ───────────────────────────────────────────────────────────
// baseURL: http://localhost:8180
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: 30_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor: inject Access Token ─────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  const activeProject = useProjectStore.getState().activeProject;
  const locale = useLocaleStore.getState().locale;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (activeProject) {
    config.headers['X-Project-Id'] = activeProject.id;
  }

  config.headers['X-Lang'] = locale;

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// ─── Response interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;

    if (!error.response) {
      // Defer toast render to next microtask — keeps current error-handling chain lean
      queueMicrotask(() => apiNotify.error('네트워크 연결을 확인해 주세요.'));
      return Promise.reject(ApiError.fromAxiosError(error));
    }

    const { status } = error.response;

    // ── 401: Silent Refresh ────────────────────────────────────────────────
    if (status === 401) {
      if (config?.url?.includes('/api/auth/refresh')) {
        processQueue(null, error);
        useAuthStore.getState().logout();
        return Promise.reject(ApiError.fromAxiosError(error));
      }

      if (config?._retry) {
        processQueue(null, error);
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(ApiError.fromAxiosError(error));
      }

      if (!config) {
        return Promise.reject(ApiError.fromAxiosError(error));
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(config);
        });
      }

      config._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = useAuthStore.getState().refreshToken;
        if (!storedRefreshToken) throw new Error('No refresh token stored');

        // vamc-npl-backend: POST /api/auth/refresh with Refresh-Token header, returns raw LoginResponse
        const { data } = await apiClient.post<LoginResponse>(
          '/api/auth/refresh',
          {},
          { _retry: true } as RetryableConfig,
        );

        const newToken = data.accessToken;
        if (!newToken) throw new Error('No access token in refresh response');

        useAuthStore.getState().setAccessToken(newToken);
        processQueue(newToken);
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      } catch (refreshError) {
        processQueue(null, refreshError);
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(ApiError.from(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    // ── 403: Forbidden ────────────────────────────────────────────────────
    if (status === 403) {
      queueMicrotask(() => apiNotify.error('접근 권한이 없습니다.'));
      return Promise.reject(ApiError.fromAxiosError(error));
    }

    // ── 500+: Server error ────────────────────────────────────────────────
    if (status >= 500) {
      queueMicrotask(() => apiNotify.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'));
      return Promise.reject(ApiError.fromAxiosError(error));
    }

    return Promise.reject(ApiError.fromAxiosError(error));
  },
);

// ─── List response helper ──────────────────────────────────────────────────────
// Extract array from list responses where data is wrapped: { code, message, data: { [key]: T[] } }
//
// @example
// const res = await apiClient.get<ApiResponse<{ mtxTt: Task[] }>>('/tasks/list');
// return fromList(res.data, 'mtxTt'); // → ApiResponse<Task[]>
export function fromList<T, K extends string = string>(
  res: ApiResponse<Record<K, T[]>>,
  key: K,
): ApiResponse<T[]> {
  return {
    success: res.success,
    message: res.message,
    data: res.success ? (res.data?.[key] ?? []) : null,
  };
}
