import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { MenuItem } from '@/types/menu';
import { IS_MOCK_MODE, mockFetchAuthMenuList } from '@/mocks';

// ── vamc-npl-backend MnuResponse ──────────────────────────────────────────────
// Matches /api/common/menus/all response item

export interface MnuResponse {
  menuCd: string;           // unique menu code (e.g. "A01------")
  upMenuCd: string;         // parent menu code ("A--------" for top-level)
  lblCd: string;            // i18n label code
  menuSeq: number;          // sequence
  menuDpth: number;         // depth (1 = top-level, 2 = sub, 3 = leaf)
  menuNmDisplay: string;    // display name (may have leading spaces — trim before use)
  menuUrlAddr?: string;     // URL path for leaf menus (absent on parent menus)
  sortPath: string;         // sort order string (e.g. "001-001")
  children: MnuResponse[];  // always empty from server — tree built client-side
}

// ── Menu name → Ant Design icon name mapping ──────────────────────────────────

// Ordered: first keyword match wins. Covers VAMC NPL Admin domain names in Korean.
const MENU_ICON_RULES: Array<{ keywords: string[]; icon: string }> = [
  { keywords: ['회원'],                                                        icon: 'UserOutlined' },
  { keywords: ['거래', '계약', '신청'],                                        icon: 'FileTextOutlined' },
  { keywords: ['NPL', 'npl', '채권', '담보', '채무', '채권자'],               icon: 'BankOutlined' },
  { keywords: ['컨텐츠', '공지', '뉴스', '공고', '문의', 'FAQ', '배너'],      icon: 'ReadOutlined' },
  { keywords: ['통계'],                                                        icon: 'BarChartOutlined' },
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
      label: item.menuNmDisplay.trim(),
      componentPath: item.menuUrlAddr ?? undefined,
      labelKey: item.lblCd ?? undefined,
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

export async function fetchAuthMenuList(): Promise<MenuItem[]> {
  const { data } = await apiClient.get<ApiResponse<MnuResponse[]>>('/api/common/menus/all');

  if (data.status !== 200 || !data.data) return [];

  return buildServerMenuTree(data.data);
}
