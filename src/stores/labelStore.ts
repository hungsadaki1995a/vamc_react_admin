import { create } from 'zustand';
import { fetchBulkLabels } from '@/api/lbl';

interface LabelStore {
  labels: Record<string, string>;
  labelsVersion: number;
  /** GET /api/lbl/bulk — 현재 로케일(X-Lang) 기준 전체 라벨 로드. 실패 시 기존 라벨 유지 */
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

export const useLabelStore = create<LabelStore>()((set, get) => ({
  labels: {},
  labelsVersion: 0,

  loadLabels: async () => {
    try {
      const labels = await fetchBulkLabels();
      if (Object.keys(labels).length > 0) {
        set((s) => ({ labels, labelsVersion: s.labelsVersion + 1 }));
      }
    } catch {
      // 라벨 로드 실패 시 기존 라벨/키 폴백 유지 (치명적 아님)
    }
  },

  t: (key, defaultText) => get().labels[key] ?? defaultText ?? key,
  tmc: (code) => get().labels[`MESSAGE.CONFIRM.TEXT_${code}`] ?? `MESSAGE.CONFIRM.TEXT_${code}`,
  tmi: (code) => get().labels[`MESSAGE.INFO.TEXT_${code}`] ?? `MESSAGE.INFO.TEXT_${code}`,
  tme: (code) => get().labels[`MESSAGE.ERROR.TEXT_${code}`] ?? `MESSAGE.ERROR.TEXT_${code}`,
}));
