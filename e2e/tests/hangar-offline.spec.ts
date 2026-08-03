import { test, expect, type Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

const QUEUE_LS_KEY = 'aerosuite.hangar.queue';
const IDB_NAME = 'aerosuite-hangar';

async function readLocalQueue(page: Page): Promise<unknown[]> {
  return page.evaluate((key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as unknown[]) : [];
    } catch {
      return [];
    }
  }, QUEUE_LS_KEY);
}

async function readIdbQueue(page: Page): Promise<unknown[] | null> {
  return page.evaluate(async (dbName) => {
    if (typeof indexedDB === 'undefined') {
      return null;
    }
    return new Promise<unknown[] | null>((resolve) => {
      const req = indexedDB.open(dbName, 1);
      req.onerror = () => resolve(null);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('queue')) {
          resolve(null);
          return;
        }
        const tx = db.transaction('queue', 'readonly');
        const get = tx.objectStore('queue').get('default');
        get.onsuccess = () => resolve((get.result as unknown[]) ?? []);
        get.onerror = () => resolve(null);
      };
    });
  }, IDB_NAME);
}

async function openFirstHangarOs(page: Page): Promise<boolean> {
  await page.goto('/hangar');
  await expect(page.locator('app-hangar-job-card')).toBeVisible({ timeout: 20_000 });
  const cards = page.locator('.os-cards li');
  await expect
    .poll(async () => cards.count(), { timeout: 20_000, message: 'lista hangar deve carregar' })
    .toBeGreaterThan(0);
  await cards.first().click();
  await expect(page.locator('.os-summary')).toBeVisible({ timeout: 15_000 });
  return true;
}

async function goHorasTab(page: Page) {
  const tab = page.locator('.p-tabview-nav li').nth(1);
  await tab.click();
  await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 10_000 });
}

test.describe('Hangar P5.2 — offline IndexedDB, fila e sync', () => {
  test('hangar-sw.js disponível para PWA', async ({ request }) => {
    const res = await request.get('/hangar-sw.js');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('aerosuite-hangar');
  });

  test('apontamento offline enfileira (localStorage + IndexedDB) e sincroniza online', async ({
    page,
    context,
  }) => {
    await loginAsAdmin(page);
    const hasOs = await openFirstHangarOs(page);
    test.skip(!hasOs, 'Nenhuma OS aberta no tenant de teste');

    await goHorasTab(page);
    const marker = `E2E-OFFLINE-${Date.now()}`;
    await page.locator('.form-grid .field.wide input[pinputtext]').first().fill(marker);

    await context.setOffline(true);
    await page.locator('button').filter({ hasText: /Registrar horas|Log hours|Enregistrer heures/i }).click();
    await expect(page.locator('.p-toast-message, .p-message-warn').first()).toBeVisible({ timeout: 10_000 });

    await expect
      .poll(async () => (await readLocalQueue(page)).length, { timeout: 5_000 })
      .toBeGreaterThan(0);

    const lsQueue = await readLocalQueue(page);
    const apont = lsQueue.find(
      (op) =>
        typeof op === 'object' &&
        op !== null &&
        (op as { kind?: string }).kind === 'apontamento' &&
        JSON.stringify(op).includes(marker)
    );
    expect(apont).toBeTruthy();

    const idbQueue = await readIdbQueue(page);
    if (idbQueue) {
      expect(idbQueue.length).toBeGreaterThan(0);
    }

    await context.setOffline(false);

    const syncBtn = page.locator('button').filter({
      hasText: /Sincronizar agora|Sync now|Synchroniser maintenant/i,
    });
    if (await syncBtn.isVisible({ timeout: 8_000 })) {
      await syncBtn.click();
    }

    await expect
      .poll(async () => (await readLocalQueue(page)).length, {
        timeout: 25_000,
        message: 'fila offline deve esvaziar após voltar online',
      })
      .toBe(0);
  });

  test('lista de OS abertas permanece visível offline após cache', async ({ page, context }) => {
    await loginAsAdmin(page);
    await page.goto('/hangar');
    const cards = page.locator('.os-cards li');
    const countOnline = await cards.count();
    test.skip(countOnline === 0, 'Nenhuma OS aberta no tenant de teste');

    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('app-hangar-job-card')).toBeVisible({ timeout: 20_000 });
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(async () => cards.count(), { timeout: 10_000 })
      .toBeGreaterThan(0);

    await context.setOffline(false);
  });
});
