/**
 * Executa deploy estoque via CDP lendo steps-estoque-deploy/*.json
 * Conecta ao Chrome na porta 9222 (iniciar: chrome --remote-debugging-port=9222)
 * OU usa WP_HEADED=1 para login manual.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));

async function getPage() {
  for (const port of [9222, 9223, 9333]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) });
      const tabs = await res.json();
      const tab =
        tabs.find((t) => (t.url || '').includes('wp-admin/post.php')) ||
        tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page };
    } catch {
      /* next */
    }
  }
  return null;
}

const stepDir = path.join(dir, 'steps-estoque-deploy');
const files = fs.readdirSync(stepDir).filter((f) => f.endsWith('.json')).sort();

let conn = await getPage();
let browser = conn?.browser;
let page = conn?.page;

if (!page) {
  const storage = path.join(dir, 'wp-storage.json');
  browser = await pw.chromium.launch({ headless: process.env.WP_HEADED === '0' });
  const ctx = await browser.newContext(fs.existsSync(storage) ? { storageState: storage } : {});
  page = await ctx.newPage();
  await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (page.url().includes('wp-login')) {
    console.error('NOT_LOGGED_IN — abra wp-admin no browser ou faça login com WP_HEADED=1');
    await browser.close();
    process.exit(2);
  }
}

async function runExpr(expr) {
  return page.evaluate(async (code) => {
    // eslint-disable-next-line no-eval
    return await eval('(' + code + ')');
  }, expr);
}

const results = [];
for (const f of files) {
  const payload = JSON.parse(fs.readFileSync(path.join(stepDir, f), 'utf8'));
  const expr = payload.params.expression;
  const r = await runExpr(expr);
  results.push({ step: f, r });
  console.log('OK', f, JSON.stringify(r).slice(0, 200));
}

fs.writeFileSync(path.join(dir, 'estoque-deploy-result.json'), JSON.stringify(results, null, 2));
if (browser && !conn) await browser.close();
console.log('DEPLOY_DONE');
