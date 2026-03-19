import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd';
import koKR from 'antd/locale/ko_KR';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { useThemeStore } from '@/stores/themeStore';
import { useLocaleStore } from '@/stores/localeStore';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useMenuStore } from '@/stores/menuStore';
import { useLabelStore } from '@/stores/labelStore';
import { useComcdStore } from '@/stores/comcdStore';
import { refreshToken } from '@/features/auth/LoginPage/api';
import { getMe } from '@/api/user';
import { apiNotify } from '@/lib/api/apiNotify';
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
  const activeProjectId = useProjectStore((s) => s.activeProject?.id ?? '');

  const antLocale = locale === 'en' ? enUS : locale === 'vi' ? viVN : koKR;
  const { setLoading, setAccessToken, setAuth, logout } = useAuthStore();

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
        // Step 1: Refresh token (vamc: reads stored refreshToken from authStore)
        const refreshRes = await refreshToken();
        if (refreshRes.success && refreshRes.data?.accessToken) {
          setAccessToken(refreshRes.data.accessToken);

          // Step 2: Fetch user info — usrId comes from persisted authStore.user
          const storedUser = useAuthStore.getState().user;
          if (!storedUser?.usrId) {
            logout();
            return;
          }
          const meRes = await getMe(storedUser.usrId);
          if (meRes.success && meRes.data) {
            setAuth(refreshRes.data.accessToken, meRes.data);
            // Refresh project list on session restore, then reload menus
            // projId is sent via X-Project-Id header (axios interceptor reads from projectStore)
            useProjectStore.getState().fetchMyProjects().then(() => {
              useMenuStore.getState().loadMenuForProject();
            });
          }
        } else {
          logout();
        }
      } catch {
        // refresh_token expired or missing → go to login
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

  // Labels + common codes: load on app mount, reload on locale or project change
  // both endpoints are permitAll — work before login
  // projId/lclCd sent automatically via X-Project-Id / X-Lang headers (axios interceptor)
  useEffect(() => {
    useLabelStore.getState().loadLabels();
    useComcdStore.getState().loadCodes();
  }, [activeProjectId, locale]);

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
