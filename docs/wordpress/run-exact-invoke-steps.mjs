/**
 * Run all invoke steps sequentially by reading exact JSON params.
 * Uses Playwright connectOverCDP when CURSOR_CDP_URL/CHROME_WS set,
 * otherwise prints NO_CDP and exits 2 (agent should use CallMcpTool).
 *
 * For MCP-only path, agent runs: node run-exact-invoke-steps.mjs --emit-step css-q1
 * which prints exact params JSON to stdout.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));

const STEPS = [
  'css-q1',
  'css-q2',
  'css-q3',
  'css-q4',
  'css-verify',
  'css-finalize',
  'enc-init',
  'enc-0',
  'enc-1',
  'enc-2',
  'enc-3',
  'enc-run',
];

const emitStep = process.argv.indexOf('--emit-step');
if (emitStep >= 0) {
  const name = process.argv[emitStep + 1];
  const file = path.join(dir, `.invoke-${name}.json`);
  process.stdout.write(fs.readFileSync(file, 'utf8'));
  process.exit(0);
}

const cdpUrl = process.env.CHROME_WS || process.env.CURSOR_CDP_URL;
if (!cdpUrl) {
  console.error(JSON.stringify({ error: 'NO_CDP_URL', hint: 'use CallMcpTool with --emit-step output' }));
  process.exit(2);
}

const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.error(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const summary = { tab: page.url(), viewIdNote: 'via CDP', errors: [], cssVerify: null, cssFinalize: null, encRun: null, steps: {} };

async function evalParams(params) {
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression: params.expression, awaitPromise: !!params.awaitPromise }
  );
}

for (const name of STEPS) {
  const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${name}.json`), 'utf8'));
  try {
    const value = await evalParams(params);
    summary.steps[name] = value;
    if (name === 'css-verify') summary.cssVerify = value;
    if (name === 'css-finalize') summary.cssFinalize = value;
    if (name === 'enc-run') summary.encRun = value;
    console.error('OK', name, JSON.stringify(value).slice(0, 160));
  } catch (e) {
    summary.errors.push({ step: name, message: String(e) });
    console.error('FAIL', name, String(e));
    break;
  }
}

fs.writeFileSync(path.join(dir, 'deploy-remaining-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
await browser.close();
