import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type LocaleKey,
  DEFAULT_LOCALE,
  dualLocaleStorage,
  normalizeLocale,
  syncSystemLocale,
} from '@/utils/localeStorage';

export type { LocaleKey };

interface LocaleStore {
  locale: LocaleKey;
  setLocale: (locale: LocaleKey) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => {
        const normalized = normalizeLocale(locale);
        syncSystemLocale(normalized);
        set({ locale: normalized });
      },
    }),
    {
      name: 'vamc-locale',
      version: 1,
      storage: createJSONStorage(() => dualLocaleStorage),
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          // Version 0 was the legacy configuration where 'ko' was hardcoded as default.
          // Reset to requested default 'en'.
          return { locale: DEFAULT_LOCALE };
        }
        const state = persistedState as { locale?: unknown };
        return {
          locale: state?.locale ? normalizeLocale(state.locale) : DEFAULT_LOCALE,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state?.locale) {
          syncSystemLocale(state.locale);
        }
      },
    }
  )
);
