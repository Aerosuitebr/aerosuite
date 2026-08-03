import { createRequire } from 'module';
const pw = createRequire(import.meta.url)('playwright-core');
const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();

async function trySubmit(extra = {}) {
  await page.goto('https://aerosuite.com.br/contato/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.click('#as-consent-accept-all', { timeout: 3000 }).catch(() => {});
  await page.waitForSelector('#wpforms-form-12');
  await page.evaluate((extra) => {
    const form = document.querySelector('#wpforms-form-12');
    const set = (sel, val) => {
      const el = form.querySelector(sel);
      if (el) el.value = val;
    };
    set('#wpforms-12-field_1', extra.f1 ?? 'Teste');
    set('#wpforms-12-field_2', extra.f2 ?? 'teste@aerosuite.com.br');
    set('#wpforms-12-field_3', extra.f3 ?? '');
    set('#wpforms-12-field_5', extra.f5 ?? 'Empresa');
    set('#wpforms-12-field_8', extra.f8 ?? 'Msg');
  }, extra);
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST'),
    page.click('#wpforms-submit-12'),
  ]);
  const body = await res.text();
  return { status: res.status(), success: body.includes('"success":true'), body: body.slice(0, 400) };
}

console.log('simple', await trySubmit());
console.log('honeypot filled', await trySubmit({ f3: 'bot' }));
await browser.close();
