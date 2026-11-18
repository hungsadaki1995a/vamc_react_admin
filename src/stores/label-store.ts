import { create } from 'zustand';
import { fetchBulkLabels } from '@/api/common/label-bulk-api';
import { idbGet, idbSet } from '@/lib/cache/idb-cache';
import { useLocaleStore } from '@/stores/locale-store';

/**
 * Label cache TTL: 5 minutes. Same policy as `comcdStore`.
 * Within TTL, use cache directly without network calls; once expired, serve cached labels first
 * and refresh in the background (stale-while-revalidate).
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheKey(locale: string) {
  return `labels:${locale}`;
}

interface LabelStore {
  labels: Record<string, string>;
  labelsVersion: number;
  /**
   * GET /api/lbl/bulk — load all labels for current locale (X-Lang). Preserves existing labels on failure.
   * @param force If true, bypass cache and re-fetch from server (right after saving in label management screen).
   */
  loadLabels: (force?: boolean) => Promise<void>;
  /**
   * Invalidate label cache — re-fetch the app-wide label map right after editing labels.
   *
   * Same behavior as `loadLabels(true)`, named to match `menuStore.invalidateMenuCache()`.
   * Screen code should treat both global caches with the same vocabulary so the intent is clear —
   * `loadLabels(true)` requires inspecting the argument to tell.
   */
  invalidateLabelCache: () => Promise<void>;
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

  loadLabels: async (force = false) => {
    const locale = useLocaleStore.getState().locale;
    const key = cacheKey(locale);

    const apply = (labels: Record<string, string>) => {
      if (Object.keys(labels).length === 0) return;
      set((s) => ({ labels, labelsVersion: s.labelsVersion + 1 }));
    };

    const fetchAndStore = async () => {
      const labels = await fetchBulkLabels();
      if (Object.keys(labels).length > 0) {
        apply(labels);
        idbSet(key, labels);
      }
    };

    // Cache hit — apply immediately, and skip request if fresh.
    // Labels are fetched in bulk (thousands of rows once screen labels are added), so re-fetching on every refresh is costly.
    const cached = force ? undefined : await idbGet<Record<string, string>>(key);
    if (cached) {
      apply(cached.data);
      if (Date.now() - cached.ts < CACHE_TTL_MS) return;
      // Stale cache — keep UI as-is and refresh in background
      fetchAndStore().catch(() => { /* 갱신 실패 시 기존 라벨 유지 */ });
      return;
    }

    try {
      await fetchAndStore();
    } catch {
      // 라벨 로드 실패 시 기존 라벨/키 폴백 유지 (치명적 아님)
    }
  },

  invalidateLabelCache: () => get().loadLabels(true),

  t: (key, defaultText) => get().labels[key] ?? defaultText ?? key,
  tmc: (code) => get().labels[`MESSAGE.CONFIRM.TEXT_${code}`] ?? `MESSAGE.CONFIRM.TEXT_${code}`,
  tmi: (code) => get().labels[`MESSAGE.INFO.TEXT_${code}`] ?? `MESSAGE.INFO.TEXT_${code}`,
  tme: (code) => get().labels[`MESSAGE.ERROR.TEXT_${code}`] ?? `MESSAGE.ERROR.TEXT_${code}`,
}));
