import type { MenuItem } from '@/types/menu';
import type { MenuProps } from 'antd';
import * as Icons from '@ant-design/icons';
import React from 'react';

type AntMenuItem = NonNullable<MenuProps['items']>[number];

export function findMenuByKey(
  items: MenuItem[],
  key: string
): MenuItem | null {
  for (const item of items) {
    if (item.key === key) return item;
    if (item.children) {
      const found = findMenuByKey(item.children, key);
      if (found) return found;
    }
  }
  return null;
}

/** componentPath(=sceId)로 메뉴 검색 — useNavigateTab용 */
export function findMenuByComponentPath(
  menus: MenuItem[],
  componentPath: string
): MenuItem | null {
  for (const m of menus) {
    if (m.componentPath === componentPath) return m;
    if (m.children) {
      const found = findMenuByComponentPath(m.children, componentPath);
      if (found) return found;
    }
  }
  return null;
}

/** targetKey가 속한 최상위(1Depth) 메뉴 key — IconRail 활성화용 */
export function findTopLevelMenuKey(
  menus: MenuItem[],
  targetKey: string
): string | null {
  for (const top of menus) {
    if (top.key === targetKey) return top.key;
    if (top.children && findMenuByKey(top.children, targetKey)) return top.key;
  }
  return null;
}

export function getMenuParentKeys(
  items: MenuItem[],
  targetKey: string,
  parents: string[] = []
): string[] | null {
  for (const item of items) {
    if (item.key === targetKey) return parents;
    if (item.children) {
      const result = getMenuParentKeys(
        item.children,
        targetKey,
        [...parents, item.key]
      );
      if (result) return result;
    }
  }
  return null;
}

export function getMenuBreadcrumb(
  menus: MenuItem[],
  targetKey: string
): { key: string; label: string }[] {
  for (const menu of menus) {
    if (menu.key === targetKey) {
      return [{ key: menu.key, label: menu.label }];
    }
    if (menu.children) {
      const path = getMenuBreadcrumb(menu.children, targetKey);
      if (path.length > 0) {
        return [{ key: menu.key, label: menu.label }, ...path];
      }
    }
  }
  return [];
}

function getIcon(iconName?: string): React.ReactNode {
  if (!iconName) return null;
  const IconComponent = (Icons as Record<string, unknown>)[iconName] as
    | React.ComponentType
    | undefined;
  if (!IconComponent) return null;
  return React.createElement(IconComponent);
}

export function buildAntMenuItems(items: MenuItem[]): AntMenuItem[] {
  return items
    .filter((item) => !item.hidden)
    .map((item) => {
      if (item.children && item.children.length > 0) {
        return {
          key: item.key,
          icon: getIcon(item.icon),
          label: item.label,
          children: buildAntMenuItems(item.children),
        };
      }
      return {
        key: item.key,
        icon: getIcon(item.icon),
        label: item.label,
      };
    });
}
