import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  homeMenuKey: string;
  setHomeMenuKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      homeMenuKey: 'dashboard',

      setHomeMenuKey: (key) => set({ homeMenuKey: key }),
    }),
    {
      name: 'pms-settings',
      partialize: (state) => ({
        homeMenuKey: state.homeMenuKey,
      }),
    }
  )
);
