/**
 * Run 12 deploy invoke steps via Playwright CDP or print payloads for MCP.
 * Usage: node run-12-invoke-steps.mjs [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '165b2f';
const STEPS = [
  'css-q1', 'css-q2', 'css-q3', 'css-q4',
  'css-verify', 'css-finalize',
  'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
];
const cdpUrl = process.env.CURSOR_CDP_URL || process.env.CHROME_WS;
const summary = { viewId, steps: {}, errors: [] };

async function evalStep(page, name) {
  const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${name}.json`), 'utf8'));
  const { expression, awaitPromise, returnByValue } = params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise, returnByValue: !!returnByValue }
  );
}

if (!cdpUrl) {
  console.log(JSON.stringify({ mode: 'NO_CDP', viewId, steps: STEPS }));
  process.exit(2);
}

const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('aerosuite')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.log(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

for (const name of STEPS) {
  try {
    const value = await evalStep(page, name);
    summary.steps[name] = value;
    fs.writeFileSync(
      path.join(dir, '.cdp-current-mcp-result.json'),
      JSON.stringify({ result: { type: 'object', value } })
    );
    console.error(`OK ${name}`, JSON.stringify(value).slice(0, 120));
    if (name === 'css-verify' && (value?.b64 !== 34708 || !value?.hasGrid)) {
      summary.errors.push({ step: name, value, reason: 'css-verify mismatch' });
      break;
    }
    if (name === 'css-finalize' && !value?.ok) {
      summary.errors.push({ step: name, value, reason: 'css-finalize failed' });
      break;
    }
    if (name === 'enc-run' && (!value?.ok || !value?.hasHeroV2)) {
      summary.errors.push({ step: name, value, reason: 'enc-run failed' });
      break;
    }
  } catch (e) {
    summary.errors.push({ step: name, error: String(e) });
    break;
  }
}

summary.cssVerify = summary.steps['css-verify'] ?? null;
summary.cssFinalize = summary.steps['css-finalize'] ?? null;
summary.encRun = summary.steps['enc-run'] ?? null;
fs.writeFileSync(path.join(dir, 'deploy-invoke-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
