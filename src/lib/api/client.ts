import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './error';
import { apiNotify } from './api-notify';
import { useAuthStore } from '@/stores/auth-store';
import { getAccessToken, setAccessToken as setStoredAccessToken, clearTokens } from '@/utils/token-storage';
import { useProjectStore } from '@/stores/project-store';
import { useLocaleStore } from '@/stores/locale-store';
import { toIsoLangTag } from '@/utils/locale-storage';
import { useLabelStore } from '@/stores/label-store';
import { useLoadingStore } from '@/stores/loading-store';
import { useTabStore } from '@/stores/tab-store';
import { registerTabRequest, unregisterTabRequest } from './tab-request-registry';

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

// Exclude global APIs unrelated to tab lifecycle
const TAB_BIND_DENYLIST = ['/api/auth/', '/api/mnu', '/api/common/menus', '/api/lbl', '/api/comcd'];

// For populating AUDIT_LOG.MENU_CD (CHAR(9), references MENU_MNG.MENU_CD) — send only keys from server menus.
// Static menu keys (dashboard, dev.*) are not menu codes, so this pattern filters them out.
const MENU_CD_PATTERN = /^[A-Z][A-Z0-9]{8}$/;

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
  baseURL: ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/+$/, ''),
  timeout: 30_000,
  withCredentials: true, // required for httpOnly refresh token cookie
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor: inject Access Token + loading ───────────────────────
apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken || getAccessToken();
  const activeProject = useProjectStore.getState().activeProject;
  const locale = useLocaleStore.getState().locale;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (activeProject) {
    config.headers['X-Project-Id'] = activeProject.id;
  }

  config.headers['X-Lang'] = locale;
  config.headers['Accept-Language'] = toIsoLangTag(locale);

  // Menu code of the current screen (active tab). Omitted for bootstrap calls (login/labels/menus) since no tab is active —
  // actions without menu context result in MENU_CD = NULL on the server.
  const activeTabKey = useTabStore.getState().activeTabKey;
  if (activeTabKey && MENU_CD_PATTERN.test(activeTabKey)) {
    config.headers['X-Menu-Cd'] = activeTabKey;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  useLoadingStore.getState().increment();

  // Tab binding: register active tab's requests in the registry so they can be batch-aborted on tab close
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

    // Pass through requests canceled by tab close etc. silently (no toast/conversion)
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    if (!error.response) {
      // Defer toast render to next microtask — keeps current error-handling chain lean
      if (!config?.skipErrorToast) {
        // Label first + English fallback — outside React so hooks cannot be used; read via getState()
        // (same pattern as httpMessage in `lib/api/error.ts`).
        queueMicrotask(() => apiNotify.error(
          useLabelStore.getState().t('MESSAGE.ERROR.TEXT_NETWORK', 'Please check your network connection.'),
        ));
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
        clearTokens();
        useAuthStore.getState().logout();
        return Promise.reject(ApiError.fromAxiosError(error));
      }

      if (config?._retry) {
        processQueue(null, error);
        clearTokens();
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

        setStoredAccessToken(newToken);
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(newToken);
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      } catch (refreshError) {
        processQueue(null, refreshError);
        clearTokens();
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
