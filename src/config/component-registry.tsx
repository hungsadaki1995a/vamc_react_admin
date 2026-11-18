import { lazy } from 'react';
import type { ComponentType } from 'react';

// Auto-discover business screens — src/features/{domain}/{screenId}/index.tsx
// Registry key = **immediate parent folder name** (= screenId = MENU_MNG.MENU_URL_ADDR = sceId)
//   e.g. src/features/sys/SYS050301SC/index.tsx → 'SYS050301SC'
//
// Popups live in a child folder of the parent screen (…/{screenId}/{screenId}1P/index.tsx).
// Because the glob depth is fixed at 2 levels, child folders are not matched — intentionally
// excluding screens not opened via menu from the registry.
//
type PageLoader = () => Promise<{ default: ComponentType }>;

const pageModules = import.meta.glob('../features/*/*/index.tsx') as Record<string, PageLoader>;

function toPascalCase(kebab: string): string {
  return kebab.replace(/(^|-)([a-z0-9])/g, (_, __, ch: string) => ch.toUpperCase());
}

const autoRegistry: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(pageModules).flatMap(([path, loader]) => {
    // Take the folder name immediately before /index.tsx
    const name = path.split('/').at(-2)!;
    const component = lazy(loader);
    return [
      [name, component],
      [toPascalCase(name), component],
      [name.toUpperCase(), component],
      // Screen ID as stored in MENU_MNG.MENU_URL_ADDR: 'sys030101-sc' → 'SYS030101SC'
      [name.replace(/-/g, '').toUpperCase(), component],
    ];
  }),
);

// ── Manual registration ────────────────────────────────────────────────────────
// In principle, align DB's MENU_URL_ADDR with the screenId (folder name); override is for exceptions.
// Mapping path strings here leaves sceId as a path and breaks label keys.
//
// Valid exception — when wiring the same file to two menus with different props:
//   'SYS030102SC': lazy(() =>
//     import('@/features/sys/sys030101-sc/index').then((m) => ({
//       default: () => <m.default filterStatus="active" />,
//     }))
//   ),
const overrides: Record<string, ComponentType> = {
  member: lazy(() => import('@/features/member/member-list')),
  members: lazy(() => import('@/features/member/member-list')),
  'member.list': lazy(() => import('@/features/member/member-list')),
  'member-management': lazy(() => import('@/features/member/member-list')),
  MemberManagement: lazy(() => import('@/features/member/member-list')),
  MemberList: lazy(() => import('@/features/member/member-list')),
  inquiry: lazy(() => import('@/features/content/inquiry-management')),
  'inquiry-management': lazy(() => import('@/features/content/inquiry-management')),
  '1:1 Inquiry Management': lazy(() => import('@/features/content/inquiry-management')),
  InquiryManagement: lazy(() => import('@/features/content/inquiry-management')),
  faq: lazy(() => import('@/features/content/faq-management')),
  'faq-management': lazy(() => import('@/features/content/faq-management')),
  'FAQ Management': lazy(() => import('@/features/content/faq-management')),
  FaqManagement: lazy(() => import('@/features/content/faq-management')),
};

export const componentRegistry: Record<string, ComponentType> = {
  ...autoRegistry,
  ...overrides,
};
