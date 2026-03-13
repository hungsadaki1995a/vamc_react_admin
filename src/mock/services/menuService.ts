import { menuConfig } from '@/config/menuConfig';
import type { MenuItem } from '@/types/menu';

function withPermType(items: MenuItem[]): MenuItem[] {
  return items.map((item) => ({
    ...item,
    permType: 'M' as const,
    children: item.children ? withPermType(item.children) : undefined,
  }));
}

export async function mockLoadMenus(): Promise<MenuItem[]> {
  return withPermType(menuConfig);
}
