import type { StateStorage } from 'zustand/middleware';

export type LocaleKey = 'en' | 'ko' | 'vn';

export const DEFAULT_LOCALE: LocaleKey = 'en';
export const SUPPORTED_LOCALES: readonly LocaleKey[] = ['en', 'ko', 'vn'] as const;

export const LOCALE_STORAGE_KEY = 'vamc-locale';
export const LOCALE_COOKIE_KEY = 'vamc-locale';

export interface LocaleOption {
  value: LocaleKey;
  label: string;
  shortLabel: string;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { value: 'en', label: 'English', shortLabel: 'Eng' },
  { value: 'ko', label: '한국어', shortLabel: 'Kor' },
  { value: 'vn', label: 'Tiếng Việt', shortLabel: 'Vie' },
];

/**
 * Returns 3-letter TitleCase label matching the header mockup ('Eng' | 'Kor' | 'Vie').
 */
export function getLocaleShortLabel(locale: LocaleKey): string {
  if (locale === 'ko') return 'Kor';
  if (locale === 'vn') return 'Vie';
  return 'Eng';
}

/**
 * Normalizes any language code or alias (e.g. 'vi', 'vi-VN', 'ko-KR', 'en-US')
 * into the supported LocaleKey ('en' | 'ko' | 'vn'). Defaults to 'en'.
 */
export function normalizeLocale(locale: unknown): LocaleKey {
  if (typeof locale !== 'string') return DEFAULT_LOCALE;
  const lower = locale.trim().toLowerCase();
  if (lower === 'ko' || lower.startsWith('ko-') || lower === 'kr') return 'ko';
  if (lower === 'vn' || lower === 'vi' || lower.startsWith('vi-')) return 'vn';
  if (lower === 'en' || lower.startsWith('en-')) return 'en';
  return DEFAULT_LOCALE;
}

/**
 * Maps frontend LocaleKey to standard ISO BCP-47 language tag (e.g. 'vn' -> 'vi').
 */
export function toIsoLangTag(locale: LocaleKey): string {
  if (locale === 'vn') return 'vi';
  return locale;
}

/**
 * Safely reads a cookie by name.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Safely writes a cookie with long-lived expiration (1 year default) and SameSite=Lax.
 */
export function setCookie(name: string, value: string, maxAgeSeconds: number = 365 * 24 * 60 * 60): void {
  if (typeof document === 'undefined') return;
  try {
    let cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${Math.max(0, maxAgeSeconds)}; SameSite=Lax`;
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      cookie += '; Secure';
    }
    document.cookie = cookie;
  } catch {
    // Ignore in restricted environments
  }
}

/**
 * Deletes a cookie.
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    // Ignore
  }
}

/**
 * Synchronizes HTML document attributes and cookie for the given locale.
 */
export function syncSystemLocale(locale: LocaleKey): void {
  const normalized = normalizeLocale(locale);

  // 1. Sync cookie (valid for 1 year)
  setCookie(LOCALE_COOKIE_KEY, normalized);

  // 2. Sync documentElement lang attribute
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('lang', toIsoLangTag(normalized));
  }
}

/**
 * Reads initial locale from storage with prioritized fallback:
 * 1. LocalStorage (`vamc-locale`)
 * 2. Cookie (`vamc-locale`)
 * 3. Default (`en`)
 */
export function getInitialLocale(): LocaleKey {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  // 1. Try LocalStorage
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.locale) {
          return normalizeLocale(parsed.state.locale);
        }
      } catch {
        return normalizeLocale(raw);
      }
    }
  } catch {
    // Storage access may fail in private mode
  }

  // 2. Try Cookie
  const cookieVal = getCookie(LOCALE_COOKIE_KEY);
  if (cookieVal) {
    return normalizeLocale(cookieVal);
  }

  // 3. Fallback to default English
  return DEFAULT_LOCALE;
}

/**
 * Dual-Storage engine for Zustand persist:
 * - Reads from LocalStorage, falls back to Cookie.
 * - Writes to both LocalStorage and Cookie simultaneously.
 * - Guarantees synchronization on accessing or reloading the page.
 */
export const dualLocaleStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;

    // 1. Try localStorage
    try {
      const item = localStorage.getItem(name);
      if (item) {
        return item;
      }
    } catch {
      // ignore
    }

    // 2. Try cookie fallback
    const fromCookie = getCookie(name);
    if (fromCookie) {
      const normalized = normalizeLocale(fromCookie);
      return JSON.stringify({ state: { locale: normalized }, version: 1 });
    }

    return null;
  },

  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;

    // 1. Write to localStorage
    try {
      localStorage.setItem(name, value);
    } catch {
      // ignore
    }

    // 2. Sync to cookie
    try {
      const parsed = JSON.parse(value);
      const rawLocale = parsed?.state?.locale;
      if (rawLocale) {
        syncSystemLocale(normalizeLocale(rawLocale));
      }
    } catch {
      // ignore
    }
  },

  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
    deleteCookie(name);
  },
};
