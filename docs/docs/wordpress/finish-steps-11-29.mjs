import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const viewId = '807f76';
const start = 11;
const end = 29;
const resultPath = path.join(dir, '.cdp-mcp-result.json');

async function connect() {
  const ports = [9222, 9223, 9333, 19222, 8315, 9229, 18792, 9220];
  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) });
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

function loadCall(n) {
  const mcp = path.join(dir, `.mcp-step-${n}-payload.json`);
  const inv = path.join(dir, `.invoke-step-${n}.json`);
  const payload = fs.existsSync(mcp)
    ? JSON.parse(fs.readFileSync(mcp, 'utf8'))
    : JSON.parse(fs.readFileSync(inv, 'utf8'));
  payload.viewId = viewId;
  return payload;
}

const conn = await connect();
if (!conn) {
  console.error(JSON.stringify({ error: 'NO_CDP', needMcp: true, from: start, to: end }));
  process.exit(2);
}

const { browser, page, port } = conn;
process.stderr.write(`connected port ${port}\n`);

for (let n = start; n <= end; n++) {
  const call = loadCall(n);
  const value = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      const fn = eval(expression);
      return awaitPromise ? await fn : fn;
    },
    { expression: call.params.expression, awaitPromise: !!call.params.awaitPromise },
  );
  fs.writeFileSync(resultPath, JSON.stringify({ result: { type: 'object', value } }));
  const out = execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, encoding: 'utf8' });
  process.stderr.write(`OK ${n} ${out.trim()}\n`);
}

await browser.close();
console.log(JSON.stringify({ ok: true, from: start, to: end }));
