import { create } from 'zustand';
import { mockLoadLabels } from '@/mock/services/labelService';

interface LabelStore {
  labels: Record<string, string>;
  labelsVersion: number;
  loading: boolean;
  loadLabels: () => Promise<void>;
  t: (key: string) => string;
}

export const useLabelStore = create<LabelStore>()((set, get) => ({
  labels: {},
  labelsVersion: 0,
  loading: false,

  loadLabels: async () => {
    const labels = await mockLoadLabels();
    set((s) => ({ labels, labelsVersion: s.labelsVersion + 1 }));
  },

  t: (key) => get().labels[key] ?? key,
}));
