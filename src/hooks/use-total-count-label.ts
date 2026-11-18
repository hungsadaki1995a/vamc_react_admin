import { useMemo } from 'react';
import { useLabelStore } from '@/stores/label-store';
import { useLocaleStore } from '@/stores/locale-store';
import { formatLabel } from '@/lib/i18n/format-label';

/** Per-locale fallback when label is unregistered — quantity suffixes vary in position by language, so store full templates */
const FALLBACK: Record<string, string> = {
  en: 'Total {0} items',
  vn: 'Tổng {0} mục',
  ko: '전체 {0}건',
};

/**
 * Total count display string (`COMPONENT.VIEW.TEXT_gridTotal`).
 *
 * <p>Built in one place because GridToolbar and external pagination footer use the same text.
 * Exposes the raw template so callers can split around `{0}` to bold only the number.</p>
 */
export function useTotalCountLabel() {
  const t = useLabelStore((s) => s.t);
  const labelsVersion = useLabelStore((s) => s.labelsVersion);
  const locale = useLocaleStore((s) => s.locale);

  const template = useMemo(
    () => t('COMPONENT.VIEW.TEXT_gridTotal', FALLBACK[locale] ?? FALLBACK.ko),
    // labelsVersion: t is a stable reference, so this intentionally triggers recalculation on locale change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, t, labelsVersion],
  );

  return {
    /** Raw template in 'Total {0} items' form */
    template,
    /** Formatted string with number interpolated */
    format: (count: number) => formatLabel(template, count.toLocaleString()),
  };
}
