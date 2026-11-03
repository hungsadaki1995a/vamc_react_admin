import { useLocaleStore, type LocaleKey } from '@/stores/localeStore';

export interface LocaleText {
  ko: string;
  en: string;
  vn: string;
}

export function getLocaleText(locale: LocaleKey, text: LocaleText): string {
  if (locale === 'en') return text.en || text.ko || text.vn;
  if (locale === 'vn') return text.vn || text.en || text.ko;
  return text.ko || text.en || text.vn;
}

export function getCurrentLocaleText(text: LocaleText): string {
  return getLocaleText(useLocaleStore.getState().locale, text);
}
