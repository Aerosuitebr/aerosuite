/**
 * Run steps start..end via Playwright CDP when debug port available.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const start = Number(process.argv[2] ?? 3);
const end = Number(process.argv[3] ?? 29);

async function connect() {
  for (const port of [9222, 9223, 9333, 19222]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) });
      const tabs = await res.json();
      const tab = tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (tab?.webSocketDebuggerUrl) {
        const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
        const page =
          browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
          browser.contexts()[0]?.pages()[0];
        if (page) return { browser, page };
      }
    } catch {
      /* */
    }
  }
  return null;
}

const conn = await connect();
if (!conn) {
  for (let n = start; n <= end; n++) console.log(`MCP_REQUIRED ${n}`);
  process.exit(2);
}

const { browser, page } = conn;
const cdp = await page.context().newCDPSession(page);

for (let n = start; n <= end; n++) {
  const call = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-call-${n}.json`), 'utf8'));
  call.viewId = 'a3746c';
  const resp = await cdp.send('Runtime.evaluate', {
    expression: call.params.expression,
    awaitPromise: call.params.awaitPromise ?? true,
    returnByValue: call.params.returnByValue ?? true,
  });
  const out = { result: resp.result };
  if (resp.exceptionDetails) out.exceptionDetails = resp.exceptionDetails;
  fs.writeFileSync(path.join(dir, `.cdp-mcp-resp-${n}.json`), JSON.stringify(out));
  const proc = spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'record', String(n)], {
    cwd: dir,
    input: JSON.stringify(out),
    encoding: 'utf8',
  });
  process.stdout.write(`step ${n}: ${proc.stdout || ''}`);
  if (proc.status !== 0) {
    process.stderr.write(proc.stderr || '');
    await browser.close();
    process.exit(proc.status || 1);
  }
}
await browser.close();
console.log(JSON.stringify({ ok: true, from: start, to: end }));
