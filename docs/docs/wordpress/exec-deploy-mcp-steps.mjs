/**
 * Run all deploy .mcp-deploy-*.json steps via Playwright CDP.
 * Tries common Cursor browser debug endpoints.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const viewId = process.argv[2] || 'b639e2';

const steps = [
  '.mcp-deploy-css-q2.json',
  '.mcp-deploy-css-q3.json',
  '.mcp-deploy-css-q4.json',
  '.mcp-deploy-css-finalize.json',
  '.mcp-deploy-enc-init.json',
  '.mcp-deploy-enc-0.json',
  '.mcp-deploy-enc-1.json',
  '.mcp-deploy-enc-2.json',
  '.mcp-deploy-enc-3.json',
  '.mcp-deploy-enc-run.json',
];

const cdpCandidates = [
  process.env.CURSOR_CDP_URL,
  process.env.CHROME_WS,
  process.env.CHROME_DEBUG_URL,
  'http://127.0.0.1:9222',
  'http://127.0.0.1:9223',
  'http://127.0.0.1:9333',
].filter(Boolean);

function loadArgs(file) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const args = { ...(j.arguments || j) };
  args.viewId = viewId;
  return args;
}

async function evalArgs(page, args) {
  const { expression, awaitPromise } = args.params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

let browser;
let lastErr;
for (const url of cdpCandidates) {
  try {
    browser = await pw.chromium.connectOverCDP(url);
    lastErr = null;
    break;
  } catch (e) {
    lastErr = e;
  }
}
if (!browser) {
  console.error(JSON.stringify({ error: 'CDP_CONNECT_FAILED', message: String(lastErr) }));
  process.exit(2);
}

const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages().find((p) => p.url().includes('aerosuite.com.br')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.error(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const results = [{ step: 'css-q1 (prior)', ok: true, note: 'done via MCP' }];
for (const file of steps) {
  const name = file.replace('.mcp-deploy-', '').replace('.json', '');
  try {
    const value = await evalArgs(page, loadArgs(file));
    results.push({ step: name, ok: true, value });
    console.log(`OK ${name}`, JSON.stringify(value).slice(0, 180));
  } catch (e) {
    results.push({ step: name, ok: false, error: String(e) });
    console.error(`FAIL ${name}`, e.message || e);
    break;
  }
}

const out = { tab: page.url(), results };
fs.writeFileSync(path.join(dir, 'deploy-mcp-batch-results.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
await browser.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
