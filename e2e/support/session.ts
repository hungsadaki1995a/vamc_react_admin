import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Test credentials — provided by the runner, never committed. */
export function credentials(): { user: string; pass: string } {
  const user = process.env.E2E_USER;
  const pass = process.env.E2E_PASS;
  if (!user || !pass) throw new Error('Set E2E_USER and E2E_PASS (see e2e/README.md).');
  return { user, pass };
}

/** Forces the English UI so text selectors are stable (the app defaults to Vietnamese). */
export async function forceEnglish(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('vamc-locale', JSON.stringify({ state: { locale: 'en' }, version: 2 }));
    } catch {
      /* storage blocked */
    }
    document.cookie = 'vamc-locale=en; path=/';
  });
}

/** Logs in through the login page and waits for the admin shell. */
export async function loginThroughUi(page: Page, user: string, pass: string): Promise<void> {
  await forceEnglish(page);
  await page.goto('/login');
  await page.getByPlaceholder('Enter email or phone number').fill(user);
  await page.getByPlaceholder('Enter password').fill(pass);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/members/, { timeout: 20_000 });
  await expect(page.locator('.icon-rail')).toBeVisible();
}
