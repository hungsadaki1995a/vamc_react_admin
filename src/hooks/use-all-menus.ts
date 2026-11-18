import { useMemo } from 'react';
import { useMenuStore } from '@/stores/menu-store';
import { useLabelStore } from '@/stores/label-store';
import { menuConfig } from '@/config/menu-config';
import type { MenuItem } from '@/types/menu';

/**
 * Replaces static menu (`menuConfig`) labels with values from the label table.
 *
 * <p>Server menus from `/api/common/menus/my` already return localized `menuLblVal`,
 * whereas static menus have Korean hardcoded and would stay Korean on language switch (e.g. "Dashboard" tab).
 * Replaces only items with `labelKey`, and uses the hardcoded `label` as-is when absent.</p>
 */
function localizeMenus(
  items: MenuItem[],
  t: (key: string, defaultText?: string) => string,
): MenuItem[] {
  return items.map((item) => ({
    ...item,
    label: item.labelKey ? t(item.labelKey, item.label) : item.label,
    children: item.children ? localizeMenus(item.children, t) : undefined,
  }));
}

/**
 * Combined full menu tree of server menus + static menus (static menus localized to current locale).
 *
 * <p>TabBar (tab title), ContentHeader (breadcrumb), and FlyoutPanel (menu tree) must
 * see the same list, so it is built in one place.</p>
 */
export function useAllMenus(): MenuItem[] {
  const serverMenus = useMenuStore((s) => s.serverMenus);
  // Subscribe to the update counter rather than the label map itself (O(1) comparison).
  const labelsVersion = useLabelStore((s) => s.labelsVersion);
  const t = useLabelStore((s) => s.t);

  return useMemo(
    () => [...serverMenus, ...localizeMenus(menuConfig, t)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverMenus, labelsVersion],
  );
}
