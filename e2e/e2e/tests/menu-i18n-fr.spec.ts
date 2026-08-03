import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Menu em frances', () => {
  test('secao e itens sem caracteres corrompidos', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: /français|french/i }).click();
    await expect(page.locator('aside.sidebar')).toBeVisible();

    const sidebarText = await page.locator('aside.sidebar').innerText();
    expect(sidebarText).not.toMatch(/\?{2,}/);
    await expect(page.getByRole('link', { name: /tableau de bord/i }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('nao mostra fallback portugues em itens conhecidos', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: /français|french/i }).click();
    await expect(page.locator('aside.sidebar')).toBeVisible();
    await expect(page.getByRole('link', { name: /tableau de bord/i }).first()).toBeVisible({ timeout: 15_000 });

    const sidebarText = await page.locator('aside.sidebar').innerText();
    expect(sidebarText).not.toMatch(/Painel de voo|Ordem de Serviço|Usuários Externos/);
    await expect(page.getByRole('link', { name: /organisations/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
