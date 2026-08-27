import type { LocaleKey } from '@/stores/localeStore';
import { AG_GRID_LOCALE_KO } from './agGridLocaleKo';
import { AG_GRID_LOCALE_VI } from './agGridLocaleVi';

/**
 * 로케일별 AG Grid 내장 문구(localeText) 선택.
 *
 * <p>AG Grid 의 기본 언어가 영어라서 `en` 은 `undefined` 를 돌려준다 —
 * 빈 객체를 넘기면 되레 키가 그대로 노출된다.</p>
 *
 * <p>이 문구들은 라벨 테이블(LANG_LBL)이 아니라 번들 상수다. 그리드 내부 문구는
 * 수백 개인 데다 화면 라벨처럼 운영자가 바꿀 대상이 아니라서, DB 왕복 없이 즉시
 * 전환되는 쪽이 낫다. 화면 텍스트는 `useScreenLabel` 로 DB 라벨을 쓴다.</p>
 */
export function getAgGridLocale(locale: LocaleKey): Record<string, string> | undefined {
  if (locale === 'ko') return AG_GRID_LOCALE_KO;
  if (locale === 'vn') return AG_GRID_LOCALE_VI;
  return undefined; // en — AG Grid 내장 영어
}
