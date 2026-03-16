import { create } from 'zustand';
import { fetchBulkLabels } from '@/api/lbl';
import { idbGet, idbSet } from '@/lib/cache/idbCache';
import { useProjectStore } from '@/stores/projectStore';
import { useLocaleStore } from '@/stores/localeStore';

/** Cache TTL: 5 minutes. Within TTL, skip background revalidation to avoid extra XHR. */
const CACHE_TTL_MS = 5 * 60 * 1000;

interface LabelStore {
  labels: Record<string, string>;
  /** Increments each time labels are updated — lightweight subscription signal. */
  labelsVersion: number;
  loading: boolean;
  /**
   * Load labels with TTL-based IndexedDB cache.
   * - Cache hit (fresh < 5min): serve immediately, no network request.
   * - Cache hit (stale ≥ 5min): serve immediately + background revalidation.
   * - Cache miss: fetch from server, persist to IDB.
   */
  loadLabels: () => Promise<void>;
  /** Translate a label key. Returns the key itself if not found. */
  t: (key: string) => string;
}

export const useLabelStore = create<LabelStore>()((set, get) => ({
  labels: {},
  labelsVersion: 0,
  loading: false,

  loadLabels: async () => {
    const projectId = useProjectStore.getState().activeProject?.id ?? '_';
    const locale = useLocaleStore.getState().locale;
    const cacheKey = `labels:${projectId}:${locale}`;

    const cached = await idbGet<Record<string, string>>(cacheKey);
    if (cached) {
      set((s) => ({ labels: cached.data, labelsVersion: s.labelsVersion + 1, loading: false }));
      const isFresh = Date.now() - cached.ts < CACHE_TTL_MS;
      if (isFresh) return; // no network request within TTL
      // Stale cache: background revalidation (one additional XHR, but not during initial render)
      fetchBulkLabels()
        .then((fresh) => {
          set((s) => ({ labels: fresh, labelsVersion: s.labelsVersion + 1 }));
          idbSet(cacheKey, fresh);
        })
        .catch(() => { /* keep stale data on error */ });
      return;
    }

    set({ loading: true });
    try {
      const labels = await fetchBulkLabels();
      set((s) => ({ labels, labelsVersion: s.labelsVersion + 1, loading: false }));
      idbSet(cacheKey, labels);
    } catch {
      set({ loading: false });
    }
  },

  t: (key) => get().labels[key] ?? key,
}));
