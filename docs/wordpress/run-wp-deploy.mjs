/**
 * Deploy home + CSS via Playwright connectOverCDP (Cursor browser tab).
 * Usage: node run-wp-deploy.mjs [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const cdpUrl = process.env.CHROME_WS || process.env.CURSOR_CDP_URL || 'http://127.0.0.1:9222';

async function evalOnPage(page, expression, awaitPromise = true) {
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise }
  );
}

const browser = await pw.chromium.connectOverCDP(cdpUrl, { timeout: 10000 }).catch((e) => {
  console.error(JSON.stringify({ error: 'CDP_CONNECT', message: e.message }));
  process.exit(2);
});

const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.error(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const summary = { tab: page.url(), home: null, css: null, errors: [] };

try {
  await evalOnPage(page, `(async()=>{window.__homeb64='';return{ok:true};})()`);

  for (const n of [0, 1, 2, 3, 4]) {
    const expr = fs.readFileSync(path.join(dir, `deploy-encoding-${n}.js`), 'utf8').trim();
    const r = await evalOnPage(page, expr);
    summary[`chunk${n}`] = r;
    console.error('OK chunk', n, JSON.stringify(r));
  }

  const runExpr = fs.readFileSync(path.join(dir, 'deploy-encoding-run.js'), 'utf8').trim();
  summary.home = await evalOnPage(page, runExpr);
  console.error('OK home', JSON.stringify(summary.home).slice(0, 300));
} catch (e) {
  summary.errors.push({ step: 'home', message: String(e) });
}

try {
  for (const n of [0, 1, 2, 3, 4, 5, 6]) {
    const f = path.join(dir, `deploy-css-step-${n}.js`);
    if (!fs.existsSync(f)) continue;
    const expr = fs.readFileSync(f, 'utf8').trim();
    await evalOnPage(page, expr);
    console.error('OK css-step', n);
  }
  if (fs.existsSync(path.join(dir, 'deploy-css-fix-finalize.js'))) {
    summary.css = await evalOnPage(page, fs.readFileSync(path.join(dir, 'deploy-css-fix-finalize.js'), 'utf8').trim());
    console.error('OK css finalize', JSON.stringify(summary.css));
  }
} catch (e) {
  summary.errors.push({ step: 'css', message: String(e) });
}

console.log(JSON.stringify(summary, null, 2));
await browser.close();
