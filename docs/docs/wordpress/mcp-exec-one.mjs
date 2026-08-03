/**
 * Execute one invoke step via CDP HTTP if available, else exit 2 for MCP fallback.
 * Usage: node mcp-exec-one.mjs <n> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '37aca3';
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

async function connect() {
  for (const port of [9222, 9223, 9333, 19222, 8315, 9229, 4567, 65123]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1500) });
      const tabs = await res.json();
      const tab = tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (tab?.webSocketDebuggerUrl) {
        const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
        const page = browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin'));
        if (page) return { browser, cdp: await page.context().newCDPSession(page) };
      }
    } catch {}
  }
  return null;
}

async function evalExpr(cdp, expression, awaitPromise = true) {
  return cdp.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
}

async function runChunked(cdp, n) {
  const { execSync } = await import('child_process');
  execSync(`node mcp-chunk-exec.mjs emit-chunks ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const plan = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-chunk-plan-${n}.json`), 'utf8'));
  for (const call of plan.calls) {
    const r = await evalExpr(cdp, call.params.expression, call.params.awaitPromise);
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  }
  const fin = JSON.parse(execSync(`node mcp-chunk-exec.mjs emit-final ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' }));
  return evalExpr(cdp, fin.params.expression, fin.params.awaitPromise);
}

const conn = await connect();
if (!conn) process.exit(2);
const { browser, cdp } = conn;
try {
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-step-${n}.json`), 'utf8'));
  const exprLen = args.params.expression.length;
  const resp = exprLen > 3500 ? await runChunked(cdp, n) : await evalExpr(cdp, args.params.expression, args.params.awaitPromise);
  const out = { result: resp.result };
  if (resp.exceptionDetails) out.exceptionDetails = resp.exceptionDetails;
  fs.writeFileSync(path.join(dir, '.cdp-mcp-result.json'), JSON.stringify(out), 'utf8');
  console.log(JSON.stringify({ ok: !resp.exceptionDetails, value: resp.result?.value }));
} finally {
  await browser.close().catch(() => {});
}
