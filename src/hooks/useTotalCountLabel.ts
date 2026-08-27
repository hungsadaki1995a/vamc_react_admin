import { useMemo } from 'react';
import { useLabelStore } from '@/stores/labelStore';
import { useLocaleStore } from '@/stores/localeStore';
import { formatLabel } from '@/lib/i18n/formatLabel';

/** 라벨 미등록 시 로케일별 폴백 — '건' 같은 수량 접미사는 언어마다 자리가 달라 문장을 통째로 둔다 */
const FALLBACK: Record<string, string> = {
  en: 'Total {0} items',
  vn: 'Tổng {0} mục',
  ko: '전체 {0}건',
};

/**
 * 건수 표시 문구 (`COMPONENT.VIEW.TEXT_gridTotal`).
 *
 * <p>그리드 툴바와 외부 페이지네이션 푸터가 같은 문구를 쓰므로 한 곳에서 만든다.
 * 템플릿을 그대로 노출하는 이유는 숫자만 굵게 그리려면 `{0}` 앞뒤로 잘라야 하기 때문이다.</p>
 */
export function useTotalCountLabel() {
  const t = useLabelStore((s) => s.t);
  const labelsVersion = useLabelStore((s) => s.labelsVersion);
  const locale = useLocaleStore((s) => s.locale);

  const template = useMemo(
    () => t('COMPONENT.VIEW.TEXT_gridTotal', FALLBACK[locale] ?? FALLBACK.ko),
    // labelsVersion: t는 안정 참조라 로케일 변경 시 이 값으로만 재계산을 유발(의도적 의존성).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, t, labelsVersion],
  );

  return {
    /** '전체 {0}건' 형태의 원본 템플릿 */
    template,
    /** 숫자를 끼운 완성 문자열 */
    format: (count: number) => formatLabel(template, count.toLocaleString()),
  };
}
