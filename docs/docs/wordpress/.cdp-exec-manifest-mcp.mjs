/**
 * Runs manifest steps via browser_cdp by writing invoke payloads for an external MCP caller.
 * This script uses page.evaluate when CURSOR_CDP_URL is available; otherwise prints instructions.
 *
 * For agent: node .cdp-exec-manifest-mcp.mjs run 3d225d 0 29
 * Reads .cdp-step-N.mcp-ready.json, evaluates on page if CDP available.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[3] || '4a20d1';
const start = Number(process.argv[4] ?? 1);
const end = Number(process.argv[5] ?? 29);
const requestedViewId = 'a9930e';

const manifest = JSON.parse(
  fs.readFileSync(path.join(dir, '.cdp-step-manifest.json'), 'utf8')
);

const summaryKeys = {
  4: 'cssFullRun',
  5: 'cssVerify',
  6: 'cssFinalize',
  7: 'encInit',
  13: 'enc0',
  19: 'enc1',
  25: 'enc2',
  28: 'enc3',
  29: 'encRun',
};

const summary = {
  viewId: requestedViewId,
  activeViewId: viewId,
  cssFullRun: null,
  cssVerify: null,
  cssFinalize: null,
  encInit: null,
  enc0: null,
  enc1: null,
  enc2: null,
  enc3: null,
  encRun: null,
  errors: [],
};

async function evalStep(page, args) {
  const { expression, awaitPromise } = args.params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      const fn = (0, eval)(expression.startsWith('(') ? expression : `(${expression})`);
      return awaitPromise ? await fn() : fn();
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708))
    return 'cssFullRun checkpoint';
  if (i === 5 && !value?.hasGrid) return 'cssVerify hasGrid';
  if (i === 6 && !value?.ok) return 'cssFinalize ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'encRun checkpoint';
  return null;
}

if (cmd === 'prepare-range') {
  for (const item of manifest) {
    if (item.i < start || item.i > end) continue;
    const ready = path.join(dir, `.cdp-step-${item.i}.mcp-ready.json`);
    const args = JSON.parse(fs.readFileSync(ready, 'utf8'));
    args.viewId = viewId;
    fs.writeFileSync(path.join(dir, `.cdp-step-${item.i}.invoke-now.json`), JSON.stringify(args));
  }
  console.log('prepared', start, end);
  process.exit(0);
}

if (cmd === 'run') {
  const cdpUrl = process.env.CURSOR_CDP_URL || process.env.CHROME_WS;
  if (!cdpUrl) {
    console.error(JSON.stringify({ error: 'NO_CDP', hint: 'use CallMcpTool browser_cdp' }));
    process.exit(2);
  }
  const require = createRequire(import.meta.url);
  let pw;
  try {
    pw = require('playwright-core');
  } catch {
    pw = require('playwright');
  }
  const browser = await pw.chromium.connectOverCDP(cdpUrl, { timeout: 10000 });
  const page =
    browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
    browser.contexts()[0]?.pages()[0];
  if (!page) {
    console.log(JSON.stringify({ error: 'NO_PAGE', summary }));
    process.exit(3);
  }
  for (const item of manifest) {
    if (item.i < start || item.i > end) continue;
    const ready = path.join(dir, `.cdp-step-${item.i}.mcp-ready.json`);
    const args = JSON.parse(fs.readFileSync(ready, 'utf8'));
    args.viewId = viewId;
    try {
      const value = await evalStep(page, args);
      const key = summaryKeys[item.i];
      if (key) summary[key] = value;
      const fail = checkStep(item.i, value);
      if (fail) {
        summary.errors.push({ step: item.i, value, reason: fail });
        break;
      }
    } catch (e) {
      summary.errors.push({ step: item.i, error: String(e) });
      break;
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(dir, '.cdp-manifest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
  process.exit(summary.errors.length ? 1 : 0);
}

console.error('usage: prepare-range|run');
process.exit(2);
