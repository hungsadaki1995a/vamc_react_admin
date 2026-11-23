import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getInitialLocale } from '@/utils/locale-storage';
import en from './locales/en.json';
import vn from './locales/vn.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vn: { translation: vn },
  },
  lng: getInitialLocale(),
  // Missing keys fall back to Vietnamese, then English
  fallbackLng: ['vn', 'en'],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
