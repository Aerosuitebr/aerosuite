/**
 * Limpeza pós-lançamento: remove plugins fix duplicados, forms WPForms órfãos,
 * verifica /contato/ e grava relatório.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const ORPHAN_FORMS = new Set(['323', '325', '327']);
const FIX_PREFIX = 'aerosuite-wpforms-fix';

const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await ctx.newPage();
const front = await ctx.newPage();

const dismiss = (page) =>
  page.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));

admin.on('dialog', (d) => d.accept());

async function deleteFixPlugins() {
  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await dismiss(admin);

  const before = await admin.evaluate((prefix) =>
    [...document.querySelectorAll(`tr[data-plugin^="${prefix}"]`)].map((tr) => ({
      plugin: tr.dataset.plugin,
      active: tr.classList.contains('active'),
    })), FIX_PREFIX);

  for (let i = 0; i < 20; i++) {
    const step = await admin.evaluate((prefix) => {
      const tr = document.querySelector(`tr[data-plugin^="${prefix}"]`);
      if (!tr) return null;
      const plugin = tr.dataset.plugin;
      tr.querySelector('.deactivate a')?.click();
      return { plugin, action: 'deactivate' };
    }, FIX_PREFIX);
    if (!step) break;
    await admin.waitForTimeout(800);
  }

  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await dismiss(admin);

  const deleted = [];
  for (let i = 0; i < 20; i++) {
    await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await dismiss(admin);
    const plugin = await admin.evaluate((prefix) => {
      const tr = document.querySelector(`tr.inactive[data-plugin^="${prefix}"], tr[data-plugin^="${prefix}"]`);
      if (!tr) return null;
      const p = tr.dataset.plugin;
      tr.querySelector('.delete a')?.click();
      return p;
    }, FIX_PREFIX);
    if (!plugin) break;
    deleted.push(plugin);
    await admin.waitForTimeout(1500);
  }

  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const remaining = await admin.evaluate((prefix) =>
    [...document.querySelectorAll(`tr[data-plugin^="${prefix}"]`)].map((tr) => tr.dataset.plugin), FIX_PREFIX);

  return { before, deleted, remaining };
}

async function deleteOrphanForms() {
  await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wpforms-overview`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await dismiss(admin);

  const found = await admin.evaluate(() =>
    [...document.querySelectorAll('#the-list tr, table.wp-list-table tbody tr')].map((tr) => ({
      id: (tr.querySelector('.column-id')?.textContent || tr.id?.replace('post-', '') || '').trim(),
      title: tr.querySelector('.row-title, .column-primary strong')?.textContent?.trim() || '',
      trashHref: tr.querySelector('span.trash a, a.submitdelete')?.href || null,
    }))
  );

  const targets = found.filter((f) => ORPHAN_FORMS.has(String(f.id)));
  const trashed = [];

  for (const form of targets) {
    if (form.trashHref) {
      await admin.goto(form.trashHref, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
      trashed.push(form.id);
      await admin.waitForTimeout(800);
    }
  }

  return { found: found.map((f) => ({ id: f.id, title: f.title })), trashed };
}

async function checkContatoPage() {
  await admin.goto(`${ORIGIN}/wp-admin/post.php?post=18&action=edit`, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => {});
  const pageMeta = await admin.evaluate(() => {
    const raw = wp?.data?.select('core/editor')?.getEditedPostContent?.() || document.body.innerText;
    return {
      hasForm12: /wpforms id=["']?12["']?/i.test(raw || ''),
      hasForm327: /wpforms id=["']?327["']?/i.test(raw || ''),
      snippet: (raw || '').match(/\[wpforms[^\]]+\]/)?.[0] || null,
    };
  }).catch(() => ({ error: 'page_edit_unavailable' }));

  await front.goto(`${ORIGIN}/contato/?cleanup=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
  await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });
  await front.fill('#wpforms-12-field_1', 'Cleanup Test');
  await front.fill('#wpforms-12-field_2', `cleanup.${Date.now()}@aerosuite.com.br`);
  await front.fill('#wpforms-12-field_8', 'Teste pos limpeza do site');
  await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});
  const [res] = await Promise.all([
    front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
    front.click('#wpforms-submit-12'),
  ]);
  const body = await res.text();
  return {
    pageMeta,
    submit: { status: res.status(), success: body.includes('"success":true') },
  };
}

async function checkPublicDebugLog() {
  try {
    const res = await fetch(`${ORIGIN}/wp-content/uploads/aerosuite-wpforms-debug.log?${Date.now()}`);
    const text = await res.text();
    return { status: res.status, public: res.ok, bytes: text.length, preview: text.slice(0, 120) };
  } catch (e) {
    return { error: String(e.message || e) };
  }
}

const result = {
  at: new Date().toISOString(),
  fixPlugins: await deleteFixPlugins(),
  orphanForms: await deleteOrphanForms(),
  contato: await checkContatoPage(),
  debugLog: await checkPublicDebugLog(),
};

fs.writeFileSync(path.join(dir, 'site-cleanup-result.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();

const ok = result.contato.submit.success && result.fixPlugins.remaining.length === 0;
process.exit(ok ? 0 : 1);
