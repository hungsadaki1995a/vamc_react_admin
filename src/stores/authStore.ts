import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo, MeResponse } from '@/lib/api/types';

interface AuthState {
  // In-memory only — NOT persisted (security)
  accessToken: string | null;
  // Refresh token is now stored as httpOnly cookie (managed by browser, not JS)
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Persisted to localStorage
  user: UserInfo | null;
  roles: string[];
}

interface AuthActions {
  setAuth: (accessToken: string, me: MeResponse, refreshToken?: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hasRole: (role: string) => boolean;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      user: null,
      roles: [],

      // Actions

      // Set full auth state after login + getMe
      setAuth: (accessToken: string, me: MeResponse, refreshToken?: string) => {
        set({
          accessToken,
          ...(refreshToken !== undefined ? { refreshToken } : {}),
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

      // Silent Refresh: update accessToken only
      setAccessToken: (token: string) => {
        set({ accessToken: token, isAuthenticated: true });
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
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
      name: 'pms-auth',
      // Only persist user info — accessToken stays in memory
      partialize: (state) => ({
        user: state.user,
        roles: state.roles,
      }),
    },
  ),
);
