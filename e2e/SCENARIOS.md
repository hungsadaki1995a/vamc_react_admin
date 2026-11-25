# E2E scenarios — VAMC NPL Admin

Playwright scenarios for the admin frontend. How to run: `e2e/README.md`.

**Principles**

- Drive the app as a user: log in on the login page, open screens from the rail → flyout menu, use buttons by their visible text (English UI is forced).
- **Read-only.** Every scenario on the admin shell blocks `POST/PUT/PATCH/DELETE` calls to `/api` (`support/guard.ts`); a blocked call fails the check that expects none. Popups are opened and closed, never saved.
- One manifest (`support/screens.ts`) lists every leaf menu of the server menu tree; T-01 fails when the tree changes so the list never silently drifts.
- Wrong-password checks use a non-existent account so the shared test account is never locked.

## Coverage

| Suite | File | Screens | Cases |
|-------|------|---------|-------|
| Menu manifest | `screens/menu-manifest.spec.ts` | menu tree | T-01 |
| Screen smoke | `screens/all-screens.spec.ts` | all 61 leaf menus | S-01 … S-08 per screen |
| Register validation | `screens/register-validation.spec.ts` | every screen with a register popup | V-01 per screen |
| Menu Settings | `screens/menu-settings.spec.ts` | Menu Settings, Admin Menu Settings | M-01 … M-03 |
| Admin shell | `screens/shell.spec.ts` | tabs, flyout, language, routes | SH-01 … SH-08 |
| Login / public pages | `auth/login.spec.ts` | login, find ID / password | L-01 … L-06 |

## T — menu manifest

| ID | Scenario | Expected |
|----|----------|----------|
| T-01 | Read `GET /api/common/menus/my` (X-Lang en) for the test account | Leaf menus (code + label path) equal `support/screens.ts` |

## S — screen smoke (run for each of the 61 leaf menus)

| ID | Step | Expected |
|----|------|----------|
| S-01 | Rail group → expand flyout folders → click the leaf | Menu item exists under the expected folders |
| S-02 | — | Active tab shows the leaf label |
| S-03 | Wait for the screen | No "Component not found"; a table / form / tree is visible. Pending menus (`kind: 'pending'`) show "This screen is not available yet" |
| S-04 | [Search], then [Reset] (when present) | Calls answer without error |
| S-05 | [New] / [Register] / [Add New] (when present and enabled) | Register popup opens; closes with [Cancel] / [Close] / × |
| S-06 | Click the first table row (when rows exist) | If it opens a detail popup, the popup closes again |
| S-07 | During S-01 … S-06 | No uncaught page error |
| S-08 | During S-01 … S-06 | No `/api` call answers ≥ 400; no write call is attempted |

Console errors are attached to the test as an annotation (`console-errors`), not failed — today they are antd deprecation warnings only.

## V — register validation

| ID | Step | Expected |
|----|------|----------|
| V-01 | Open the register popup, press the submit button ([Register] / [Save] / [Confirm] …) with the form untouched | No write call is sent; a required-field message is shown — inline under the field (System screens) or as a warning toast (Content / NPL screens, e.g. "Enter the title.") |

Screens without a register popup are reported as skipped (transaction, NPL lists, auction, tree screens, permission matrices, histories).

## M — Menu Settings (tree screens)

| ID | Scenario | Expected |
|----|----------|----------|
| M-01 | Open the screen | Tree with at least one node; detail panel shows "Select a menu in the tree, or add a new one." |
| M-02 | Click the first node | Node is selected (`aria-selected`), detail form shows "Menu Name (EN)" and [Save] |
| M-03 | [Collapse All] then [Expand All] | Visible node count changes, then returns to the initial count |

## SH — admin shell

| ID | Scenario | Expected |
|----|----------|----------|
| SH-01 | Type in Fee Management's filter, open Form Management, come back | Fee tab still holds the typed value (tabs stay mounted) |
| SH-02 | Open a menu that is already open | No new tab; the existing tab becomes active |
| SH-03 | Close a tab with × | Tab removed |
| SH-04 | Right-click a tab → "Close Other Tabs" | Only that tab (and the fixed home tab) remain |
| SH-05 | Sidebar toggle twice | Flyout hides, then shows |
| SH-06 | Header language → Tiếng Việt | `<html lang="vi">`, rail group titles in Vietnamese |
| SH-07 | Open `/system-operation/npl-platform/fee` directly | Fee Management tab active **and the URL stays on that route** |
| SH-08 | Open Fee Management, reload the page | Fee Management is still the active tab |

## L — login and public pages (no stored session)

| ID | Scenario | Expected |
|----|----------|----------|
| L-01 | Open a protected URL without a session | Redirect to `/login` |
| L-02 | Fill the login form field by field | [Log In] disabled until both fields have a value |
| L-03 | Log in with a non-existent account | "Incorrect Login ID or password…" message; stays on `/login` |
| L-04 | [Find Login ID], back, [Find Password] | `/find-id` and `/find-password` open |
| L-05 | Switch the login page to Tiếng Việt | Button "Đăng nhập", Vietnamese placeholders |
| L-06 | Log in → [Log out] → Cancel → [Log out] → Log Out | Cancel keeps the session; confirming returns to `/login` and protected URLs redirect again |

## Not covered yet (next candidates)

- Saving data (register / edit / delete round trips) — needs a disposable database or API clean-up.
- Role-based permission (read-only account: write buttons hidden / disabled) — needs a second test account with `RD` rights.
- Excel download / upload content.
- Visual regression (screenshots are attached to every smoke test and can become baselines).
