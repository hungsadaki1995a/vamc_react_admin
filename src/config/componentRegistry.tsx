import { lazy } from 'react';
import type { ComponentType } from 'react';
import { DEV_TOOLS_ENABLED } from './menuConfig';

// Auto-discover all page components under src/features/*/*/index.tsx
// componentPath convention = immediate parent folder name (PascalCase)
// e.g., src/features/dev/KanbanBoard/index.tsx → 'KanbanBoard'
//       src/features/cco/CCO101001SC/index.tsx      → 'CCO101001SC'
//
// src/features/dev/** (demo/guide screens, incl. GuideInternalApi which exposes
// internal API/auth-store details) is excluded from the base glob and only
// re-added when DEV_TOOLS_ENABLED — keeps dev-only pages out of the bundle
// entirely (menuConfig.ts 의 메뉴 트리 게이트와 같은 플래그를 쓴다).
type PageLoader = () => Promise<{ default: ComponentType }>;

const baseModules = import.meta.glob([
  '../features/*/*/index.tsx',
  '!../features/dev/**',
]) as Record<string, PageLoader>;

const devModules = (
  DEV_TOOLS_ENABLED ? import.meta.glob('../features/dev/*/index.tsx') : {}
) as Record<string, PageLoader>;

const pageModules: Record<string, PageLoader> = { ...baseModules, ...devModules };

const autoRegistry: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(pageModules).map(([path, loader]) => {
    // Take the folder name immediately before /index.tsx
    const name = path.split('/').at(-2)!;
    return [name, lazy(loader)];
  }),
);

// ── Manual overrides ───────────────────────────────────────────────────────────
// Use when: server scrId ≠ filename, or same file needs different props.
//
// Example — wrap with props:
//   'ProjectListActive': lazy(() =>
//     import('@/features/project/pages/ProjectList/index').then((m) => ({
//       default: () => <m.default filterStatus="active" />,
//     }))
//   ),
//
// Example — remap server scrId to local file:
//   'PMS301001SC': lazy(() => import('@/features/task/pages/KanbanBoard/index')),
const overrides: Record<string, ComponentType> = {
  // Server menuUrlAddr → local component mapping
  // (when server's menuUrlAddr path ≠ folder name under src/features/)
  '/admin/system/admin/menu': lazy(() => import('@/features/admin/AdminMenuManagement/index')),
  '/admin/system/admin/test': lazy(() => import('@/features/admin/AdminTestPage/index')),
};

export const componentRegistry: Record<string, ComponentType> = {
  ...autoRegistry,
  ...overrides,
};
