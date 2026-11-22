# VAMC NPL Admin (frontend)

Admin web app for the VAMC NPL platform — React 19 + TypeScript + Vite, Ant Design 6, TanStack Query, Zustand.

## Quick start

```bash
corepack enable
pnpm install
cp .env.example .env.local      # set VITE_API_BASE_URL / VITE_API_PROXY_TARGET
pnpm dev                        # http://localhost:3000 (admin backend must be running)
```

| Command | |
|---------|--|
| `pnpm dev` | dev server on :3000 |
| `pnpm build` | `tsc -b && vite build` → `dist/` |
| `pnpm lint` | ESLint |
| `npx tsc -b` | type check |
| `pnpm api:generate` | regenerate the OpenAPI client in `src/api/generated` |

## Documentation

| Doc | Content |
|-----|---------|
| [docs/architecture.md](docs/architecture.md) | stack, layout, tabs, stores, registry, folders, build |
| [docs/development-guide.md](docs/development-guide.md) | how to add a screen, list / popup patterns |
| [docs/api-integration.md](docs/api-integration.md) | HTTP client, API files, data hooks, errors |
| [docs/i18n-and-permissions.md](docs/i18n-and-permissions.md) | locale, DB labels, menu permissions, common codes |
| [docs/components.md](docs/components.md) | shared components |
| [docs/reference.md](docs/reference.md) | hooks, stores, utils, lib |

Coding rules: [.agents/rules/coding-convention.md](.agents/rules/coding-convention.md), [naming-convention.md](.agents/rules/naming-convention.md), [styling-convention.md](.agents/rules/styling-convention.md).
