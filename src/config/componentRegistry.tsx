import { lazy } from 'react';
import type { ComponentType } from 'react';

// Auto-discover all page components under src/features/*/*/index.tsx
// componentPath convention = immediate parent folder name (PascalCase)
// e.g., src/features/dev/KanbanBoard/index.tsx → 'KanbanBoard'
//       src/features/cco/CCO101001SC/index.tsx      → 'CCO101001SC'
const pageModules = import.meta.glob('../features/*/*/index.tsx') as Record<
  string,
  () => Promise<{ default: ComponentType }>
>;

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
const overrides: Record<string, ComponentType> = {};

export const componentRegistry: Record<string, ComponentType> = {
  ...autoRegistry,
  ...overrides,
};
