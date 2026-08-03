/**
 * Auditoria pública do site institucional (sem wp-admin).
 * Uso: node run-site-audit.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://aerosuite.com.br';

async function fetchStatus(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    return {
      url,
      status: res.status,
      ok: res.ok,
      bodyPreview: text.slice(0, 500),
      sitemapDirective: url.endsWith('/robots.txt') ? hasSitemapDirective(text) : undefined,
    };
  } catch (err) {
    return { url, status: 0, ok: false, error: String(err.message || err) };
  }
}

function hasSitemapDirective(body = '') {
  return /^\s*Sitemap:\s*https:\/\/aerosuite\.com\.br\/wp-sitemap\.xml\s*$/im.test(body);
}

async function testWpforms(page) {
  await page.goto(`${ORIGIN}/contato/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.click('#as-consent-accept-all', { timeout: 4000 }).catch(() => {});
  await page.waitForSelector('#wpforms-form-12', { timeout: 30000 });

  if (process.env.AEROSUITE_AUDIT_SUBMIT_FORM !== '1') {
    return {
      status: 200,
      ok: true,
      submitted: false,
      note: 'Formulário renderizado; envio real desativado. Use AEROSUITE_AUDIT_SUBMIT_FORM=1 para o teste transacional.',
      isCriticalError: false,
    };
  }

  await page.fill('#wpforms-12-field_1', 'Audit Test');
  await page.fill('#wpforms-12-field_2', `audit.${Date.now()}@aerosuite.com.br`);
  await page.fill('#wpforms-12-field_5', 'Audit FW');
  await page.fill('#wpforms-12-field_7', '(21) 99999-0000');
  await page.fill('#wpforms-12-field_8', 'Teste auditoria automatizada');
  const trap = await page.$('#wpforms-12-field_3');
  if (trap) await trap.evaluate((el) => { el.value = ''; });

  const capture = page.waitForResponse(
    (r) => r.url().includes('admin-ajax.php') && r.request().method() === 'POST',
    { timeout: 25000 }
  );
  await page.click('#wpforms-submit-12');
  const res = await capture;
  const body = await res.text().catch(() => '');
  return {
    status: res.status(),
    ok: res.ok(),
    submitted: true,
    bodyPreview: body.slice(0, 1200),
    isCriticalError: body.includes('erro crítico') || res.status() >= 500,
  };
}

async function testCalendly(page) {
  await page.goto(`${ORIGIN}/contato/#agendar-demo`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.click('#as-consent-accept-all', { timeout: 4000 }).catch(() => {});
  const iframe = page.locator('iframe[src*="calendly.com"]');
  const count = await iframe.count();
  const src = count > 0 ? await iframe.first().getAttribute('src') : null;
  return { iframeCount: count, iframeSrc: src, ok: count > 0 && !!src };
}

async function testSchema(page) {
  await page.goto(`${ORIGIN}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const parsed = await page.$$eval('script[type="application/ld+json"]', (els) => {
    const types = [];
    let orgLogoUrl = '';
    let hasSiteSections = false;
    for (const el of els) {
      try {
        const j = JSON.parse(el.textContent || '{}');
        const graph = j['@graph'] || [j];
        for (const n of graph) {
          if (n['@type']) types.push(n['@type']);
          if (n['@type'] === 'Organization' && n.logo?.url) orgLogoUrl = n.logo.url;
          if (n['@type'] === 'ItemList' && String(n['@id'] || '').includes('site-sections')) {
            hasSiteSections = true;
          }
        }
      } catch {
        types.push('parse_error');
      }
    }
    return { types, orgLogoUrl, hasSiteSections };
  });
  const blocks = parsed.types;
  const logoOk = /site-icon-512\.png/i.test(parsed.orgLogoUrl);
  return {
    types: [...new Set(blocks)],
    orgLogoUrl: parsed.orgLogoUrl,
    logoOk,
    hasSiteSections: parsed.hasSiteSections,
    ok:
      blocks.some((t) => t === 'SoftwareApplication' || t === 'FAQPage') &&
      logoOk &&
      parsed.hasSiteSections,
  };
}

async function testPageSeoMeta(page, path, { exploreId, keyword }) {
  const bust = path.includes('?') ? '&' : '?';
  await page.goto(`${ORIGIN}${path}${bust}v=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  return page.evaluate(
    ({ exploreId, keyword }) => {
      const desc = document.querySelector('meta#as-seo-meta, meta[name="description"]')?.getAttribute('content') || '';
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
      const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
      const h1Count = document.querySelectorAll('h1').length;
      const title = document.title;
      const bodyTextLength = (document.querySelector('main')?.innerText || document.body.innerText || '').trim().length;
      const emptyImageAlts = [...document.images].filter((img) => !img.hasAttribute('alt')).length;
      const internalLinks = [...document.querySelectorAll('a[href]')].filter((a) => {
        try { return new URL(a.href, location.href).origin === location.origin; } catch { return false; }
      }).length;
      const explore = document.querySelector(`#${exploreId}-title`);
      return {
        descLen: desc.length,
        hasDesc: desc.length >= 110 && desc.length <= 160,
        keywordOk: keyword
      ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(desc)
      : true,
        canonical,
        ogImage,
        ogImageOk: /^https:\/\/aerosuite\.com\.br\/.+\.(webp|png|jpe?g)(\?.*)?$/i.test(ogImage),
        robots,
        titleLen: title.length,
        titleOk: title.length >= 30 && title.length <= 65,
        h1Count,
        h1Ok: h1Count === 1,
        ssrContentOk: bodyTextLength >= 500,
        emptyImageAlts,
        imageAltOk: emptyImageAlts === 0,
        internalLinks,
        internalLinksOk: internalLinks >= 5,
        exploreLinks: document.querySelectorAll('.as-explore-site__list a').length,
        exploreOk: !!explore,
      };
    },
    { exploreId, keyword }
  );
}

const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage();

const [robots, sitemapWp, sitemapYoast, home, obrigado] = await Promise.all([
  fetchStatus(`${ORIGIN}/robots.txt`),
  fetchStatus(`${ORIGIN}/wp-sitemap.xml`),
  fetchStatus(`${ORIGIN}/sitemap_index.xml`),
  fetchStatus(`${ORIGIN}/`),
  fetchStatus(`${ORIGIN}/obrigado/`),
]);

let wpforms = { error: 'skipped' };
let calendly = { error: 'skipped' };
let schema = { error: 'skipped' };
let homeSeo = { error: 'skipped' };
let solucoesSeo = { error: 'skipped' };
let contatoSeo = { error: 'skipped' };
try {
  wpforms = await testWpforms(page);
} catch (err) {
  wpforms = { error: String(err.message || err), ok: false };
}
try {
  calendly = await testCalendly(page);
} catch (err) {
  calendly = { error: String(err.message || err), ok: false };
}
try {
  schema = await testSchema(page);
} catch (err) {
  schema = { error: String(err.message || err), ok: false };
}
try {
  homeSeo = await testPageSeoMeta(page, '/', { exploreId: 'as-explore-home', keyword: 'prontidão' });
  homeSeo.ok = homeSeo.hasDesc && homeSeo.exploreOk && homeSeo.keywordOk && homeSeo.ogImageOk && homeSeo.titleOk && homeSeo.h1Ok && homeSeo.ssrContentOk && homeSeo.imageAltOk && homeSeo.internalLinksOk;
} catch (err) {
  homeSeo = { error: String(err.message || err), ok: false };
}
try {
  solucoesSeo = await testPageSeoMeta(page, '/solucoes/', {
    exploreId: 'as-explore-solucoes',
    keyword: 'FIFO',
  });
  solucoesSeo.ok = solucoesSeo.hasDesc && solucoesSeo.exploreOk && solucoesSeo.keywordOk && solucoesSeo.ogImageOk && solucoesSeo.titleOk && solucoesSeo.h1Ok && solucoesSeo.ssrContentOk && solucoesSeo.imageAltOk && solucoesSeo.internalLinksOk;
} catch (err) {
  solucoesSeo = { error: String(err.message || err), ok: false };
}
try {
  contatoSeo = await testPageSeoMeta(page, '/contato/', {
    exploreId: 'as-explore-contato',
    keyword: 'Calendly',
  });
  contatoSeo.ok = contatoSeo.hasDesc && contatoSeo.exploreOk && contatoSeo.keywordOk && contatoSeo.ogImageOk && contatoSeo.titleOk && contatoSeo.h1Ok && contatoSeo.ssrContentOk && contatoSeo.imageAltOk && contatoSeo.internalLinksOk;
} catch (err) {
  contatoSeo = { error: String(err.message || err), ok: false };
}

const sitemapOk = sitemapWp.ok || sitemapYoast.ok;
const sitemapUrl = sitemapWp.ok ? `${ORIGIN}/wp-sitemap.xml` : sitemapYoast.ok ? `${ORIGIN}/sitemap_index.xml` : null;

const report = {
  at: new Date().toISOString(),
  origin: ORIGIN,
  summary: {
    wpformsOk: wpforms.ok === true && !wpforms.isCriticalError,
    sitemapOk,
    robotsOk: robots.ok && robots.sitemapDirective === true,
    calendlyOk: calendly.ok === true,
    schemaOk: schema.ok === true,
    homeSeoOk: homeSeo.ok === true,
    solucoesSeoOk: solucoesSeo.ok === true,
    contatoSeoOk: contatoSeo.ok === true,
    obrigadoOk: obrigado.ok,
  },
  robots,
  sitemap: { wp: sitemapWp, yoast: sitemapYoast, recommendedUrl: sitemapUrl },
  wpforms,
  calendly,
  schema,
  homeSeo,
  solucoesSeo,
  contatoSeo,
  pages: { home: home.status, obrigado: obrigado.status },
  nextSteps: [],
};

if (!report.summary.wpformsOk) {
  report.nextSteps.push('P0: Corrigir WPForms HTTP 500 — node run-priority-fixes.mjs (requer wp-storage.json)');
}
if (!report.summary.sitemapOk) {
  report.nextSteps.push('P0: Corrigir sitemap — flush permalinks + atualizar plugins via run-priority-fixes.mjs');
}
if (!report.summary.calendlyOk) {
  report.nextSteps.push('P1: Verificar embed Calendly em /contato/ e AEROSUITE_SITE.calendly no deploy');
}
if (!report.summary.schemaOk) {
  report.nextSteps.push('P2: Republicar home — node build-gaps-deploy.mjs && node run-gaps-deploy.mjs');
}
if (!report.summary.homeSeoOk || !report.summary.solucoesSeoOk || !report.summary.contatoSeoOk) {
  report.nextSteps.push('P2: SEO páginas — node build-gaps-deploy.mjs && deploy + plugin perf 1.2.3');
}
report.nextSteps.push('P1: Marcar conversões GA4 — docs/wordpress/GA4-CONVERSOES.md');
report.nextSteps.push('P1: Search Console — docs/GSC-OPERACIONAL.md');
report.nextSteps.push('P1: Autorização Bellows/King — docs/wordpress/PORTFOLIO-AUTORIZACAO-EMAILS.md');

const outPath = path.join(dir, 'site-audit-result.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log('AUDIT_OK', JSON.stringify(report.summary, null, 2));
console.log('Report:', outPath);
await browser.close();

process.exit(
  report.summary.wpformsOk && report.summary.sitemapOk && report.summary.calendlyOk ? 0 : 1
);
