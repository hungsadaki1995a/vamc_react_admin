import { useEffect } from 'react';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import { useLocaleStore } from '@/stores/locale-store';
import { useAuthStore } from '@/stores/auth-store';
import { useComcdStore } from '@/stores/common-code-store';
import { useMenuStore } from '@/stores/menu-store';
import { toIsoLangTag } from '@/utils/locale-storage';
import i18n from '@/lib/i18n';

/** Syncs Dayjs/HTML locale and locale-dependent stores (common codes, menus). */
export function useAppSync() {
  const locale = useLocaleStore((s) => s.locale);
  const antLocale = locale === 'vn' ? viVN : enUS;

  useEffect(() => {
    const isoTag = toIsoLangTag(locale);
    dayjs.locale(isoTag);
    document.documentElement.setAttribute('lang', isoTag);
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  useEffect(() => {
    useComcdStore.getState().loadCodes();
    // Only menus require authentication — calling without a token triggers a 401 and an
    // unnecessary silent refresh (/api/auth/refresh) that also fails with 401 on the login page.
    // Safe to guard here because loadMenuForProject is already called on login and restoreSession.
    if (useAuthStore.getState().accessToken) {
      useMenuStore.getState().loadMenuForProject();
    }
  }, [locale]);

  return { antLocale };
}
