import { test, expect } from '@playwright/test';
import { defaultTestCredentials, loginAsAdmin } from '../helpers/auth';

test.describe('Centro de Organizacoes (plataforma)', () => {
  test('operador default abre lista e acao de provisao', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/organizacoes');
    await expect(page.locator('.organizacoes-page')).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: /centro de organiza/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /provisionar organiza/i })
    ).toBeVisible();
  });

  test('API tenants lista pelo menos organizacao default', async ({ request }) => {
    const { email, password, tenant } = defaultTestCredentials;
    const login = await request.post('http://localhost:8080/api/auth/login', {
      data: { email, password, tenantCodigo: tenant },
    });
    expect(login.ok()).toBeTruthy();
    const { token } = await login.json();
    const tenants = await request.get('http://localhost:8080/api/tenants', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(tenants.ok()).toBeTruthy();
    const body = await tenants.json();
    const items = body.items ?? body;
    expect(Array.isArray(items) ? items.length : 0).toBeGreaterThanOrEqual(1);
  });
});
