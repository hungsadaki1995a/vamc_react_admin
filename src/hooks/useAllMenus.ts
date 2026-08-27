import { useMemo } from 'react';
import { useMenuStore } from '@/stores/menuStore';
import { useLabelStore } from '@/stores/labelStore';
import { menuConfig } from '@/config/menuConfig';
import type { MenuItem } from '@/types/menu';

/**
 * 정적 메뉴(`menuConfig`)의 라벨을 라벨 테이블 값으로 바꾼다.
 *
 * <p>서버 메뉴는 `/api/common/menus/my` 가 이미 로케일에 맞는 `menuLblVal` 을 내려주지만,
 * 정적 메뉴는 코드에 한국어가 박혀 있어 언어를 바꿔도 그대로 남는다(탭 "대시보드" 등).
 * `labelKey` 가 있는 항목만 치환하고, 없으면 코드에 적힌 label 을 그대로 쓴다 —
 * 개발 도구 트리처럼 번역 대상이 아닌 메뉴는 labelKey 를 두지 않는다.</p>
 */
function localizeMenus(items: MenuItem[], t: (key: string, defaultText?: string) => string): MenuItem[] {
  return items.map((item) => ({
    ...item,
    label: item.labelKey ? t(item.labelKey, item.label) : item.label,
    children: item.children ? localizeMenus(item.children, t) : undefined,
  }));
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

  return useMemo(
    () => [...serverMenus, ...localizeMenus(menuConfig, t)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverMenus, labelsVersion],
  );
}
