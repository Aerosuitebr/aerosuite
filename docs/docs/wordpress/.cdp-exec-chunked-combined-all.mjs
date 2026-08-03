/**
 * Run chunked combined CDP payloads sequentially via page.evaluate (Playwright CDP).
 * Saves .cdp-chunk-resp-{i}.json in MCP result shape.
 * Usage: node .cdp-exec-chunked-combined-all.mjs [viewIdHint]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

async function connect() {
  const wsEnv = process.env.CDP_WS_URL;
  if (wsEnv) {
    const browser = await pw.chromium.connectOverCDP(wsEnv);
    const page =
      browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
      browser.contexts()[0]?.pages()[0];
    if (page) return { browser, page };
  }
  for (const port of [9222, 9223, 9333, 19222, 8315, 9229, 18792]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2500) });
      const tabs = await res.json();
      const tab =
        tabs.find((t) => (t.url || '').includes('wp-admin/post.php?post=21')) ||
        tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page, port };
    } catch {
      /* */
    }
  }
  return null;
}

async function evalExpr(page, expression, awaitPromise) {
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise && v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

const conn = await connect();
if (!conn) {
  console.error(JSON.stringify({ error: 'NO_CDP', hint: 'use CallMcpTool browser_cdp' }));
  process.exit(2);
}

const { browser, page, port } = conn;

for (let i = 0; i <= 16; i++) {
  const payloadPath = path.join(dir, `.cdp-chunk-payload-${i}.json`);
  const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  const { expression, awaitPromise, returnByValue } = payload.params;
  const value = await evalExpr(page, expression, awaitPromise);
  const result = { type: typeof value === 'number' ? 'number' : Array.isArray(value) ? 'object' : typeof value === 'object' && value !== null ? 'object' : 'string', value };
  if (returnByValue === false) delete result.value;
  fs.writeFileSync(path.join(dir, `.cdp-chunk-resp-${i}.json`), JSON.stringify({ result }));
  console.log(JSON.stringify({ chunk: i, ok: true, valueType: typeof value, port: port ?? null }));
}

await browser.close().catch(() => {});
console.log(JSON.stringify({ ok: true, chunks: 17 }));
