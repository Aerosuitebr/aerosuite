import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const ORIGIN = 'https://aerosuite.com.br';

async function submitViaFetch(page, label) {
  return page.evaluate(async (label) => {
    const form = document.querySelector('#wpforms-form-12');
    if (!form) return { label, error: 'no form' };
    const token = form.querySelector('[name="wpforms[token]"]')?.value || '';
    const email = `fetch.${Date.now()}@aerosuite.com.br`;
    const body = new URLSearchParams();
    body.set('action', 'wpforms_submit');
    body.set('wpforms[id]', '12');
    body.set('wpforms[post_id]', form.querySelector('[name="wpforms[post_id]"]')?.value || '0');
    body.set('wpforms[token]', token);
    body.set('wpforms[fields][1]', 'Fetch Test');
    body.set('wpforms[fields][2]', email);
    body.set('wpforms[fields][3]', '');
    body.set('wpforms[fields][8]', 'fetch test');
    body.set('page_id', document.querySelector('[name="page_id"]')?.value || '0');
    body.set('page_url', location.href);
    body.set('page_title', document.title);
    const res = await fetch('/wp-admin/admin-ajax.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body.toString(),
    });
    const text = await res.text();
    return {
      label,
      url: location.href,
      token: token ? token.slice(0, 8) + '…' : null,
      postId: form.querySelector('[name="wpforms[post_id]"]')?.value,
      status: res.status,
      success: text.includes('"success":true'),
      body: text.slice(0, 400),
    };
  }, label);
}

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(`${ORIGIN}/?wpforms_form_preview=12`, { waitUntil: 'domcontentloaded', timeout: 120000 });
const preview = await submitViaFetch(page, 'preview');

await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
await page.waitForSelector('#wpforms-form-12', { timeout: 60000 });
const contato = await submitViaFetch(page, 'contato');

console.log(JSON.stringify({ preview, contato }, null, 2));
await browser.close();
process.exit(contato.success ? 0 : 1);
