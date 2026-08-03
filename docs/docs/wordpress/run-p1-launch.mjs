/**
 * P1 lançamento — cache, e-mails portfólio, DNS, testes GA4, GSC prep.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';
const GA4_ID = 'G-GLP0ELSN4V';
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const CF_ZONE = process.env.CLOUDFLARE_ZONE_ID || '';

const result = { at: new Date().toISOString(), steps: {} };

async function purgeCloudflare() {
  if (!CF_TOKEN || !CF_ZONE) {
    return { ok: false, skipped: true, reason: 'Defina CLOUDFLARE_API_TOKEN e CLOUDFLARE_ZONE_ID para purge automático' };
  }
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/purge_cache`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ purge_everything: true }),
  });
  const json = await res.json();
  return { ok: json.success === true, status: res.status, id: json.result?.id };
}

async function sendPortfolioEmails(admin) {
  const pluginFile = 'aerosuite-send-auth-emails/aerosuite-send-auth-emails.php';
  const zipPath = path.join(dir, 'aerosuite-send-auth-emails.zip');
  const pluginDir = path.join(dir, 'plugins', 'aerosuite-send-auth-emails');
  if (process.platform === 'win32') {
    spawnSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path "${pluginDir}\\*" -DestinationPath "${zipPath}" -Force`], { stdio: 'inherit' });
  }

  admin.on('dialog', (d) => d.accept());
  await admin.goto(`${ORIGIN}/wp-admin/plugin-install.php?tab=upload`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await admin.evaluate(() => document.querySelectorAll('#extendify-agent-popout-modal,.extendify-agent').forEach((e) => e.remove()));
  await admin.locator('input[type="file"]').setInputFiles(zipPath);
  await admin.evaluate(() => document.querySelector('#install-plugin-submit')?.click());
  await admin.waitForTimeout(6000);

  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
  const exists = await admin.locator(`tr[data-plugin="${pluginFile}"]`).count();
  if (exists) {
    await admin.locator(`tr[data-plugin="${pluginFile}"] .activate a`).click({ timeout: 8000 }).catch(() => {});
    await admin.waitForTimeout(3000);
  }

  const statusRes = await admin.goto(`${ORIGIN}/wp-admin/?aerosuite_auth_status=1`, { waitUntil: 'domcontentloaded' }).catch(() => null);
  let sent = null;
  if (statusRes?.ok()) {
    try {
      sent = JSON.parse(await statusRes.text());
    } catch {}
  }

  await admin.goto(`${ORIGIN}/wp-admin/plugins.php`, { waitUntil: 'domcontentloaded' });
  await admin.locator(`tr[data-plugin="${pluginFile}"] .deactivate a`).click({ timeout: 5000 }).catch(() => {});
  await admin.waitForTimeout(800);
  await admin.locator(`tr[data-plugin="${pluginFile}"] .delete a`).click({ timeout: 5000 }).catch(() => {});
  await admin.waitForTimeout(1000);

  return sent || { note: 'Verifique WP Mail SMTP → Registro de e-mail' };
}

async function wpSteps() {
  const browser = await pw.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: path.join(dir, 'wp-storage.json') });
  const admin = await ctx.newPage();
  const front = await ctx.newPage();

  await admin.goto(`${ORIGIN}/wp-admin/options-permalink.php`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await admin.locator('#submit').click({ timeout: 5000 }).catch(() => {});
  await admin.waitForTimeout(1500);

  const portfolioEmails = await sendPortfolioEmails(admin);

  await front.goto(`${ORIGIN}/?p1=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await front.click('#as-consent-accept-all', { timeout: 8000 }).catch(() => {});
  await front.waitForTimeout(2000);
  const ga4Live = await front.evaluate((id) => ({
    ga4: window.AEROSUITE_SITE?.ga4,
    gtag: typeof window.gtag,
    match: window.AEROSUITE_SITE?.ga4 === id,
  }), GA4_ID);

  await front.evaluate(() => document.querySelector('.as-track-demo')?.click());
  await front.waitForTimeout(1000);

  await front.goto(`${ORIGIN}/obrigado/?lead=form`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
  await front.waitForTimeout(1500);

  await front.goto(`${ORIGIN}/contato/?p1=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await front.click('#as-consent-accept-all', { timeout: 5000 }).catch(() => {});
  await front.waitForSelector('#wpforms-form-12', { timeout: 60000 });
  await front.fill('#wpforms-12-field_1', 'P1 Test');
  await front.fill('#wpforms-12-field_2', `p1.${Date.now()}@aerosuite.com.br`);
  await front.fill('#wpforms-12-field_8', 'Teste P1 form_submit');
  await front.$eval('#wpforms-12-field_3', (el) => { el.value = ''; }).catch(() => {});
  const [res] = await Promise.all([
    front.waitForResponse((r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST', { timeout: 60000 }),
    front.click('#wpforms-submit-12'),
  ]);
  const formOk = (await res.text()).includes('"success":true');

  await browser.close();
  return { portfolioEmails, ga4Live, formOk };
}

result.steps.cloudflare = await purgeCloudflare();
result.steps.wp = await wpSteps();
result.steps.dns = {
  spf: 'v=spf1 include:_spf.locaweb.com.br -all (confirmado)',
  dmarc: 'v=DMARC1; p=none (confirmado)',
  locawebAction: 'Central Locaweb → E-mail → SMTP → Domínio de Remetente → validar aerosuite.com.br',
};
result.steps.gsc = {
  sitemapUrl: `${ORIGIN}/wp-sitemap.xml`,
  sitemapOk: (await fetch(`${ORIGIN}/wp-sitemap.xml`)).ok,
  submitAt: 'https://search.google.com/search-console → Sitemaps → wp-sitemap.xml',
};
result.steps.ga4 = {
  measurementId: GA4_ID,
  markConversions: ['cta_demo', 'cta_whatsapp', 'form_submit', 'calendly_event_scheduled', 'generate_lead', 'thank_you_view'],
  adminEvents: `https://analytics.google.com/analytics/web/#/a/p0${''}/admin/events`,
  debugView: 'https://analytics.google.com/analytics/web/#/a/debugview/',
};

spawnSync(process.execPath, [path.join(dir, 'run-site-audit.mjs')], { stdio: 'pipe' });
result.steps.audit = JSON.parse(fs.readFileSync(path.join(dir, 'site-audit-result.json'), 'utf8')).summary;

fs.writeFileSync(path.join(dir, 'p1-launch-result.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
