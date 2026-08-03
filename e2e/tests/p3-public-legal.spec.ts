import { test, expect } from '@playwright/test';

test.describe('P3 — páginas legais públicas', () => {
  test('termos e privacidade carregam documento', async ({ page }) => {
    const termosResp = page.waitForResponse(
      (r) => r.url().includes('/api/public/lgpd/termos') && r.status() === 200
    );
    await page.goto('/termos');
    await termosResp;
    await expect(page.locator('h2.auth-page-title')).not.toBeEmpty({ timeout: 15_000 });
    await expect(page.locator('pre.auth-legal-body')).toContainText(/.+/, { timeout: 15_000 });

    const privResp = page.waitForResponse(
      (r) => r.url().includes('/api/public/lgpd/privacidade') && r.status() === 200
    );
    await page.goto('/privacidade');
    await privResp;
    await expect(page.locator('h2.auth-page-title')).not.toBeEmpty({ timeout: 15_000 });
    await expect(page.locator('pre.auth-legal-body')).toContainText(/.+/, { timeout: 15_000 });
  });

  test('termos aceitam query tenant', async ({ page }) => {
    await page.goto('/termos?tenant=default');
    await expect(page.locator('h2.auth-page-title')).toBeVisible({ timeout: 15_000 });
  });
});
