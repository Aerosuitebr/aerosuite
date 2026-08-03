/**
 * Executa deploy marketing via CDP (Playwright connectOverCDP ou tab wp-admin).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-marketing-chunks.json'), 'utf8'));

async function findCdp() {
  const urls = [process.env.CURSOR_CDP_URL, process.env.CHROME_WS, 'http://127.0.0.1:9222'].filter(
    Boolean
  );
  for (const base of urls) {
    try {
      const list = await fetch(`${base.replace(/\/$/, '')}/json/list`).then((r) => r.json());
      const page = list.find(
        (t) => t.type === 'page' && t.url && t.url.includes('aerosuite.com.br/wp-admin')
      );
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      const any = list.find((t) => t.type === 'page' && t.url?.includes('aerosuite.com.br'));
      if (any?.webSocketDebuggerUrl) return any.webSocketDebuggerUrl;
    } catch {
      /* next */
    }
  }
  return null;
}

async function evalExpr(page, expr) {
  return page.evaluate(
    async ({ expression }) => {
      let v = eval(expression);
      if (v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expression: expr }
  );
}

const ws = await findCdp();
if (!ws) {
  console.error('NO_CDP');
  process.exit(2);
}

const browser = await pw.chromium.connectOverCDP(ws);
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.error('NO_PAGE');
  process.exit(3);
}

if (!page.url().includes('wp-admin')) {
  await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
}

await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, {
  timeout: 120000,
});

console.log('init');
await evalExpr(page, j.init);

for (let i = 0; i < j.chunks.length; i++) {
  const v = await evalExpr(page, j.chunks[i]);
  if (i === 0 || i === j.chunks.length - 1 || (i + 1) % 10 === 0) {
    console.log(`chunk ${i + 1}/${j.chunks.length}`, JSON.stringify(v));
  }
}

console.log('run deploy...');
const result = await evalExpr(page, j.run);
fs.writeFileSync(path.join(dir, 'marketing-deploy-result.json'), JSON.stringify(result, null, 2));
console.log('DEPLOY_OK', JSON.stringify(result));
await browser.close();
