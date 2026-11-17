import { useEffect } from 'react';
import koKR from 'antd/locale/ko_KR';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import { useThemeStore } from '@/stores/theme-store';
import { useLocaleStore } from '@/stores/locale-store';
import { useAuthStore } from '@/stores/auth-store';
import { useComcdStore } from '@/stores/comcd-store';
import { useMenuStore } from '@/stores/menu-store';
import { useLabelStore } from '@/stores/label-store';
import { toIsoLangTag } from '@/utils/locale-storage';

/** Syncs theme, Dayjs/HTML locale, and locale-dependent stores (common codes, menus, labels). */
export function useAppSync() {
  const mode = useThemeStore((s) => s.mode);
  const locale = useLocaleStore((s) => s.locale);
  const antLocale = locale === 'en' ? enUS : locale === 'vn' ? viVN : koKR;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  useEffect(() => {
    const isoTag = toIsoLangTag(locale);
    dayjs.locale(isoTag);
    document.documentElement.setAttribute('lang', isoTag);
  }, [locale]);

  useEffect(() => {
    useComcdStore.getState().loadCodes();
    // Only menus require authentication — calling without a token triggers a 401 and an
    // unnecessary silent refresh (/api/auth/refresh) that also fails with 401 on the login page.
    // Safe to guard here because loadMenuForProject is already called on login and restoreSession.
    if (useAuthStore.getState().accessToken) {
      useMenuStore.getState().loadMenuForProject();
    }
    useLabelStore.getState().loadLabels();
  }, [locale]);

  return { mode, antLocale };
}
