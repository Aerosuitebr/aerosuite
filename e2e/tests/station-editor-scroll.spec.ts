import { test, expect } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL, video: 'off' });

const menu = [{ id: 1, codigo: 'OS_FLUXO_ESTACOES', nome: 'Gerenciar estações', rota: '/os/fluxo/estacoes', ativo: true }];
const user = {
  id: 999, tenantId: 1, email: 'qa@aerosuite.test', nome: 'Gestor', role: 'ADMIN',
  perfil: { id: 1, nome: 'Administrador', codigo: 'ADMIN' },
  funcionalidadeCodigos: ['OS_FLUXO_ESTACOES'], menuFuncionalidades: menu,
  modulosHabilitados: ['MRO', 'os'], tenantFeatures: []
};
const etapas = [
  ['Recebimento', 'Recebimento'], ['Desmontagem', 'Oficina'], ['Limpeza', 'Oficina'],
  ['Inspeção', 'Oficina'], ['Ensaio não destrutivo', 'Oficina'], ['Montagem', 'Oficina'],
  ['Teste', 'Teste'], ['Inspeção final', 'Qualidade'], ['Expedição', 'Expedição']
].map(([nome, setor], i) => ({ id: i + 1, nome, setor, ordem: i + 1, cor: '#2563eb' }));

for (const viewport of [{ width: 1440, height: 900 }, { width: 1100, height: 650 }, { width: 390, height: 844 }]) {
  test(`alcança Qualidade e Expedição com rolagem em ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(({ user }) => {
      const payload = btoa(JSON.stringify({ exp: 9999999999, sub: '999', tid: 1 }));
      localStorage.setItem('aerosuite_token', `eyJhbGciOiJub25lIn0.${payload}.qa`);
      localStorage.setItem('aerosuite_user', JSON.stringify(user));
      localStorage.setItem('aerosuite_tenant_codigo', 'default');
    }, { user });
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url()).pathname;
      let body: unknown = [];
      if (url.includes('/auth/me')) body = user;
      else if (url.includes('/os-fluxo/estacoes')) body = {
        setores: ['Recebimento', 'Oficina', 'Teste', 'Qualidade', 'Expedição'],
        etapasDisponiveis: etapas, estacoes: [], maquinas: [], pendentes: []
      };
      else if (url.includes('menu') || url.includes('funcionalidades')) body = menu;
      else if (url.includes('status')) body = { needsCompletion: false, canEdit: false };
      else if (url.includes('features')) body = { enabled: [] };
      else if (url.includes('health')) body = { ok: true, database: 'UP' };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    await page.goto('/os/fluxo/estacoes');
    await page.getByRole('button', { name: /Nova estação/ }).first().click();
    const dialog = page.locator('.ge-station-editor');
    const content = dialog.locator('.p-dialog-content');
    const footer = dialog.locator('.p-dialog-footer');
    await expect(dialog).toBeVisible();
    const list = dialog.locator('.station-stage-list');
    // Move the wheel over the list itself: it must scroll the dialog content.
    await list.evaluate(el => el.scrollIntoView({ block: 'start' }));
    const bounds = await content.boundingBox();
    if (!bounds) throw new Error('Conteúdo do formulário não está visível');
    await page.mouse.move(bounds.x + 40, bounds.y + bounds.height / 2);
    await page.mouse.wheel(0, 5000);
    await expect.poll(() => content.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    for (const name of ['Inspeção final', 'Expedição']) {
      const card = dialog.locator('.station-stage-card').filter({ hasText: name });
      await card.locator('input').check();
      await expect(card.locator('input')).toBeChecked();
      const box = await card.boundingBox();
      const footerBox = await footer.boundingBox();
      expect(box).not.toBeNull(); expect(footerBox).not.toBeNull();
      expect(box!.y + box!.height).toBeLessThanOrEqual(footerBox!.y + 1);
    }
    await expect(footer).toBeInViewport();
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 2)).toBe(true);
  });
}
