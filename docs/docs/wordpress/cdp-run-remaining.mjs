/**
 * Runs remaining CDP invocations via Playwright if CURSOR_CDP_URL works,
 * otherwise prints instructions for MCP loop.
 * Also usable: node cdp-run-remaining.mjs --via-playwright
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, 'cdp-exec-state.json');
const listPath = path.join(dir, 'cdp-invocations.jsonl');
const viewId = process.argv.includes('--viewId')
  ? process.argv[process.argv.indexOf('--viewId') + 1]
  : 'a52ddb';

const invocations = fs
  .readFileSync(listPath, 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));

let state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const start = state.next;

async function runPlaywright() {
  const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
  const cdpUrl = process.env.CHROME_WS || process.env.CURSOR_CDP_URL || 'http://127.0.0.1:9222';
  const browser = await pw.chromium.connectOverCDP(cdpUrl);
  const page =
    browser.contexts()[0]?.pages().find((p) => p.url().includes('aerosuite.com.br')) ||
    browser.contexts()[0]?.pages()[0];
  if (!page) throw new Error('no page');

  for (let i = start; i < invocations.length; i++) {
    const inv = invocations[i];
    const value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        let v = eval(expression);
        if (awaitPromise) v = await v;
        return v;
      },
      { expression: inv.expression, awaitPromise: inv.awaitPromise }
    );
    state.results.push({ batch: inv.batch, kind: inv.kind, value });
    state.next = i + 1;
    fs.writeFileSync(statePath, JSON.stringify(state));
    console.log('OK', i, inv.batch, inv.kind, JSON.stringify(value).slice(0, 160));
    if (inv.batch === 'batch-18' || (value && value.urls)) {
      console.log('DONE', JSON.stringify(value));
      await browser.close();
      return value;
    }
  }
  await browser.close();
}

if (process.argv.includes('--via-playwright')) {
  try {
    const final = await runPlaywright();
    process.exit(final ? 0 : 1);
  } catch (e) {
    console.error('playwright failed:', e.message);
    process.exit(2);
  }
}

// Prepare next step for MCP agent
if (state.next >= invocations.length) {
  const last = state.results[state.results.length - 1]?.value;
  console.log('DONE', JSON.stringify(last));
  process.exit(0);
}

const inv = invocations[state.next];
const outPath = path.join(dir, 'cdp-current.json');
fs.writeFileSync(
  outPath,
  JSON.stringify({
    index: state.next,
    total: invocations.length,
    batch: inv.batch,
    kind: inv.kind,
    awaitPromise: inv.awaitPromise,
    expression: inv.expression,
  })
);
state.next += 1;
fs.writeFileSync(statePath, JSON.stringify(state));
fs.writeFileSync(
  path.join(dir, 'cdp-eval-params.json'),
  JSON.stringify({
    method: 'Runtime.evaluate',
    params: {
      expression: inv.expression,
      returnByValue: true,
      awaitPromise: inv.awaitPromise,
    },
    viewId,
  })
);
console.log('INVOKE', state.next - 1, inv.batch, inv.kind, inv.expression.length);
