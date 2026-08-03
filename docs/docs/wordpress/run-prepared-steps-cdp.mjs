/**
 * Invoke browser_cdp for each .cdp-prepared-N.json via reading file in-process.
 * Uses child_process to call node subprocess that... 
 * 
 * Actually: reads combined batches and prints instructions.
 * Real execution: node run-prepared-steps-cdp.mjs
 * Uses Playwright if CHROME_WS set, else writes await files for agent MCP loop.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

const viewId = process.argv[2] || '8e6349';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 29);

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 ${JSON.stringify(value)}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return `step5 ${JSON.stringify(value)}`;
  if (n === 6 && !value?.ok) return 'step6';
  if (n === 7 && !value?.ok) return 'step7';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return `step29 ${JSON.stringify(value)}`;
  return null;
}

async function findCdpUrl() {
  for (const url of [
    process.env.CURSOR_CDP_URL,
    process.env.CHROME_WS,
    'http://127.0.0.1:9222',
    'http://127.0.0.1:9223',
  ].filter(Boolean)) {
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/json/list`);
      if (res.ok) {
        const tabs = await res.json();
        const tab = tabs.find((t) => (t.url || '').includes('aerosuite')) || tabs[0];
        if (tab?.webSocketDebuggerUrl) return tab.webSocketDebuggerUrl;
      }
    } catch { /* next */ }
  }
  return null;
}

async function evalPrepared(page, n) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-prepared-${n}.json`), 'utf8'));
  const { expression, awaitPromise } = raw.params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

const results = {};
const errors = [];

const ws = await findCdpUrl();
if (!ws) {
  console.log(JSON.stringify({ error: 'NO_CDP', hint: 'use agent CallMcpTool loop', viewId, start, end }));
  process.exit(2);
}

const browser = await pw.chromium.connectOverCDP(ws, { timeout: 15000 });
const page =
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin')) ||
  browser.contexts().flatMap((c) => c.pages())[0];

if (!page) {
  console.log(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

// Ensure step 0 CSS parts if missing
try {
  const has = await page.evaluate(() => !!(window.__cssParts && window.__cssParts[4]));
  if (!has) {
    const v0 = await evalPrepared(page, 0).catch(async () => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-invoke-0.json'), 'utf8'));
      const { expression, awaitPromise } = raw.params;
      return page.evaluate(async ({ expression, awaitPromise }) => {
        let v = eval(expression);
        if (awaitPromise) v = await v;
        return v;
      }, { expression, awaitPromise: !!awaitPromise });
    });
    results[0] = v0;
  }
} catch (e) {
  errors.push({ step: 0, error: String(e) });
}

for (let n = start; n <= end && !errors.length; n++) {
  try {
    const value = await evalPrepared(page, n);
    results[n] = value;
    fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify({ result: { type: 'object', value } }));
    const fail = checkStep(n, value);
    if (fail) {
      errors.push({ step: n, reason: fail, value });
      break;
    }
    process.stderr.write(`OK ${n}\n`);
  } catch (e) {
    errors.push({ step: n, error: String(e) });
    break;
  }
}

await browser.close().catch(() => {});

const out = {
  viewId: 'a9930e',
  activeViewId: viewId,
  cssFullRun: results[4] ?? null,
  cssVerify: results[5] ?? null,
  cssFinalize: results[6] ?? null,
  encInit: results[7] ?? null,
  enc0: results[13] ?? null,
  enc1: results[19] ?? null,
  enc2: results[25] ?? null,
  enc3: results[28] ?? null,
  encRun: results[29] ?? null,
  errors,
};
console.log(JSON.stringify(out));
process.exit(errors.length ? 1 : 0);
