import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { MenuItem } from '@/types/menu';

// ── vamc-npl-backend MnuResponse ──────────────────────────────────────────────
// Matches com.vamc.vamcnplbackend.common.mnu.dto.MnuResponse

export interface MnuResponse {
  bzLrgCzCd: string;
  mnuId: string;
  topMnuId: string;        // top-level ancestor menu ID
  mnuNm: string;
  upMnuId: string;         // parent menu ID ('ROOT' if top-level)
  mnuRank: number;         // sort order
  mnuLevRank: number;      // menu depth (1 = top-level)
  subMnuCnt: number;       // count of accessible child menus
  sceId: string | null;    // screen ID — maps to componentPath
  sceNm: string | null;
  sceXrsYn: string;
  mnuXrsYn: string;        // visibility 'Y' | 'N'
  labelKey: string | null;
  labelNm: string | null;  // i18n display name
  permType: string | null; // M(읽기+수정) / S(읽기만) / ''
  fvrYn: string;           // favorite 'Y' | 'N'
  fvrDt: string;           // favorite registered date
  svcUrl: string | null;   // service base URL
}

// ── Menu name → Ant Design icon name mapping ──────────────────────────────────

// Ordered: first keyword match wins. Covers typical PMS domain names in Korean.
const MENU_ICON_RULES: Array<{ keywords: string[]; icon: string }> = [
  // ── Custom SVG icons (specific — checked before generic rules) ──────────────
  { keywords: ['즐겨찾기'],                                                    icon: 'custom:IconStar' },
  { keywords: ['To-Do', 'ToDo', 'TODO', '투두'],                              icon: 'custom:Todo' },
  { keywords: ['공통코드', '공통관리', '공통 코드', '공통 관리'],              icon: 'custom:GearSix' },
  { keywords: ['PMS'],                                                         icon: 'custom:CirclesFour' },
  { keywords: ['인력현황'],                                                    icon: 'custom:Users2' },
  // ── Ant Design icons ────────────────────────────────────────────────────────
  { keywords: ['대시보드', '홈', '메인'],                                     icon: 'DashboardOutlined' },
  { keywords: ['프로젝트'],                                                    icon: 'ApartmentOutlined' },
  { keywords: ['업무', '태스크', '작업', '할일'],                              icon: 'CheckSquareOutlined' },
  { keywords: ['일정', '캘린더', '스케줄'],                                    icon: 'CalendarOutlined' },
  { keywords: ['이슈', '버그', '결함'],                                        icon: 'BugOutlined' },
  { keywords: ['문서', '산출물', '파일', '첨부'],                              icon: 'FileTextOutlined' },
  { keywords: ['회의', '미팅'],                                                icon: 'TeamOutlined' },
  { keywords: ['리소스', '인력', '투입', '배정'],                              icon: 'UserSwitchOutlined' },
  { keywords: ['현황', '보고', '통계', '분석', '지표'],                        icon: 'BarChartOutlined' },
  { keywords: ['알림', '공지', '게시'],                                        icon: 'BellOutlined' },
  { keywords: ['요구사항', '기능'],                                             icon: 'FileSearchOutlined' },
  { keywords: ['테스트', '품질', 'QA'],                                        icon: 'ExperimentOutlined' },
  { keywords: ['배포', '릴리즈'],                                              icon: 'DeploymentUnitOutlined' },
  { keywords: ['형상', '소스', '코드'],                                        icon: 'CodeOutlined' },
  { keywords: ['사용자', '인사', '조직', '구성원'],                            icon: 'UserOutlined' },
  { keywords: ['권한', '역할', '보안'],                                        icon: 'SafetyOutlined' },
  { keywords: ['공통', '시스템', '환경', '설정', '기준'],                      icon: 'SettingOutlined' },
  { keywords: ['계획', '마일스톤'],                                             icon: 'FlagOutlined' },
  { keywords: ['비용', '예산'],                                                 icon: 'DollarOutlined' },
  { keywords: ['위험', '리스크'],                                               icon: 'WarningOutlined' },
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
// Top-level items (upMnuId empty/ROOT/no parent in list) get rail icons.

function buildServerMenuTree(items: MnuResponse[]): MenuItem[] {
  const visible = items.filter((m) => m.mnuXrsYn !== 'N');
  visible.sort((a, b) => a.mnuRank - b.mnuRank);

  const map = new Map<string, MenuItem>();
  for (const item of visible) {
    const displayName = item.labelNm || item.mnuNm;
    map.set(item.mnuId, {
      key: item.mnuId,
      label: displayName,
      componentPath: item.sceId ?? undefined,
      sceId: item.sceId ?? undefined,
      labelKey: item.labelKey ?? undefined,
      permType: item.permType ?? undefined,
    });
  }

  const roots: MenuItem[] = [];
  for (const item of visible) {
    const node = map.get(item.mnuId)!;
    const isRoot = !item.upMnuId || item.upMnuId === 'ROOT' || !map.has(item.upMnuId);
    if (isRoot) {
      node.icon = resolveMenuIcon(item.labelNm || item.mnuNm);
      roots.push(node);
    } else {
      const parent = map.get(item.upMnuId!);
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
  const { data } = await apiClient.get<ApiResponse<MnuResponse[]>>('/api/mnu/auth-list');

  if (data.status !== 200 || !data.data) return [];

  return buildServerMenuTree(data.data);
}
