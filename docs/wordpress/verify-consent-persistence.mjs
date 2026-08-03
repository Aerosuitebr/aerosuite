/**
 * Audita banner LGPD: exibição, localStorage e persistência após reload.
 * Uso: node verify-consent-persistence.mjs
 */
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const outPath = path.join(dir, 'consent-audit-result.json');

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const report = { at: new Date().toISOString(), origin: ORIGIN, checks: [] };

function add(id, ok, note) {
  report.checks.push({ id, ok, note });
}

await context.clearCookies();
await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });

const hasScript = await page.evaluate(() => {
  return (
    !!document.querySelector('script#aerosuite-consent') ||
    document.documentElement.innerHTML.includes('as_consent_v1') ||
    typeof window.AEROSUITE_GET_CONSENT === 'function'
  );
});
add('script', hasScript, hasScript ? 'aerosuite-consent carregado' : 'script ausente');

await page.evaluate(() => {
  try {
    localStorage.removeItem('as_consent_v1');
  } catch (_) {}
});
await page.reload({ waitUntil: 'domcontentloaded' });

const bannerVisible = await page.locator('#as-consent-banner').isVisible().catch(() => false);
add('banner_first_visit', bannerVisible, bannerVisible ? 'banner visível sem consent' : 'banner não apareceu');

await page.locator('[data-as-consent="all"]').click({ timeout: 8000 });
const stored = await page.evaluate(() => {
  try {
    return JSON.parse(localStorage.getItem('as_consent_v1') || 'null');
  } catch {
    return null;
  }
});
add(
  'save_all',
  stored?.level === 'all' && !!stored?.at,
  stored ? `level=${stored.level}` : 'localStorage vazio'
);

const htmlAttr = await page.evaluate(() => document.documentElement.getAttribute('data-as-consent'));
add('html_attr', htmlAttr === 'all', `data-as-consent=${htmlAttr || '(ausente)'}`);

const bannerHidden = await page.locator('#as-consent-banner').isHidden().catch(() => true);
add('banner_after_accept', bannerHidden, bannerHidden ? 'banner oculto após aceitar' : 'banner ainda visível');

await page.reload({ waitUntil: 'domcontentloaded' });
const persisted = await page.evaluate(() => {
  try {
    return JSON.parse(localStorage.getItem('as_consent_v1') || 'null');
  } catch {
    return null;
  }
});
const bannerStillHidden = !(await page.locator('#as-consent-banner').isVisible().catch(() => false));
add(
  'persist_reload',
  persisted?.level === 'all' && bannerStillHidden,
  persisted ? `reload ok level=${persisted.level}` : 'consent perdido no reload'
);

report.pass = report.checks.filter((c) => c.ok).length;
report.total = report.checks.length;
report.ok = report.pass === report.total;

writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log('CONSENT_AUDIT', JSON.stringify({ ok: report.ok, pass: report.pass, total: report.total }));
console.log(JSON.stringify(report.checks, null, 2));

await browser.close();
process.exit(report.ok ? 0 : 1);
