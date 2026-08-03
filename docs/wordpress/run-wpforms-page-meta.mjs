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

const meta = await admin.evaluate(async () => {
  const p = await wp.apiFetch({ path: '/wp/v2/pages/18?context=edit' });
  return {
    template: p.template,
    meta: p.meta,
    excerpt: p.excerpt?.raw?.slice(0, 200),
    blocks: (p.content?.raw || '').match(/<!-- wp:[^\s]+/g)?.slice(0, 30),
    shortcodes: (p.content?.raw || '').match(/\[[^\]]+\]/g)?.filter((s) => /wpforms|kadence|shortcode/i.test(s)),
  };
});

const live = await fetch(`${ORIGIN}/contato/?t=${Date.now()}`).then((r) => r.text());
const formIdx = live.indexOf('<form');
const formBlock = formIdx >= 0 ? live.slice(formIdx, formIdx + 3500) : null;
const asContact = live.match(/as-contact[^"']{0,80}/g)?.slice(0, 10);

console.log(JSON.stringify({ meta, asContact, formBlockStart: formBlock?.slice(0, 1200) }, null, 2));
await browser.close();
