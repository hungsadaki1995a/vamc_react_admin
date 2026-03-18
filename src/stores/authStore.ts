import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo, MeResponse } from '@/lib/api/types';

interface AuthState {
  // In-memory only — NOT persisted (security)
  accessToken: string | null;
  // Refresh token is managed as httpOnly cookie by the browser — not stored in JS
  isAuthenticated: boolean;
  isLoading: boolean;

  // Persisted to localStorage
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

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      user: null,
      roles: [],

      // Actions

      // Set full auth state after login
      setAuth: (accessToken: string, me: MeResponse) => {
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

      // Silent Refresh: update accessToken only
      setAccessToken: (token: string) => {
        set({ accessToken: token, isAuthenticated: true });
      },

      logout: () => {
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
      // accessToken stays in memory only; refresh token is managed as httpOnly cookie
      partialize: (state) => ({
        user: state.user,
        roles: state.roles,
      }),
    },
  ),
);
