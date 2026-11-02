import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo, MeResponse } from '@/lib/api/types';
import {
  getAccessToken,
  setAccessToken as setStoredToken,
  clearTokens,
} from '@/utils/tokenStorage';
import { isTokenExpired, jwtToMeResponse } from '@/utils/jwtUtils';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  user: UserInfo | null;
  roles: string[];
}

interface AuthActions {
  setAuth: (accessToken: string, me: MeResponse) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hasRole: (role: string) => boolean;
}

type AuthStore = AuthState & AuthActions;

// Synchronously inspect stored token on module evaluation so the first render is authenticated
function getInitialAuthState() {
  const token = getAccessToken();
  if (token && !isTokenExpired(token)) {
    const me = jwtToMeResponse(token);
    return {
      accessToken: token,
      isAuthenticated: true,
      isLoading: false,
      user: {
        usrId: me.usrId,
        usrNm: me.usrNm,
      },
      roles: me.roles,
    };
  }
  return {
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    user: null,
    roles: [],
  };
}

const initialAuth = getInitialAuthState();

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      accessToken: initialAuth.accessToken,
      isAuthenticated: initialAuth.isAuthenticated,
      isLoading: initialAuth.isLoading,
      user: initialAuth.user,
      roles: initialAuth.roles,

      // Actions

      // Set full auth state after login or session restore
      setAuth: (accessToken: string, me: MeResponse) => {
        setStoredToken(accessToken);
        set({
          accessToken,
          isAuthenticated: true,
          isLoading: false,
          user: {
            usrId: me.usrId,
            usrNm: me.usrNm,
            email: me.email,
            dpCd: me.dpCd,
            usrCCd: me.usrCCd,
            phnNo: me.phnNo,
          },
          roles: me.roles,
        });
      },

      // Update accessToken only (e.g. silent refresh)
      setAccessToken: (token: string) => {
        setStoredToken(token);
        set({ accessToken: token, isAuthenticated: true });
      },

      logout: () => {
        clearTokens();
        set({
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          user: null,
          roles: [],
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      hasRole: (role: string) => {
        return get().roles.includes(role);
      },
    }),
    {
      name: 'vamc-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        user: state.user
          ? {
              usrId: state.user.usrId,
              usrNm: state.user.usrNm,
              email: state.user.email,
              dpCd: state.user.dpCd,
              usrCCd: state.user.usrCCd,
              phnNo: state.user.phnNo,
            }
          : null,
        roles: state.roles,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const token = state.accessToken || getAccessToken();
        if (token && !isTokenExpired(token)) {
          state.accessToken = token;
          state.isAuthenticated = true;
          state.isLoading = false;
          if (!state.user) {
            const me = jwtToMeResponse(token);
            state.user = { usrId: me.usrId, usrNm: me.usrNm };
            state.roles = me.roles;
          }
        } else {
          state.accessToken = null;
          state.isAuthenticated = false;
          state.isLoading = false;
        }
      },
    },
  ),
);
