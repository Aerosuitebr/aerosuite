import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Home e navegacao', () => {
  test('home carrega cockpit e cards', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator('.home-container')).toBeVisible();
    await expect(page.locator('.home-cards .home-card').first()).toBeVisible();
    await expect(page.locator('.home-container app-brand-stack')).toBeVisible();
  });

  test('menu lateral tem itens apos login', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText(/carregando menu/i)).toBeHidden({ timeout: 45_000 });
    const menuLinks = page.locator('aside.sidebar .nav-flight-link');
    await expect
      .poll(async () => menuLinks.count(), { timeout: 45_000, message: 'menu dinamico (meu-menu) deve carregar' })
      .toBeGreaterThan(5);
  });
});
