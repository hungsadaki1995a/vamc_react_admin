import { useLocaleStore, type LocaleKey } from '@/stores/localeStore';

export interface LocaleText {
  ko: string;
  en: string;
  vn: string;
}

export function getLocaleText(locale: LocaleKey, text: LocaleText): string {
  if (locale === 'en') return text.en;
  if (locale === 'vn') return text.vn;
  return text.ko;
}

export function getCurrentLocaleText(text: LocaleText): string {
  return getLocaleText(useLocaleStore.getState().locale, text);
}
