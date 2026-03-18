import { create } from 'zustand';

interface LabelStore {
  labels: Record<string, string>;
  labelsVersion: number;
  /** No-op — label API not used in this project. t() returns key as fallback. */
  loadLabels: () => Promise<void>;
  /** Translate a label key. Returns the key itself if not found. */
  t: (key: string) => string;
}

export const useLabelStore = create<LabelStore>()((_set, get) => ({
  labels: {},
  labelsVersion: 0,

  loadLabels: async () => { /* label API not available */ },

  t: (key) => get().labels[key] ?? key,
}));
