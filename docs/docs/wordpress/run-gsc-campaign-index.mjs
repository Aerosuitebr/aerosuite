/**
 * GSC: solicitar indexação das URLs de campanha (orgânico, custo zero).
 * Requer gsc-storage.json (sessão Google) — node run-gsc-logo-index.mjs uma vez se faltar.
 *
 * Uso: node run-gsc-campaign-index.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(dir, 'gsc-storage.json');
const outPath = path.join(dir, 'gsc-campaign-index-result.json');
const ORIGIN = 'https://aerosuite.com.br';
const GSC_RESOURCE = 'sc-domain:aerosuite.com.br';

/** URLs prioritárias para tráfego orgânico + campanhas com UTM */
const URLS = [
  `${ORIGIN}/`,
  `${ORIGIN}/contato/`,
  `${ORIGIN}/solucoes/`,
  `${ORIGIN}/sobre/`,
  `${ORIGIN}/blog/`,
  `${ORIGIN}/casos/`,
  `${ORIGIN}/casos/bellows-servicos-aeronauticos/`,
  `${ORIGIN}/casos/king-do-rio-pecas-aeronauticas/`,
  `${ORIGIN}/aero-suite-vs-planilhas/`,
  `${ORIGIN}/software-gestao-oficina-aeronautica-brasil/`,
  `${ORIGIN}/estoque-pecas-aeronauticas-rastreabilidade/`,
  `${ORIGIN}/ordem-servico-manutencao-aeronaves/`,
  `${ORIGIN}/portal-cliente-oficina-aeronautica/`,
  `${ORIGIN}/conformidade-rastreabilidade-mro-anac/`,
  `${ORIGIN}/substituir-planilhas-gestao-oficina-mro/`,
  `${ORIGIN}/fifo-rastreio-pecas-rbac-145/`,
  `${ORIGIN}/portal-cliente-oficina-menos-ligacao/`,
  `${ORIGIN}/proposta-comercial-alinhada-ordem-servico/`,
  `${ORIGIN}/checklist-digital-auditoria-interna-mro/`,
  `${ORIGIN}/software-mro-ou-erp-oficina-aeronautica/`,
  `${ORIGIN}/radar-mro-anac-fiscalizacao-oficinas-2026/`,
];

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const URLS_TO_INDEX = onlyArg
  ? URLS.filter((u) => u.includes(onlyArg.slice('--only='.length)))
  : URLS;

if (!fs.existsSync(storage)) {
  console.error('MISSING gsc-storage.json — rode node run-gsc-logo-index.mjs e faça login Google uma vez.');
  process.exit(2);
}

const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage, locale: 'pt-BR' });
const page = await context.newPage();
page.on('dialog', (d) => d.accept());

const result = { at: new Date().toISOString(), indexation: [] };

async function requestIndexing(url) {
  const entry = { url, ok: false, notes: [] };
  try {
    await page.goto(
      `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(GSC_RESOURCE)}`,
      { waitUntil: 'domcontentloaded', timeout: 90000 }
    );
    await page.waitForTimeout(1500);
    const input = page.locator(
      'input[type="url"], input[type="search"], input[aria-label*="URL"], input[aria-label*="Inspecionar"]'
    );
    if (!(await input.count())) {
      entry.notes.push('input não encontrado');
      result.indexation.push(entry);
      return;
    }
    await input.first().fill(url);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    const body = await page.locator('body').innerText();
    const requestBtn = page.getByRole('button', {
      name: /solicitar indexação|request indexing|pedir indexação/i,
    });
    if (await requestBtn.count()) {
      await requestBtn.first().click({ timeout: 10000 });
      await page.waitForTimeout(2500);
      entry.ok = true;
      entry.notes.push('indexação solicitada');
    } else if (/indexação solicitada|requested|na fila|queued|já solicit/i.test(body)) {
      entry.ok = true;
      entry.notes.push('já na fila ou solicitada');
    } else if (/cota|quota|limite|limit/i.test(body)) {
      entry.notes.push('cota diária esgotada — parar batch');
      result.indexation.push(entry);
      result.quotaExceeded = true;
      return;
    } else {
      entry.notes.push('botão não encontrado');
    }
  } catch (e) {
    entry.notes.push(String(e.message || e));
  }
  result.indexation.push(entry);
}

for (const url of URLS_TO_INDEX) {
  await requestIndexing(url);
  if (result.quotaExceeded) break;
  await page.waitForTimeout(1200);
}

await context.storageState({ path: storage });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
const ok = result.indexation.filter((x) => x.ok).length;
console.log(`GSC_CAMPAIGN_INDEX ok=${ok}/${result.indexation.length}`, outPath);
await browser.close();
