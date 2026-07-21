import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LocaleKey = 'ko' | 'en' | 'vn';

interface LocaleStore {
  locale: LocaleKey;
  setLocale: (locale: LocaleKey) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: 'ko',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'vamc-locale' }
  )
);
