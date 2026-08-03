/**
 * Run steps start..end: read .cdp-call-N.json, evaluate via page from Playwright
 * connected to Cursor browser when CDP list is available; else exit 2.
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
const viewId = process.argv[4] ?? 'a3746c';

async function connect() {
  const ports = [9222, 9223, 9333, 19222, 8315, 9229];
  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, {
        signal: AbortSignal.timeout(3000),
      });
      const tabs = await res.json();
      if (!tabs?.length) continue;
      const tab =
        tabs.find((t) => (t.url || '').includes('wp-admin')) ||
        tabs[0];
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const pages = browser.contexts().flatMap((c) => c.pages());
      const page =
        pages.find((p) => (p.url() || '').includes('wp-admin')) || pages[0];
      if (page) return { browser, page, cdp: await page.context().newCDPSession(page) };
    } catch {
      /* try next */
    }
  }
  return null;
}

const conn = await connect();
if (!conn) {
  console.error('NO_CDP');
  process.exit(2);
}

const { browser, cdp } = conn;

for (let n = start; n <= end; n++) {
  const call = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-call-${n}.json`), 'utf8'));
  const resp = await cdp.send('Runtime.evaluate', {
    expression: call.params.expression,
    awaitPromise: call.params.awaitPromise ?? true,
    returnByValue: call.params.returnByValue ?? true,
  });
  const out = { result: resp.result };
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
