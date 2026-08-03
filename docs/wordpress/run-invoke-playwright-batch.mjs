/**
 * Run 12 invoke steps via Playwright CDP (skips steps already in results file).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import http from 'http';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

const STEPS = [
  'css-q1', 'css-q2', 'css-q3', 'css-q4',
  'css-verify', 'css-finalize',
  'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
];
const viewId = process.argv[2] || '165b2f';
const startFrom = process.argv[3] || 'css-q3';

async function discoverCdpUrl() {
  const env = process.env.CURSOR_CDP_URL || process.env.CHROME_WS;
  if (env) return env;
  const version = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/version', (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
  return version.webSocketDebuggerUrl;
}

const cdpUrl = await discoverCdpUrl().catch(() => null);
if (!cdpUrl) {
  console.log(JSON.stringify({ error: 'NO_CDP' }));
  process.exit(2);
}

const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('post.php')) ||
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.log(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const summary = { viewId, tab: page.url(), steps: {}, errors: [] };
let started = startFrom === 'all';
for (const name of STEPS) {
  if (!started) {
    if (name === startFrom) started = true;
    else continue;
  }
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
    console.error(`OK ${name}`, JSON.stringify(value).slice(0, 200));
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
