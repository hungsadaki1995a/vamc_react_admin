import { lazy } from 'react';
import type { ComponentType } from 'react';
import { DEV_TOOLS_ENABLED } from './menuConfig';

// 업무 화면 자동 발견 — src/features/{도메인}/{화면ID}/index.tsx
// 레지스트리 키 = **바로 위 폴더명** (= 화면ID = MENU_MNG.MENU_URL_ADDR = sceId)
//   예) src/features/sys/SYS050301SC/index.tsx → 'SYS050301SC'
//
// 팝업은 부모 화면의 자식 폴더에 둔다(…/{화면ID}/{화면ID}1P/index.tsx).
// 글롭이 2단계 고정이라 자식 폴더는 걸리지 않는다 — 메뉴로 열지 않는 화면을
// 레지스트리에서 제외하려는 의도다.
//
// 데모·가이드는 src/dev/pages/ 로 분리했고 DEV_TOOLS_ENABLED 일 때만
// 글롭에 포함한다 — 운영 번들에서 통째로 빠진다
// (menuConfig.ts 의 메뉴 트리 게이트와 같은 플래그를 쓴다).
type PageLoader = () => Promise<{ default: ComponentType }>;

const baseModules = import.meta.glob('../features/*/*/index.tsx') as Record<string, PageLoader>;

const devModules = (
  DEV_TOOLS_ENABLED ? import.meta.glob('../dev/pages/*/index.tsx') : {}
) as Record<string, PageLoader>;

const pageModules: Record<string, PageLoader> = { ...baseModules, ...devModules };

const autoRegistry: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(pageModules).map(([path, loader]) => {
    // Take the folder name immediately before /index.tsx
    const name = path.split('/').at(-2)!;
    return [name, lazy(loader)];
  }),
);

// ── 수동 등록 ─────────────────────────────────────────────────────────────────
// 원칙은 DB 의 MENU_URL_ADDR 을 화면ID(폴더명)로 맞추는 것이고, override 는 예외 수단이다.
// 경로 문자열을 남긴 채 여기서 매핑하면 sceId 가 경로가 되어 라벨 키가 어긋난다.
//
// 예외가 정당한 경우 — 같은 파일을 다른 props 로 두 메뉴에 걸 때:
//   'SYS030102SC': lazy(() =>
//     import('@/features/sys/SYS030101SC/index').then((m) => ({
//       default: () => <m.default filterStatus="active" />,
//     }))
//   ),
const overrides: Record<string, ComponentType> = {
  member: lazy(() => import('@/features/member/MemberList')),
  'member-management': lazy(() => import('@/features/member/MemberList')),
  MemberManagement: lazy(() => import('@/features/member/MemberList')),
  MemberList: lazy(() => import('@/features/member/MemberList')),
  // 현재 없음 — 모든 메뉴가 MENU_URL_ADDR 에 화면ID(폴더명)를 담고 있어 자동 발견으로 해결된다.
};

export const componentRegistry: Record<string, ComponentType> = {
  ...autoRegistry,
  ...overrides,
};
