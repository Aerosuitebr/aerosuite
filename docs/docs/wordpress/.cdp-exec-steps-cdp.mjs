/**
 * Execute steps via Playwright CDP using exact _args-N.json (same as browser_cdp MCP).
 * Saves MCP-shaped .cdp-mcp-results/N.json
 * Usage: node .cdp-exec-steps-cdp.mjs <start> <end> [viewId]
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
const viewId = process.argv[4] || '1031af';
const resultsDir = path.join(dir, '.cdp-mcp-results');

async function connect() {
  for (const port of [9222, 9223, 9333, 19222]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000) });
      const tabs = await res.json();
      const tab =
        tabs.find((t) => (t.url || '').includes('wp-admin/post.php?post=21')) ||
        tabs.find((t) => (t.id || '').includes(viewId)) ||
        tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (tab?.webSocketDebuggerUrl) {
        const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
        const page =
          browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin/post.php')) ||
          browser.contexts()[0]?.pages()[0];
        if (page) return { browser, cdp: await page.context().newCDPSession(page) };
      }
    } catch { /* next */ }
  }
  return null;
}

const conn = await connect();
if (!conn) { console.error(JSON.stringify({ error: 'NO_CDP' })); process.exit(2); }
const { browser, cdp } = conn;
const summary = [];

try {
  for (let n = start; n <= end; n++) {
    const argsPath = path.join(resultsDir, `_args-${n}.json`);
    if (!fs.existsSync(argsPath)) {
      execSync(`node .cdp-agent-one-mcp.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
    }
    const args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
    const resp = await cdp.send('Runtime.evaluate', {
      expression: args.params.expression,
      awaitPromise: args.params.awaitPromise ?? true,
      returnByValue: args.params.returnByValue ?? true,
    });
    const out = { result: resp.result };
    if (resp.exceptionDetails) out.exceptionDetails = resp.exceptionDetails;
    fs.mkdirSync(resultsDir, { recursive: true });
    fs.writeFileSync(path.join(resultsDir, `${n}.json`), JSON.stringify(out), 'utf8');
    const val = resp.result?.value;
    summary.push({ step: n, ok: !resp.exceptionDetails, value: val });
    if (resp.exceptionDetails) {
      console.log(JSON.stringify({ fail: true, step: n, summary }));
      process.exit(1);
    }
    if (n === 4 && (val?.len !== 34708 || !val?.ok)) {
      console.log(JSON.stringify({ fail: true, step: 4, value: val, summary }));
      process.exit(1);
    }
    if (n === 5 && (val?.b64 !== 34708 || !val?.hasGrid)) {
      console.log(JSON.stringify({ fail: true, step: 5, value: val, summary }));
      process.exit(1);
    }
    if (n === 6 && !val?.ok) { console.log(JSON.stringify({ fail: true, step: 6, value: val })); process.exit(1); }
    if (n === 7 && !val?.ok) { console.log(JSON.stringify({ fail: true, step: 7, value: val })); process.exit(1); }
    if (n === 29 && (!val?.ok || !val?.hasHeroV2)) {
      console.log(JSON.stringify({ fail: true, step: 29, value: val }));
      process.exit(1);
    }
  }
  console.log(JSON.stringify({ ok: true, from: start, to: end, summary }));
} finally {
  await browser.close();
}
