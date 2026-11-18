import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { MenuItem, MenuTreeItem } from '@/types/menu';
import { useLocaleStore } from '@/stores/locale-store';
import { resolveMenuComponent } from '@/config/menu-component-fallback';

// ─────────────────────────────────────────────────────────────────────────────
// My authorized menus (MENU_MNG) lookup API — global domain.
//
// Reads the menu tree visible to the logged-in user (`GET /api/common/menus/my`)
// to render the left rail and flyout. Permissions (permType) are also determined by this response.
//
// ⚠️ Calls for the menu management screen (SYS030101SC) live in `src/api/sys/menuMngApi.ts`.
//    Only the response DTO (MnuResponse) is shared from this file.
// ─────────────────────────────────────────────────────────────────────────────

// ── vamc-npl-backend MnuResponse ──────────────────────────────────────────────
// Matches /api/common/menus/all response item

export interface MnuResponse {
  menuCd: string;           // unique menu code (e.g. "A01------")
  upMenuCd: string;         // parent menu code ("A--------" for top-level)
  lblCd: string;            // i18n label code
  menuSeq: number;          // sequence
  menuDpth: number;         // depth (1 = top-level, 2 = sub, 3 = leaf)
  menuNmDisplay: string;    // display name in Korean (may have leading spaces — trim before use)
  menuLblVal?: string;      // multilingual label value from label table (locale-dependent via X-Lang)
  menuUrlAddr?: string;     // URL path for leaf menus (absent on parent menus)
  menuAuthrt?: string;      // Role-based permission (RD=read, WT=write, AL=all) — present only in /my response
  sortPath: string;         // sort order string (e.g. "001-001")
  children: MnuResponse[];  // /my returns a nested tree, /all returns an empty array
}

// ── Menu name → Ant Design icon name mapping ──────────────────────────────────

// Ordered: first keyword match wins. Covers VAMC NPL Admin domain names in Korean.
const MENU_ICON_RULES: Array<{ keywords: string[]; icon: string }> = [
  { keywords: ['회원'],                                                        icon: 'UserOutlined' },
  { keywords: ['거래', '계약', '신청'],                                        icon: 'FileTextOutlined' },
  { keywords: ['NPL', 'npl', '채권', '담보', '채무', '채권자'],               icon: 'BankOutlined' },
  { keywords: ['컨텐츠', '공지', '뉴스', '공고', '문의', 'FAQ', '배너'],      icon: 'ReadOutlined' },
  { keywords: ['통계'],                                                        icon: 'BarChartOutlined' },
  { keywords: ['경매', '입찰'],                                                icon: 'ShoppingOutlined' },
  { keywords: ['시스템', '운영'],                                              icon: 'SettingOutlined' },
  { keywords: ['대시보드', '홈', '메인'],                                      icon: 'DashboardOutlined' },
  { keywords: ['사용자', '관리자'],                                             icon: 'TeamOutlined' },
  { keywords: ['권한', '메뉴'],                                                icon: 'SafetyOutlined' },
  { keywords: ['코드'],                                                        icon: 'CodeOutlined' },
  { keywords: ['배치'],                                                        icon: 'ClockCircleOutlined' },
  { keywords: ['알림'],                                                        icon: 'BellOutlined' },
];

function resolveMenuIcon(menuNm: string): string {
  const name = menuNm ?? '';
  for (const rule of MENU_ICON_RULES) {
    if (rule.keywords.some((kw) => name.includes(kw))) {
      return rule.icon;
    }
  }
  return 'AppstoreOutlined'; // fallback
}

// ── Build MenuItem tree from flat MnuResponse[] — O(n) single pass ──────────
// Top-level items (no parent in list) get rail icons.

function buildServerMenuTree(items: MnuResponse[]): MenuItem[] {
  // Sort by sortPath for correct ordering
  const sorted = [...items].sort((a, b) => a.sortPath.localeCompare(b.sortPath));

  const map = new Map<string, MenuItem>();
  for (const item of sorted) {
    map.set(item.menuCd, {
      key: item.menuCd,
      label: item.menuLblVal?.trim() || item.menuNmDisplay.trim(),
      componentPath: resolveMenuComponent(item.menuCd, item.menuUrlAddr),
      labelKey: item.lblCd ?? undefined,
      permType: item.menuAuthrt ?? undefined,
    });
  }

  const roots: MenuItem[] = [];
  for (const item of sorted) {
    const node = map.get(item.menuCd)!;
    const isRoot = !item.upMenuCd || !map.has(item.upMenuCd);
    if (isRoot) {
      node.icon = resolveMenuIcon(item.menuNmDisplay.trim());
      roots.push(node);
    } else {
      const parent = map.get(item.upMenuCd);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }
    }
  }

  return roots;
}

// ── API call ──────────────────────────────────────────────────────────────────
// X-Project-Id header is injected automatically by the axios request interceptor
// (reads from projectStore.activeProject.id — set on login and project change)

// /my response is a nested tree of children — flatten to reuse buildServerMenuTree (expects flat)
function flattenMenuTree(items: MnuResponse[]): MnuResponse[] {
  return items.flatMap((i) => [i, ...flattenMenuTree(i.children ?? [])]);
}

export async function fetchAuthMenuResult(): Promise<{ trees: MenuTreeItem[]; items: MenuItem[] }> {
  // Pass langCd as query param — backend uses this (not X-Lang header) to resolve MENU_LBL_VAL.
  // DB LANG_CD is KR/EN/VN — server resolveLangCd normalizes ko→KR.
  const locale = useLocaleStore.getState().locale;
  const { data } = await apiClient.get<ApiResponse<MnuResponse[]>>('/api/common/menus/my', {
    params: { langCd: locale },
  });

  if (data.status !== 200 || !data.data) return { trees: [], items: [] };

  return {
    trees: data.data,
    items: buildServerMenuTree(flattenMenuTree(data.data)),
  };
}

export async function fetchAuthMenuList(): Promise<MenuItem[]> {
  const { items } = await fetchAuthMenuResult();
  return items;
}
