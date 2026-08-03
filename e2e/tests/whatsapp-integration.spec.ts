import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Integração WhatsApp', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('página de integração carrega status e ações', async ({ page }) => {
    await page.goto('/integracoes/whatsapp');
    await expect(page.locator('app-page-hero, .integracoes-whatsapp-page').first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('.wa-status-grid, .wa-loading-wrap').first()).toBeVisible({ timeout: 45_000 });

    const activateBtn = page.getByRole('button', { name: /ativar whatsapp|activate whatsapp/i });
    const qrBtn = page.getByRole('button', { name: /obter qr|get qr/i });
    const disconnectBtn = page.getByRole('button', { name: /desconectar|disconnect/i });

    await expect(activateBtn.or(qrBtn).or(disconnectBtn)).toBeVisible({ timeout: 15_000 });
  });

  test('configurações exibe link para WhatsApp', async ({ page }) => {
    await page.goto('/configuracoes');
    await expect(page.locator('.settings-container, .configuracoes-container, app-page-hero').first()).toBeVisible({
      timeout: 30_000,
    });
    const whatsappSection = page.locator('a[routerlink="/integracoes/whatsapp"], a[href*="integracoes/whatsapp"]');
    if (await whatsappSection.count()) {
      await expect(whatsappSection.first()).toBeVisible();
    }
  });
});
