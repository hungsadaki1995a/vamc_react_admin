import { create } from 'zustand';
import { fetchBulkLabels } from '@/api/common/lbl';
import { idbGet, idbSet } from '@/lib/cache/idbCache';
import { useLocaleStore } from '@/stores/localeStore';

/**
 * 라벨 캐시 TTL: 5분. `comcdStore` 와 같은 정책이다.
 * TTL 안이면 캐시를 그대로 쓰고 네트워크를 타지 않으며, 지났으면 캐시를 먼저 보여준 뒤
 * 뒤에서 갱신한다(stale-while-revalidate).
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheKey(locale: string) {
  return `labels:${locale}`;
}

interface LabelStore {
  labels: Record<string, string>;
  labelsVersion: number;
  /**
   * GET /api/lbl/bulk — 현재 로케일(X-Lang) 기준 전체 라벨 로드. 실패 시 기존 라벨 유지.
   * @param force true면 캐시를 무시하고 서버에서 다시 받는다 (라벨 관리 화면에서 저장한 직후).
   */
  loadLabels: (force?: boolean) => Promise<void>;
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

    // 캐시 적중 — 즉시 반영하고, 신선하면 요청 자체를 생략한다.
    // 라벨은 전량 전송이라(화면 라벨이 붙으면 수천 건) 새로고침마다 다시 받으면 부담이 크다.
    const cached = force ? undefined : await idbGet<Record<string, string>>(key);
    if (cached) {
      apply(cached.data);
      if (Date.now() - cached.ts < CACHE_TTL_MS) return;
      // 오래된 캐시 — 화면은 그대로 두고 뒤에서 갱신
      fetchAndStore().catch(() => { /* 갱신 실패 시 기존 라벨 유지 */ });
      return;
    }

    try {
      await fetchAndStore();
    } catch {
      // 라벨 로드 실패 시 기존 라벨/키 폴백 유지 (치명적 아님)
    }
  },

  t: (key, defaultText) => get().labels[key] ?? defaultText ?? key,
  tmc: (code) => get().labels[`MESSAGE.CONFIRM.TEXT_${code}`] ?? `MESSAGE.CONFIRM.TEXT_${code}`,
  tmi: (code) => get().labels[`MESSAGE.INFO.TEXT_${code}`] ?? `MESSAGE.INFO.TEXT_${code}`,
  tme: (code) => get().labels[`MESSAGE.ERROR.TEXT_${code}`] ?? `MESSAGE.ERROR.TEXT_${code}`,
}));
