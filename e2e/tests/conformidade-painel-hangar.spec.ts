import { test, expect, type Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Conformidade P5 — painel, NC e hangar', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await loginAsAdmin(page);
  });

  test('painel qualidade carrega cards e enforcement', async ({ page }) => {
    await page.goto('/conformidade/painel');
    await expect(page.locator('app-conformidade-painel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.painel-cards .stat-card').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.enforcement-card label[for="blkCalib"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.enforcement-card label[for="blkTreino"]')).toBeVisible();
    await expect(page.locator('.enforcement-card label[for="blkSub"]')).toBeVisible();
  });

  test('painel qualidade exibe indicadores SMS', async ({ page }) => {
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/conformidade/sms/indicadores') && r.status() === 200,
        { timeout: 45_000 }
      ),
      page.goto('/conformidade/painel'),
    ]);
    await expect(page.locator('app-conformidade-painel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.sms-card')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.sms-kpis .sms-kpi').first()).toBeVisible();
    await expect(page.locator('.sms-table tbody tr').first()).toBeVisible();
  });

  test('painel qualidade exporta relatorio SGQ', async ({ page }) => {
    await page.route('**/api/conformidade/relatorios/sgq.zip**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/zip',
        body: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      });
    });
    await page.goto('/conformidade/painel');
    await expect(page.locator('app-conformidade-painel')).toBeVisible({ timeout: 20_000 });
    await page.locator('.painel-actions button.p-button-outlined').click();
    await expect(page.locator('.p-toast-message-success, .p-toast .p-toast-message').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('lista de nao conformidades abre', async ({ page }) => {
    await page.goto('/conformidade/nao-conformidades');
    await expect(page.locator('app-nao-conformidade-list')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('app-list-data-states, .p-datatable, p-table').first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('hangar job card abre shell mobile', async ({ page }) => {
    await page.goto('/hangar');
    await expect(page.locator('app-hangar-job-card')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.hangar-shell')).toBeVisible();
    await expect(page.locator('.hangar-header h1')).toBeVisible();
  });
});
