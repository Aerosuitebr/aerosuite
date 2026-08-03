/**
 * Execute invoke steps via Playwright CDP (tries /json/list on common ports).
 * Usage: node exec-invoke-steps-cdp.mjs <start> <end> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] || '37aca3';

async function connect() {
  const ports = [9222, 9223, 9333, 19222, 8315, 9229];
  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) });
      const tabs = await res.json();
      const tab =
        tabs.find((t) => (t.url || '').includes('wp-admin')) ||
        tabs.find((t) => String(t.id || '').includes(viewId));
      if (tab?.webSocketDebuggerUrl) {
        const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
        const page =
          browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
          browser.contexts()[0]?.pages()[0];
        if (page) return { browser, cdp: await page.context().newCDPSession(page) };
      }
    } catch {
      /* next */
    }
  }
  return null;
}

function loadArgs(n) {
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-step-${n}.json`), 'utf8'));
  args.viewId = viewId;
  return args;
}

async function evalStep(cdp, n) {
  const exprLen = loadArgs(n).params.expression.length;
  if (exprLen > 3500) {
    execSync(`node mcp-chunk-exec.mjs emit-chunks ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
    const plan = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-chunk-plan-${n}.json`), 'utf8'));
    for (const call of plan.calls) {
      const r = await cdp.send('Runtime.evaluate', {
        expression: call.params.expression,
        awaitPromise: call.params.awaitPromise ?? true,
        returnByValue: call.params.returnByValue ?? true,
      });
      if (r.exceptionDetails) throw new Error(`chunk ${n}: ${JSON.stringify(r.exceptionDetails)}`);
    }
    const fin = JSON.parse(
      execSync(`node mcp-chunk-exec.mjs emit-final ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' })
    );
    const r = await cdp.send('Runtime.evaluate', {
      expression: fin.params.expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(`final ${n}: ${JSON.stringify(r.exceptionDetails)}`);
    return r;
  }
  const args = loadArgs(n);
  return cdp.send('Runtime.evaluate', {
    expression: args.params.expression,
    awaitPromise: args.params.awaitPromise ?? true,
    returnByValue: args.params.returnByValue ?? true,
  });
}

const conn = await connect();
if (!conn) {
  console.log(JSON.stringify({ error: 'NO_CDP', hint: 'use CallMcpTool' }));
  process.exit(2);
}

const { browser, cdp } = conn;
const results = [];

try {
  for (let n = start; n <= end; n++) {
    const resp = await evalStep(cdp, n);
    const out = { result: resp.result };
    if (resp.exceptionDetails) out.exceptionDetails = resp.exceptionDetails;
    fs.writeFileSync(path.join(dir, '.cdp-mcp-result.json'), JSON.stringify(out), 'utf8');
    execSync(`node record-step-result.mjs ${n}`, { cwd: dir, stdio: 'pipe' });
    results.push({ n, value: resp.result?.value });
    if (resp.exceptionDetails) {
      console.log(JSON.stringify({ fail: true, n, results }));
      process.exit(1);
    }
  }
} finally {
  await browser.close().catch(() => {});
}

const summary = execSync(`node agent-cdp-step.mjs summary ${viewId}`, { cwd: dir, encoding: 'utf8' });
console.log(summary.trim());
