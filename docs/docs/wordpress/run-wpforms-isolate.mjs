/**
 * Testa envio WPForms com WP Mail SMTP desativado temporariamente (isolamento 500).
 * Reativa o plugin ao final.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'wp-storage.json');
const SMTP_PLUGIN = 'wp-mail-smtp/wp_mail_smtp';

async function submitForm(page) {
  await page.goto('https://aerosuite.com.br/contato/', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await page.click('#as-consent-accept-all', { timeout: 3000 }).catch(() => {});
  await page.waitForSelector('#wpforms-form-12', { timeout: 30000 });
  await page.fill('#wpforms-12-field_1', 'Teste Isolamento');
  await page.fill('#wpforms-12-field_2', 'isolamento@aerosuite.com.br');
  await page.fill('#wpforms-12-field_7', '(21) 99999-0001');
  await page.fill('#wpforms-12-field_8', 'Teste isolamento SMTP');
  const trap = await page.$('#wpforms-12-field_3');
  if (trap) await trap.evaluate((el) => { el.value = ''; });

  const capture = page.waitForResponse(
    (r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST',
    { timeout: 20000 }
  );
  await page.click('#wpforms-submit-12');
  const res = await capture;
  const body = await res.text().catch(() => '');
  return { status: res.status(), body: body.slice(0, 2000), url: page.url() };
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage });
const admin = await context.newPage();
const front = await context.newPage();

await admin.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (admin.url().includes('wp-login')) {
  console.error('SESSION_EXPIRED');
  process.exit(3);
}
await admin.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, {
  timeout: 120000,
});

const baseline = await submitForm(front);

let smtpOff = null;
try {
  await admin.evaluate(async (plugin) => {
    await wp.apiFetch({
      path: '/wp/v2/plugins/' + encodeURIComponent(plugin),
      method: 'POST',
      data: { status: 'inactive' },
    });
  }, SMTP_PLUGIN);
  smtpOff = await submitForm(front);
} finally {
  await admin
    .evaluate(async (plugin) => {
      await wp.apiFetch({
        path: '/wp/v2/plugins/' + encodeURIComponent(plugin),
        method: 'POST',
        data: { status: 'active' },
      });
    }, SMTP_PLUGIN)
    .catch((e) => console.error('REACTIVATE_FAILED', e));
}

const out = { at: new Date().toISOString(), baseline, smtpOff };
fs.writeFileSync(path.join(dir, 'wpforms-isolate-result.json'), JSON.stringify(out, null, 2));
console.log('ISOLATE_OK', JSON.stringify(out, null, 2));
await browser.close();
