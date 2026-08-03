import { createRequire } from 'module';
const pw = createRequire(import.meta.url)('playwright-core');
const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();

async function submit(label, fillFn) {
  await page.goto('https://aerosuite.com.br/contato/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.click('#as-consent-accept-all', { timeout: 3000 }).catch(() => {});
  await page.waitForSelector('#wpforms-form-12');
  await fillFn(page);
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST'),
    page.click('#wpforms-submit-12'),
  ]);
  const body = await res.text();
  return { label, success: body.includes('"success":true'), body: body.slice(0, 300) };
}

const tests = [
  ['flat fields', async (page) => {
    await page.fill('#wpforms-12-field_1', 'Teste');
    await page.fill('#wpforms-12-field_2', 'teste@aerosuite.com.br');
  }],
  ['name subfields inject', async (page) => {
    await page.evaluate(() => {
      const form = document.querySelector('#wpforms-form-12');
      const add = (name, val) => {
        const i = document.createElement('input');
        i.type = 'hidden';
        i.name = name;
        i.value = val;
        form.appendChild(i);
      };
      add('wpforms[fields][1][first]', 'Teste');
      add('wpforms[fields][1][last]', 'Manual');
      document.querySelector('#wpforms-12-field_2').value = 'teste@aerosuite.com.br';
    });
  }],
];

for (const [label, fn] of tests) {
  console.log(await submit(label, fn));
}
await browser.close();
