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

const raw = await admin.evaluate(async () => {
  const p = await wp.apiFetch({ path: '/wp/v2/pages/18?context=edit' });
  return p.content?.raw || '';
});

const live = await fetch(`${ORIGIN}/contato/?t=${Date.now()}`).then((r) => r.text());

const hits = [];
for (const needle of ['327', '12', 'wpforms', 'clearHoneypot']) {
  let i = 0;
  while ((i = live.indexOf(needle, i)) !== -1 && hits.length < 50) {
    hits.push({ needle, at: i, ctx: live.slice(Math.max(0, i - 40), i + 80).replace(/\s+/g, ' ') });
    i += needle.length;
  }
}

const rawWpforms = [];
let j = 0;
while ((j = raw.indexOf('wpforms', j)) !== -1) {
  rawWpforms.push(raw.slice(Math.max(0, j - 60), j + 120));
  j += 7;
}

console.log(JSON.stringify({
  rawLen: raw.length,
  rawWpforms,
  liveCounts: { '327': (live.match(/327/g) || []).length, '12': (live.match(/\b12\b/g) || []).length, wpformsForm12: (live.match(/wpforms-form-12/g) || []).length, wpformsForm327: (live.match(/wpforms-form-327/g) || []).length },
  liveHits: hits.slice(0, 15),
  hasFormTag: live.includes('id="wpforms-form-12"') || live.includes("id='wpforms-form-12'"),
}, null, 2));

await browser.close();
