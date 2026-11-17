import { useEffect } from 'react';
import { refreshToken } from '@/api/common/authApi';
import { useAuthStore } from '@/stores/authStore';
import { useMenuStore } from '@/stores/menuStore';
import { isTokenExpired, jwtToMeResponse } from '@/utils/jwtUtils';
import { getAccessToken } from '@/utils/tokenStorage';

/** Restores the user session on app mount using the stored or refreshed access token. */
export function useRestoreSession() {
  const { setLoading, setAuth, logout } = useAuthStore();

  useEffect(() => {
    async function restoreSession() {
      // Skip session restore on public auth pages
      if (window.location.pathname === '/login' || window.location.pathname === '/find-id') {
        setLoading(false);
        return;
      }

      const token = useAuthStore.getState().accessToken || getAccessToken();
      if (!token) {
        logout();
        setLoading(false);
        return;
      }

      if (!isTokenExpired(token)) {
        const currentUser = useAuthStore.getState().user;
        const me = jwtToMeResponse(token);
        setAuth(token, {
          ...me,
          usrNm: currentUser?.usrNm || me.usrNm,
          email: currentUser?.email || me.email,
          phnNo: currentUser?.phnNo || me.phnNo,
        });
        setLoading(false);
        useMenuStore.getState().loadMenuForProject();
        return;
      }

      // Access token is expired — attempt silent refresh
      setLoading(true);
      try {
        const refreshRes = await refreshToken();
        if (refreshRes.success && refreshRes.data?.accessToken && !isTokenExpired(refreshRes.data.accessToken)) {
          const newToken = refreshRes.data.accessToken;
          setAuth(newToken, jwtToMeResponse(newToken));
          useMenuStore.getState().loadMenuForProject();
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
