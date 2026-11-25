import type { Page } from '@playwright/test';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
// Calls that are reads or session handling even though they are POST.
const ALLOWED = [/^\/api\/auth\//, /search/i, /\/list$/];

/**
 * Aborts every write call to `/api` so a scenario can press [Save] / [Register] safely.
 * Returns the list of blocked calls — a non-empty list means the UI tried to save.
 */
export async function blockWrites(page: Page): Promise<string[]> {
  const blocked: string[] = [];
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    if (WRITE_METHODS.has(request.method()) && !ALLOWED.some((re) => re.test(pathname))) {
      blocked.push(`${request.method()} ${pathname}`);
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
  return blocked;
}
