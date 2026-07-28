import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './error';
import { apiNotify } from './apiNotify';
import type { ApiResponse } from './types';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useLocaleStore } from '@/stores/localeStore';
import { useLoadingStore } from '@/stores/loadingStore';
import { useTabStore } from '@/stores/tabStore';
import { registerTabRequest, unregisterTabRequest } from './tabRequestRegistry';

// Extend config type to support retry flag + tab binding + toast opt-out
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  __tabKey?: string;
  __tabCtrl?: AbortController;
  skipErrorToast?: boolean;
}

declare module 'axios' {
  interface AxiosRequestConfig {
    skipErrorToast?: boolean;
  }
}

// 탭 수명과 무관한 전역 API는 바인딩 제외
const TAB_BIND_DENYLIST = ['/api/auth/', '/api/mnu', '/api/common/menus', '/api/lbl', '/api/comcd'];

function shouldBindToTab(url?: string): boolean {
  if (!url) return false;
  return !TAB_BIND_DENYLIST.some((path) => url.includes(path));
}

function cleanupTabBinding(config?: InternalAxiosRequestConfig): void {
  const cfg = config as RetryableConfig | undefined;
  if (cfg?.__tabKey && cfg.__tabCtrl) {
    unregisterTabRequest(cfg.__tabKey, cfg.__tabCtrl);
    cfg.__tabKey = undefined;
    cfg.__tabCtrl = undefined;
  }
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
// baseURL: '' (empty → Vite proxy: /api → http://127.0.0.1:8080)
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: 30_000,
  withCredentials: true, // required for httpOnly refresh token cookie
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor: inject Access Token + loading ───────────────────────
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

  useLoadingStore.getState().increment();

  // 탭 귀속: 활성 탭의 요청을 레지스트리에 등록해 탭 닫기 시 일괄 취소 가능하게 한다
  const cfg = config as RetryableConfig;
  if (!cfg.__tabKey) {
    const tabKey = useTabStore.getState().activeTabKey;
    if (tabKey && shouldBindToTab(config.url)) {
      const ctrl = new AbortController();
      cfg.__tabKey = tabKey;
      cfg.__tabCtrl = ctrl;
      registerTabRequest(tabKey, ctrl);
      config.signal =
        config.signal && typeof AbortSignal.any === 'function'
          ? AbortSignal.any([config.signal as AbortSignal, ctrl.signal])
          : (config.signal ?? ctrl.signal);
    }
  }

  return config;
});

// ─── Response interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    cleanupTabBinding(response.config);
    useLoadingStore.getState().decrement();
    return response;
  },

  async (error: AxiosError) => {
    cleanupTabBinding(error.config);
    useLoadingStore.getState().decrement();
    const config = error.config as RetryableConfig | undefined;

    // 탭 닫기 등으로 취소된 요청은 조용히 통과 (토스트/변환 없음)
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    if (!error.response) {
      // Defer toast render to next microtask — keeps current error-handling chain lean
      if (!config?.skipErrorToast) {
        queueMicrotask(() => apiNotify.error('네트워크 연결을 확인해 주세요.'));
      }
      return Promise.reject(ApiError.fromAxiosError(error));
    }

    const { status } = error.response;

    // ── 401: Silent Refresh ────────────────────────────────────────────────
    if (status === 401) {
      // Login failure — pass original error through without attempting refresh
      if (config?.url?.includes('/api/auth/login')) {
        return Promise.reject(ApiError.fromAxiosError(error));
      }

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
        // httpOnly cookie is sent automatically by the browser (withCredentials: true)
        const { data } = await apiClient.post<{ accessToken: string }>(
          '/api/auth/refresh',
          {},
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
      const apiErr = ApiError.fromAxiosError(error);
      if (!config?.skipErrorToast) {
        queueMicrotask(() => apiNotify.error(apiErr.userMessage));
      }
      return Promise.reject(apiErr);
    }

    // ── 500+: Server error ────────────────────────────────────────────────
    if (status >= 500) {
      const apiErr = ApiError.fromAxiosError(error);
      if (!config?.skipErrorToast) {
        queueMicrotask(() => apiNotify.error(apiErr.userMessage));
      }
      return Promise.reject(apiErr);
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
