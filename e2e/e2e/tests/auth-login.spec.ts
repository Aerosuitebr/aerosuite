import { test, expect } from '@playwright/test';

const email = process.env.AEROSUITE_TEST_EMAIL ?? 'admin@aerosuite.com';
const password = process.env.AEROSUITE_TEST_PASSWORD ?? 'admin123';
const tenant = process.env.AEROSUITE_TEST_TENANT ?? 'default';

test.describe('Login interno', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('mostra formulario de login', async ({ page }) => {
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"], button.login-button').first()).toBeVisible();
  });

  test('credenciais invalidas mostram erro', async ({ page }) => {
    const tenantField = page.locator('#tenantCodigo');
    if (await tenantField.isVisible()) {
      await tenantField.fill(tenant);
    }
    await page.locator('#email').fill(email);
    await page.locator('#password input').fill('___invalid___');
    await page.locator('[data-testid="login-submit"], button.login-button').first().click();
    await expect(page.locator('.error-message, .p-message-error').first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(/\/login/);
  });

  test('login valido redireciona para home', async ({ page }) => {
    const tenantField = page.locator('#tenantCodigo');
    if (await tenantField.isVisible()) {
      await tenantField.fill(tenant);
    }
    await page.locator('#email').fill(email);
    await page.locator('#password input').fill(password);
    const loginResponse = page.waitForResponse(
      (r) => r.url().includes('/api/auth/login') && r.status() === 200,
      { timeout: 45_000 }
    );
    await page.locator('[data-testid="login-submit"], button.login-button').first().click();
    await loginResponse;
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
    await expect(page.locator('.home-container, app-layout .sidebar').first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
