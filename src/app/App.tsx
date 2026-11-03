import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd';
import koKR from 'antd/locale/ko_KR';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import { useThemeStore } from '@/stores/themeStore';
import { useLocaleStore } from '@/stores/localeStore';
import { toIsoLangTag } from '@/utils/localeStorage';
import { useAuthStore } from '@/stores/authStore';
import { useMenuStore } from '@/stores/menuStore';
import { useComcdStore } from '@/stores/comcdStore';
import { useLabelStore } from '@/stores/labelStore';
import { refreshToken } from '@/api/common/authApi';
import { apiNotify } from '@/lib/api/apiNotify';
import { jwtToMeResponse, isTokenExpired } from '@/utils/jwtUtils';
import { getAccessToken } from '@/utils/tokenStorage';
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

  // Restore session on app load: verify token expiration → keep on current page
  useEffect(() => {
    async function restoreSession() {
      // Skip session restore if explicitly on login page
      if (window.location.pathname === '/login') {
        setLoading(false);
        return;
      }

      const token = useAuthStore.getState().accessToken || getAccessToken();

      // No token found → user is not logged in
      if (!token) {
        logout();
        setLoading(false);
        return;
      }

      // Check if token is still valid
      if (!isTokenExpired(token)) {
        // Token is NOT expired! Keep user authenticated on current page
        const currentUser = useAuthStore.getState().user;
        const me = jwtToMeResponse(token);
        setAuth(token, {
          ...me,
          usrNm: currentUser?.usrNm || me.usrNm,
          email: currentUser?.email || me.email,
          phnNo: currentUser?.phnNo || me.phnNo,
        });
        setLoading(false);

        // Load project menus
        useMenuStore.getState().loadMenuForProject();
        return;
      }

      // Token IS expired → attempt silent refresh
      setLoading(true);
      try {
        const refreshRes = await refreshToken();
        if (refreshRes.success && refreshRes.data?.accessToken && !isTokenExpired(refreshRes.data.accessToken)) {
          const newToken = refreshRes.data.accessToken;
          const me = jwtToMeResponse(newToken);
          setAuth(newToken, me);
          useMenuStore.getState().loadMenuForProject();
        } else {
          logout();
        }
      } catch {
        // Refresh token expired, missing, or invalid → go to login
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

  // Synchronize HTML lang attribute & Dayjs locale on locale change
  useEffect(() => {
    const isoTag = toIsoLangTag(locale);
    dayjs.locale(isoTag);
    document.documentElement.setAttribute('lang', isoTag);
  }, [locale]);

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
              path="/members"
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            />
            <Route
              path="/app/:tabKey?"
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            />
            <Route path="/app/member.list" element={<Navigate to="/members" replace />} />
            <Route path="/app/members" element={<Navigate to="/members" replace />} />
            <Route path="/member" element={<Navigate to="/members" replace />} />
            <Route path="/member/list" element={<Navigate to="/members" replace />} />
            <Route path="/member-management" element={<Navigate to="/members" replace />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
