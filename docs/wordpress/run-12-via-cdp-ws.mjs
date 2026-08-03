/**
 * Execute 12 invoke steps via CDP WebSocket (node-only, no MCP).
 * Usage: node run-12-via-cdp-ws.mjs <wsUrl> [viewIdNote]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

const wsUrl = process.argv[2];
const viewIdNote = process.argv[3] || '165b2f';
const STEPS = [
  'css-q1', 'css-q2', 'css-q3', 'css-q4',
  'css-verify', 'css-finalize',
  'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
];

if (!wsUrl) {
  console.log(JSON.stringify({ error: 'NO_WS', hint: 'node run-12-via-cdp-ws.mjs ws://...' }));
  process.exit(2);
}

const browser = await pw.chromium.connectOverCDP(wsUrl);
const page =
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('post.php')) ||
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.log(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const summary = { viewId: viewIdNote, tab: page.url(), steps: {}, errors: [] };

for (const name of STEPS) {
  const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${name}.json`), 'utf8'));
  try {
    const value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        let v = eval(expression);
        if (awaitPromise) v = await v;
        return v;
      },
      { expression: params.expression, awaitPromise: !!params.awaitPromise }
    );
    summary.steps[name] = value;
    fs.writeFileSync(
      path.join(dir, '.cdp-current-mcp-result.json'),
      JSON.stringify({ result: { type: 'object', value } })
    );
    process.stderr.write(`OK ${name} ${JSON.stringify(value).slice(0, 120)}\n`);
    if (name === 'css-verify' && (value?.b64 !== 34708 || !value?.hasGrid)) {
      summary.errors.push({ step: name, value, reason: 'verify mismatch' });
      break;
    }
    if (name === 'css-finalize' && !value?.ok) {
      summary.errors.push({ step: name, value, reason: 'finalize failed' });
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
