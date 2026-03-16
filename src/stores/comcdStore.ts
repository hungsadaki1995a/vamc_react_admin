import { create } from 'zustand';
import { getAllCodeList, type CodeDetail } from '@/api/common';
import { idbGet, idbSet } from '@/lib/cache/idbCache';
import { useProjectStore } from '@/stores/projectStore';
import { useLocaleStore } from '@/stores/localeStore';

/** Cache TTL: 5 minutes. Within TTL, skip background revalidation to avoid extra XHR. */
const CACHE_TTL_MS = 5 * 60 * 1000;

interface SelectOption {
  label: string;
  value: string;
}

interface ComcdStore {
  codes: Record<string, CodeDetail[]>;
  loading: boolean;
  /**
   * Load all codes with TTL-based IndexedDB cache.
   * - Cache hit (fresh < 5min): serve immediately, no network request.
   * - Cache hit (stale ≥ 5min): serve immediately + background revalidation.
   * - Cache miss: fetch from server, group by cdDmnId, persist to IDB.
   */
  loadCodes: () => Promise<void>;
  getOptions: (cdDmnId: string) => SelectOption[];
  getCodeName: (cdDmnId: string, cd: string) => string;
}

function groupByMain(list: CodeDetail[]): Record<string, CodeDetail[]> {
  const grouped: Record<string, CodeDetail[]> = {};
  for (const item of list) {
    if (!grouped[item.cdDmnId]) grouped[item.cdDmnId] = [];
    grouped[item.cdDmnId].push(item);
  }
  return grouped;
}

export const useComcdStore = create<ComcdStore>()((set, get) => ({
  codes: {},
  loading: false,

  loadCodes: async () => {
    const projectId = useProjectStore.getState().activeProject?.id ?? '_';
    const locale = useLocaleStore.getState().locale;
    const cacheKey = `codes:${projectId}:${locale}`;

    const cached = await idbGet<Record<string, CodeDetail[]>>(cacheKey);
    if (cached) {
      set({ codes: cached.data, loading: false });
      const isFresh = Date.now() - cached.ts < CACHE_TTL_MS;
      if (isFresh) return;
      getAllCodeList()
        .then((list) => {
          const fresh = groupByMain(list);
          set({ codes: fresh });
          idbSet(cacheKey, fresh);
        })
        .catch(() => { /* keep stale data on error */ });
      return;
    }

    set({ loading: true });
    try {
      const list = await getAllCodeList();
      const grouped = groupByMain(list);
      set({ codes: grouped, loading: false });
      idbSet(cacheKey, grouped);
    } catch {
      set({ loading: false });
    }
  },

  getOptions: (cdDmnId) =>
    (get().codes[cdDmnId] ?? []).map((c) => ({ label: c.cdNm, value: c.cd })),

  getCodeName: (cdDmnId, cd) =>
    get().codes[cdDmnId]?.find((c) => c.cd === cd)?.cdNm ?? cd,
}));
