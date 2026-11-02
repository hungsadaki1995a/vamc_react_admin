import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './error';
import { apiNotify } from './apiNotify';
import { useAuthStore } from '@/stores/authStore';
import { getAccessToken, setAccessToken as setStoredAccessToken, clearTokens } from '@/utils/tokenStorage';
import { useProjectStore } from '@/stores/projectStore';
import { useLocaleStore } from '@/stores/localeStore';
import { useLabelStore } from '@/stores/labelStore';
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

// AUDIT_LOG.MENU_CD(CHAR(9), MENU_MNG.MENU_CD 참조) 적재용 — 서버 메뉴에서 온 키만 보낸다.
// 정적 메뉴(dashboard, dev.*)의 키는 메뉴코드가 아니므로 이 패턴에서 걸러진다.
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

  // 현재 화면(활성 탭)의 메뉴코드. 부트스트랩 호출(로그인·라벨·메뉴)은 활성 탭이 없어 생략된다 —
  // 메뉴 컨텍스트가 없는 행위이므로 서버에서 MENU_CD 는 NULL 이 된다.
  const activeTabKey = useTabStore.getState().activeTabKey;
  if (activeTabKey && MENU_CD_PATTERN.test(activeTabKey)) {
    config.headers['X-Menu-Cd'] = activeTabKey;
  }

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
        // 라벨 우선 + 한국어 폴백 — React 밖이라 훅을 못 쓰므로 getState() 로 읽는다
        // (`lib/api/error.ts` 의 httpMessage 와 같은 패턴).
        queueMicrotask(() => apiNotify.error(
          useLabelStore.getState().t('MESSAGE.ERROR.TEXT_NETWORK', '네트워크 연결을 확인해 주세요.'),
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
