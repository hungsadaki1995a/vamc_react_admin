import { useMemo } from 'react';
import { useMenuStore } from '@/stores/menuStore';
import { useLabelStore } from '@/stores/labelStore';
import { useLocaleStore } from '@/stores/localeStore';
import type { LocaleKey } from '@/stores/localeStore';
import { menuConfig, DEV_TOOLS_ENABLED } from '@/config/menuConfig';
import { DEV_MENU_LABELS } from '@/config/devMenuLabels';
import type { MenuItem } from '@/types/menu';

/**
 * 정적 메뉴(`menuConfig`)의 라벨을 라벨 테이블 값으로 바꾼다.
 *
 * <p>서버 메뉴는 `/api/common/menus/my` 가 이미 로케일에 맞는 `menuLblVal` 을 내려주지만,
 * 정적 메뉴는 코드에 한국어가 박혀 있어 언어를 바꿔도 그대로 남는다(탭 "대시보드" 등).
 * `labelKey` 가 있는 항목만 치환하고, 없으면 코드에 적힌 label 을 그대로 쓴다 —
 * 개발 도구 트리처럼 번역 대상이 아닌 메뉴는 labelKey 를 두지 않는다.</p>
 */
function localizeMenus(
  items: MenuItem[],
  t: (key: string, defaultText?: string) => string,
  locale: LocaleKey,
): MenuItem[] {
  return items.map((item) => ({
    ...item,
    label: resolveLabel(item, t, locale),
    children: item.children ? localizeMenus(item.children, t, locale) : undefined,
  }));
}

/**
 * 정적 메뉴 1건의 표시 이름.
 *
 * <p>두 경로가 있다. `labelKey` 가 있으면 DB 라벨(사용자가 보는 메뉴),
 * 없으면 개발 도구 사전(개발자만 보는 메뉴)을 본다. 둘 다 없으면 코드의 `label` 이다.</p>
 *
 * <p>개발 도구를 DB 로 관리하지 않는 이유는 `@/config/devMenuLabels` 주석에 있다.
 * 한국어는 사전에 없다 — `menuConfig` 의 `label` 이 정본이므로 그대로 폴백한다.</p>
 *
 * <p>🔴 사전 조회를 <b>`DEV_TOOLS_ENABLED` 안에</b> 둔다. 이 훅은 개발 도구와 무관하게
 * 항상 번들에 들어가므로, 가드가 없으면 플래그를 꺼도 사전이 그대로 실려 나간다
 * (운영 빌드에서 실제로 확인했다). 플래그가 빌드 시점 리터럴 `false` 라
 * 이 분기가 통째로 죽고 import 까지 함께 제거된다.</p>
 */
function resolveLabel(
  item: MenuItem,
  t: (key: string, defaultText?: string) => string,
  locale: LocaleKey,
): string {
  if (item.labelKey) return t(item.labelKey, item.label);
  if (DEV_TOOLS_ENABLED && locale !== 'ko') {
    return DEV_MENU_LABELS[item.key]?.[locale] ?? item.label;
  }
  return item.label;
}

/**
 * 서버 메뉴 + 정적 메뉴를 합친 전체 메뉴 트리 (정적 메뉴는 현재 로케일로 치환됨).
 *
 * <p>TabBar(탭 제목) · ContentHeader(브레드크럼) · FlyoutPanel(메뉴 트리)이
 * 같은 목록을 봐야 하므로 한 곳에서 만든다.</p>
 */
export function useAllMenus(): MenuItem[] {
  const serverMenus = useMenuStore((s) => s.serverMenus);
  // 라벨 맵 자체가 아니라 갱신 카운터를 구독한다 (O(1) 비교).
  const labelsVersion = useLabelStore((s) => s.labelsVersion);
  const t = useLabelStore((s) => s.t);
  // 개발 도구 사전은 DB 가 아니라 코드에 있어 로케일을 직접 봐야 한다.
  const locale = useLocaleStore((s) => s.locale);

  return useMemo(
    () => [...serverMenus, ...localizeMenus(menuConfig, t, locale)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverMenus, labelsVersion, locale],
  );
}
