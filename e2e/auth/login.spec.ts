import { expect, test } from '@playwright/test';
import { credentials, loginThroughUi, forceEnglish } from '../support/session';

// L-01 … L-07: public pages and the login / logout round trip (no stored session).
// Wrong-password checks use a non-existent account so the real test account never gets locked.

test.beforeEach(async ({ page }) => {
  await forceEnglish(page);
});

test('L-01 a protected URL redirects to the login page', async ({ page }) => {
  await page.goto('/system-operation/npl-platform/fee');
  await expect(page).toHaveURL(/\/login/);
});

test('L-02 the login button stays disabled until both fields are filled', async ({ page }) => {
  await page.goto('/login');
  const submit = page.getByRole('button', { name: 'Log In' });
  await expect(submit).toBeDisabled();
  await page.getByPlaceholder('Enter email or phone number').fill('someone@example.com');
  await expect(submit).toBeDisabled();
  await page.getByPlaceholder('Enter password').fill('whatever');
  await expect(submit).toBeEnabled();
});

test('L-03 an unknown account shows the credential error', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('Enter email or phone number').fill('e2e-nobody@example.com');
  await page.getByPlaceholder('Enter password').fill('Wrong#Pass1');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page.getByText(/Incorrect Login ID or password/)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test('L-04 Find Login ID and Find Password pages open from the login page', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Find Login ID' }).click();
  await expect(page).toHaveURL(/\/find-id/);
  await page.goBack();
  await page.getByRole('button', { name: 'Find Password' }).click();
  await expect(page).toHaveURL(/\/find-password/);
});

test('L-05 the login page switches to Vietnamese', async ({ page }) => {
  await page.goto('/login');
  await page.getByText('Eng', { exact: true }).click();
  await page.getByText('Tiếng Việt', { exact: true }).click();
  await expect(page.locator('button[type="submit"]')).toHaveText('Đăng nhập');
  await expect(page.getByPlaceholder('Nhập email hoặc số điện thoại')).toBeVisible();
});

test('L-06 login, cancel logout, then log out', async ({ page }) => {
  const { user, pass } = credentials();
  await loginThroughUi(page, user, pass);

  const logout = page.locator('.rail-bottom-item').last();
  await logout.click();
  const dialog = page.locator('.ant-modal-confirm');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(page).toHaveURL(/\/members/);

  await logout.click();
  await page.locator('.ant-modal-confirm').getByRole('button', { name: 'Log Out' }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/members');
  await expect(page).toHaveURL(/\/login/);
});
