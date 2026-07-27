import { create } from 'zustand';

interface LabelStore {
  labels: Record<string, string>;
  labelsVersion: number;
  /** No-op — label API not used in this project. t() returns key as fallback. */
  loadLabels: () => Promise<void>;
  /** Translate a label key. Falls back to defaultText, then the key itself. */
  t: (key: string, defaultText?: string) => string;
  /** Global confirm message: MESSAGE.CONFIRM.TEXT_{code} */
  tmc: (code: string) => string;
  /** Global info message: MESSAGE.INFO.TEXT_{code} */
  tmi: (code: string) => string;
  /** Global error message: MESSAGE.ERROR.TEXT_{code} */
  tme: (code: string) => string;
}

export const useLabelStore = create<LabelStore>()((_set, get) => ({
  labels: {},
  labelsVersion: 0,

  loadLabels: async () => { /* label API not available */ },

  t: (key, defaultText) => get().labels[key] ?? defaultText ?? key,
  tmc: (code) => get().labels[`MESSAGE.CONFIRM.TEXT_${code}`] ?? `MESSAGE.CONFIRM.TEXT_${code}`,
  tmi: (code) => get().labels[`MESSAGE.INFO.TEXT_${code}`] ?? `MESSAGE.INFO.TEXT_${code}`,
  tme: (code) => get().labels[`MESSAGE.ERROR.TEXT_${code}`] ?? `MESSAGE.ERROR.TEXT_${code}`,
}));
