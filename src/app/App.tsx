import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd';
import koKR from 'antd/locale/ko_KR';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { useThemeStore } from '@/stores/themeStore';
import { useLocaleStore } from '@/stores/localeStore';
import { useAuthStore } from '@/stores/authStore';
import { useMenuStore } from '@/stores/menuStore';
import { useComcdStore } from '@/stores/comcdStore';
import { useLabelStore } from '@/stores/labelStore';
import { refreshToken } from '@/features/auth/LoginPage/api';
import { apiNotify } from '@/lib/api/apiNotify';
import { jwtToMeResponse } from '@/utils/jwtUtils';
import AuthGuard from '@/components/auth/AuthGuard';
import LoginPage from '@/features/auth/LoginPage';
import AppLayout from './AppLayout';
import GlobalLoadingBar from '@/components/common/GlobalLoadingBar';

// Registers axios interceptor error messages into the antd message context.
// Must be rendered inside <AntApp> to access App.useApp().
function ApiNotifyBridge() {
  const { message } = AntApp.useApp();
  useEffect(() => {
    apiNotify.setHandler((level, content) => message[level](content));
  }, [message]);
  return null;
}

export default function App() {
  const mode = useThemeStore((s) => s.mode);
  const locale = useLocaleStore((s) => s.locale);
  const antLocale = locale === 'en' ? enUS : locale === 'vn' ? viVN : koKR;
  const { setLoading, setAuth, logout } = useAuthStore();

  // Restore session on app load: refresh_token cookie → new accessToken
  useEffect(() => {
    async function restoreSession() {
      // Skip session restore if no stored user (logged out) or on login page
      if (window.location.pathname === '/login' || !useAuthStore.getState().user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Attempt silent refresh using httpOnly cookie (sent automatically by browser)
        const refreshRes = await refreshToken();
        if (refreshRes.success && refreshRes.data?.accessToken) {
          // Extract user info from new JWT claims (no separate /me API call needed)
          const me = jwtToMeResponse(refreshRes.data.accessToken);
          setAuth(refreshRes.data.accessToken, me);
          useMenuStore.getState().loadMenuForProject();
        } else {
          logout();
        }
      } catch {
        // refresh token expired, missing, or invalid → go to login
        logout();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  // Common codes + menu + labels: reload on locale change
  useEffect(() => {
    useComcdStore.getState().loadCodes();
    // 메뉴만 인증 필요 — 토큰 없이 호출하면 401 → 인터셉터가 silent refresh(/api/auth/refresh)까지
    // 시도하고 그것도 401로 끝난다. 로그인 화면에서 무의미한 왕복 2회가 발생하므로 가드한다.
    // (로그인 성공 시점과 restoreSession() 성공 시점에 각각 loadMenuForProject를 호출하므로
    //  이 가드로 인해 메뉴 로딩이 누락되지는 않는다.)
    if (useAuthStore.getState().accessToken) {
      useMenuStore.getState().loadMenuForProject();
    }
    useLabelStore.getState().loadLabels();
  }, [locale]);

  return (
    <ConfigProvider
      locale={antLocale}
      theme={{
        algorithm:
          mode === 'dark'
            ? antTheme.darkAlgorithm
            : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <GlobalLoadingBar />
        <ApiNotifyBridge />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/app/:tabKey?"
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
