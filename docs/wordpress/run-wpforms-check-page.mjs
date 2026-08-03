import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const ORIGIN = 'https://aerosuite.com.br';

const fetchHtml = await fetch(`${ORIGIN}/contato/?t=${Date.now()}`).then((r) => r.text());

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
const pwHtml = await page.content();

function analyze(label, html) {
  return {
    label,
    hasForm12: html.includes('id="wpforms-form-12"'),
    hasForm327: html.includes('id="wpforms-form-327"'),
    formTags: (html.match(/<form[^>]*>/g) || []).filter((f) => f.includes('wpforms')),
    shortcodeVisible: html.includes('[wpforms'),
    wpformsDiv: html.includes('wpforms-container'),
  };
}

console.log(JSON.stringify({
  fetch: analyze('fetch', fetchHtml),
  playwright: analyze('playwright', pwHtml),
}, null, 2));

await browser.close();
