import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('P3 — wizard organizações (logo)', () => {
  test('passo marca exibe campo de logo', async ({ page }) => {
    const slug = `e2e-${Date.now().toString(36).slice(-6)}`;
    await loginAsAdmin(page);
    await page.goto('/organizacoes');
    await expect(page.locator('.organizacoes-page')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /provisionar organiza/i }).click();

    await page.locator('#nome').fill(`Org E2E ${slug}`);
    await page.locator('#nome').blur();
    await expect(page.locator('.codigo-status.ok')).toBeVisible({ timeout: 20_000 });

    const wizard = page.getByRole('dialog');
    await expect(wizard).toBeVisible();
    const continuar = wizard.getByRole('button', { name: /^continuar$/i });
    await expect(continuar).toBeEnabled({ timeout: 20_000 });
    await continuar.click();
    // Passo 1 (marca): input file fica oculto; uploader e botão de escolha são visíveis.
    await expect(page.locator('.logo-uploader')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.logo-pick-btn')).toBeVisible();
    await expect(page.locator('input.logo-input-hidden')).toHaveCount(1);
  });
});
