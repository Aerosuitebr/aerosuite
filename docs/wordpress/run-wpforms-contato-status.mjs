/**
 * Estado atual: plugins, WP Mail SMTP, WPForms contato.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const ORIGIN = 'https://aerosuite.com.br';

if (!fs.existsSync(storage)) {
  console.error('MISSING_SESSION', storage);
  process.exit(2);
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();

await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
const plugins = await admin.evaluate(() =>
  [...document.querySelectorAll('#the-list tr[data-plugin]')].filter((tr) =>
    /wpforms|wp-mail-smtp|aerosuite-wpforms/.test(tr.dataset.plugin || '')
  ).map((tr) => ({
    plugin: tr.dataset.plugin,
    active: tr.classList.contains('active'),
    version: tr.querySelector('.plugin-version-author-uri')?.textContent?.trim(),
  }))
);

await admin.goto(`${ORIGIN}/wp-admin/admin.php?page=wp-mail-smtp`, { waitUntil: 'domcontentloaded', timeout: 120000 });
const smtp = await admin.evaluate(() => {
  const text = document.body.innerText;
  const fromMatch = text.match(/From Email[\s\S]{0,80}?([^\s@]+@[^\s@]+)/i);
  return {
    url: location.href,
    title: document.title,
    snippet: text.slice(0, 2500).replace(/\s+/g, ' '),
    fromGuess: fromMatch?.[1] || null,
    hasContato: /contato@aerosuite\.com\.br/i.test(text),
  };
});

await front.goto(`${ORIGIN}/contato/?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
const hasForm = await front.waitForSelector('#wpforms-form-12', { timeout: 45000 }).then(() => true).catch(() => false);

let submit = { skipped: !hasForm };
if (hasForm) {
  await front.fill('#wpforms-12-field_1', 'Contato Email Test');
  await front.fill('#wpforms-12-field_2', `contato.test.${Date.now()}@aerosuite.com.br`);
  await front.fill('#wpforms-12-field_8', 'Teste apos criar caixa contato@');
  await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});
  const [res] = await Promise.all([
    front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
    front.click('#wpforms-submit-12'),
  ]);
  const body = await res.text();
  submit = { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 600) };
}

const out = { plugins, smtp, submit };
fs.writeFileSync(path.join(dir, 'wpforms-contato-email-status.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
process.exit(submit.success ? 0 : 1);
