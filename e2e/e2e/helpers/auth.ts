import { expect, type Page } from '@playwright/test';

export const defaultTestCredentials = {
  email: process.env.AEROSUITE_TEST_EMAIL ?? 'admin@aerosuite.com',
  password: process.env.AEROSUITE_TEST_PASSWORD ?? 'admin123',
  tenant: process.env.AEROSUITE_TEST_TENANT ?? '',
};

/** Login interno; aguarda resposta da API antes de assert na shell autenticada. */
export async function loginAsAdmin(
  page: Page,
  overrides?: Partial<typeof defaultTestCredentials>
): Promise<void> {
  const creds = { ...defaultTestCredentials, ...overrides };
  await page.goto('/login');
  if (creds.tenant?.trim()) {
    const tenantField = page.locator('#tenantCodigo');
    if (await tenantField.isVisible()) {
      await tenantField.fill(creds.tenant.trim());
    }
  }
  await page.locator('#email').fill(creds.email);
  await page.locator('#password input').fill(creds.password);
  const loginResponse = page.waitForResponse(
    (r) => r.url().includes('/api/auth/login') && r.status() === 200,
    { timeout: 60_000 }
  );
  await page.locator('[data-testid="login-submit"], button.login-button').first().click();
  await loginResponse;
  await expect(page.locator('app-layout, .home-container, aside.sidebar').first()).toBeVisible({ timeout: 45_000 });
}
