import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
const admin = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/post.php?post=18&action=edit`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, { timeout: 120000 });

const rest = await admin.evaluate(async () => {
  const edit = await wp.apiFetch({ path: '/wp/v2/pages/18?context=edit' });
  const view = await wp.apiFetch({ path: '/wp/v2/pages/18' });
  const rendered = view.content?.rendered || '';
  const raw = edit.content?.raw || '';
  const idx = rendered.indexOf('wpforms');
  return {
    slug: edit.slug,
    status: edit.status,
    modified: edit.modified,
    rawHas327: raw.includes('327'),
    rawHas12: /wpforms id=.12/.test(raw),
    renderedHas327: rendered.includes('wpforms-form-327'),
    renderedHas12: rendered.includes('wpforms-form-12'),
    renderedSnippet: idx >= 0 ? rendered.slice(idx, idx + 250) : null,
  };
});

const live = await fetch(`${ORIGIN}/contato/?t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } }).then((r) => r.text());
const idx = live.indexOf('wpforms-form');
const plugins = await admin.evaluate(() =>
  [...document.querySelectorAll('#the-list tr[data-plugin].active')].map((tr) => ({
    name: tr.querySelector('.plugin-title strong')?.textContent?.trim(),
    plugin: tr.dataset.plugin,
  }))
);

console.log(JSON.stringify({
  rest,
  liveHas327: live.includes('wpforms-form-327'),
  liveHas12: live.includes('wpforms-form-12'),
  liveSnippet: idx >= 0 ? live.slice(idx, idx + 250) : null,
  activePlugins: plugins.map((p) => p.name),
}, null, 2));

await browser.close();
