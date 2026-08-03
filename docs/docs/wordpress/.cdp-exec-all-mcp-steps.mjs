/**
 * Execute steps start..end: prep, read args, evaluate via Playwright on same page as MCP tab.
 * Uses .cdp-step-N.mcp-ready.json expressions (identical to browser_cdp).
 * Connect via browser debug if available; else prints MCP_REQUIRED per step.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '4610b7';

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return 'step5';
  if (n === 6 && !value?.ok) return 'step6';
  if (n === 7 && !value?.ok) return 'step7';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29';
  return null;
}

async function connect() {
  for (const port of [9222, 9223, 9333, 19222]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) });
      const tabs = await res.json();
      const tab = tabs.find((t) => (t.url || '').includes('wp-admin/post.php'));
      if (tab?.webSocketDebuggerUrl) {
        const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
        const page =
          browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin/post.php')) ||
          browser.contexts()[0]?.pages()[0];
        if (page) return { browser, page };
      }
    } catch {
      /* next */
    }
  }
  return null;
}

const conn = await connect();
if (!conn) {
  for (let n = start; n <= end; n++) {
    execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
    console.log(`MCP_REQUIRED ${n}`);
  }
  process.exit(2);
}

const { browser, page } = conn;
const errors = [];

for (let n = start; n <= end; n++) {
  execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const args = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-current-mcp-args.json'), 'utf8'));
  const { expression, awaitPromise } = args.params;
  try {
    const value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        let v = eval(expression);
        if (awaitPromise) v = await v;
        return v;
      },
      { expression, awaitPromise: !!awaitPromise }
    );
    const out = { result: { type: 'object', value } };
    fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify(out));
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
console.log(JSON.stringify({ done: !errors.length, errors, viewId }));
process.exit(errors.length ? 1 : 0);
