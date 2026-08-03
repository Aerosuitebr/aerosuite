import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const ORIGIN = 'https://aerosuite.com.br';

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await page.waitForSelector('#wpforms-form-12', { timeout: 60000 });

const result = await page.evaluate(async () => {
  const form = document.querySelector('#wpforms-form-12');
  const token = form.querySelector('[name="wpforms[token]"]')?.value || '';
  const email = `subfix.${Date.now()}@aerosuite.com.br`;
  const body = new URLSearchParams();
  body.set('action', 'wpforms_submit');
  body.set('wpforms[id]', '12');
  body.set('wpforms[author]', '1');
  body.set('wpforms[post_id]', '18');
  body.set('wpforms[token]', token);
  body.set('wpforms[fields][1][first]', 'Subfix Test');
  body.set('wpforms[fields][1][last]', '');
  body.set('wpforms[fields][2]', email);
  body.set('wpforms[fields][3]', '');
  body.set('wpforms[fields][8]', 'Teste subfields name');
  body.set('page_id', '18');
  body.set('page_url', `${location.origin}/contato/`);
  body.set('page_title', document.title);

  const res = await fetch('/wp-admin/admin-ajax.php', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: body.toString(),
  });
  const text = await res.text();
  return { status: res.status, success: text.includes('"success":true'), body: text.slice(0, 1000), email };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.success ? 0 : 1);
