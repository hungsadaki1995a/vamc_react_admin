# E2E tests (Playwright)

Scenarios: [SCENARIOS.md](SCENARIOS.md).

## What it needs

- An admin backend reachable at `E2E_API_TARGET` (default `http://127.0.0.1:17200`).
  The Vite proxy rewrites `Origin` to the backend address, so that backend must allow it:
  start it with `CORS_ALLOWED_ORIGINS=http://localhost:17200,http://localhost:13000` (Spring env override of `cors.allowed-origins`).
- A test account with full rights on every admin menu (`E2E_USER`, `E2E_PASS`). Never commit them.
- Chromium for Playwright: `npx playwright install chromium` (skipped when the cache already has the matching build).

The config starts its own Vite server on `E2E_PORT` (default `13000`), so a running `pnpm dev` on :3000 is not touched.

## Run

```bash
E2E_USER=... E2E_PASS=... pnpm test:e2e                       # everything
E2E_USER=... E2E_PASS=... pnpm test:e2e e2e/screens/shell.spec.ts
E2E_USER=... E2E_PASS=... pnpm test:e2e -g "A06010300"        # one screen (menu code)
pnpm test:e2e:report                                           # open the HTML report (e2e/.report)
```

Optional: `E2E_API_TARGET=http://127.0.0.1:7200` to test against another backend, `E2E_PORT` to move the Vite port.

## Layout

```
playwright.config.ts          projects: setup (login once) → chromium (admin shell), public (login pages)
e2e/
  auth.setup.ts               logs in through the UI, saves e2e/.auth/admin.json
  auth/login.spec.ts          L-*  public pages, login / logout
  screens/menu-manifest.spec.ts  T-01 manifest vs server menu tree
  screens/all-screens.spec.ts    S-*  smoke on every leaf menu
  screens/register-validation.spec.ts  V-01 empty register form
  screens/menu-settings.spec.ts  M-*  tree screens
  screens/shell.spec.ts       SH-* tabs, flyout, language, routes
  support/screens.ts          manifest of the 61 leaf menus (update when T-01 fails)
  support/shell.ts            menu navigation, active tab / panel, popup helpers, error watcher
  support/guard.ts            blocks write calls (tests are read-only)
  support/session.ts          credentials, English UI, UI login
```

Artefacts (`e2e/.auth`, `e2e/.results`, `e2e/.report`) are git-ignored — `.auth` holds a live token.

## Adding a scenario

- New menu → T-01 fails → add the entry to `support/screens.ts`; the smoke and validation suites pick it up.
- Screen-specific checks → a new `e2e/screens/<screen>.spec.ts` using `openMenu(page, path)` and `activePanel(page)`; call `blockWrites(page)` first unless the test is meant to save.
- Prefer role / visible-text locators; CSS Module class names are hashed and change between builds.
