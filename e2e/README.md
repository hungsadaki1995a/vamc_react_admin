# E2E tests (Playwright)

End-to-end scenarios that drive the admin UI in a real browser: login, every menu screen, register-form validation, tabs, language, routes. Scenario list: [SCENARIOS.md](SCENARIOS.md).

The tests are **read-only** — every save / delete call is blocked — so they are safe against your local database.

## Quick start

1. Start the admin backend as you normally do (`vamc-npl-admin-backend`, profile `local`, port **7200**).
2. Once per machine:

   ```bash
   pnpm install
   cp e2e/.env.e2e.example e2e/.env.e2e   # then fill E2E_USER / E2E_PASS
   ```

   The account needs rights on every admin menu. `e2e/.env.e2e` is git-ignored — never commit it.
3. Run:

   ```bash
   pnpm e2e
   ```

   Chromium is downloaded on the first run. A full run takes about 7 minutes.

Your `pnpm dev` on port 3000 can stay open: the tests start their own Vite server on port 13000.

## Commands

| Command | What it does |
|---------|--------------|
| `pnpm e2e` | All scenarios + HTML report |
| `pnpm e2e e2e/screens/shell.spec.ts` | One spec file |
| `pnpm e2e -g "A06010300"` | One screen, by menu code (see `support/screens.ts`) |
| `pnpm e2e -g "Fee Management"` | Tests whose title contains the text |
| `pnpm e2e --open` | Serve the report in the browser when the run ends |
| `pnpm e2e --headed` | Watch the browser while it runs (any Playwright option works) |
| `pnpm e2e:report` | Serve the newest report again |

## Report

Each run writes `e2e/.report/<yyyymmdd-hhmmss>/index.html` (the last 10 runs are kept; `E2E_KEEP_REPORTS` changes it).
Open it with `pnpm e2e:report` or `--open` rather than double-clicking the file — traces need http.

For a failed test the report has the error, a screenshot and a trace (step-by-step DOM, network, console). Every smoke test also attaches screenshots of the screen and its popups.

The exit code is Playwright's (0 = all passed), so the same command works in CI.

## Settings (`e2e/.env.e2e` or environment)

| Variable | Default | |
|----------|---------|--|
| `E2E_USER`, `E2E_PASS` | — | test account (required) |
| `E2E_API_TARGET` | `http://127.0.0.1:7200` | admin backend to test against |
| `E2E_PORT` | `13000` | Vite port of the run |
| `E2E_KEEP_REPORTS` | `10` | reports kept |

Using another backend: the Vite proxy sends `Origin` = the backend's own address (`127.0.0.1` → `localhost`), so that origin must be in the backend's `cors.allowed-origins`. The `local` profile already allows `http://localhost:7200`; for any other port start the backend with e.g. `CORS_ALLOWED_ORIGINS=http://localhost:17200,http://localhost:13000`.

## Troubleshooting

| Message | Fix |
|---------|-----|
| `Set E2E_USER / E2E_PASS` | create `e2e/.env.e2e` from the example |
| `Admin backend … is not answering` | start the backend, or set `E2E_API_TARGET` |
| Login step fails with "You do not have permission…" | the backend rejects the proxy `Origin` — see CORS above |
| `Port 13000 is already in use` | another run is still open, or set `E2E_PORT` |
| T-01 (menu manifest) fails | the server menu tree changed — update `support/screens.ts` |
| `log in as admin` fails, account locked | unlock the test account; the suite itself never sends a wrong password for it |

## Layout

```
playwright.config.ts          projects: setup (login once) → chromium (admin shell), public (login pages)
e2e/
  run.mjs                     team runner (pnpm e2e): settings, backend check, Chromium, timestamped report
  .env.e2e.example            template for the local settings file
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
- Before pushing: `npx tsc -p e2e/tsconfig.json` and `pnpm lint`.
