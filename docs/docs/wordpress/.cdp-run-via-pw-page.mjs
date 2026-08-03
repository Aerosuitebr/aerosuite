/**
 * Execute steps start..end via page.evaluate using expressions from .cdp-step-N.call.json
 * Connects to Cursor browser via CDP port discovery from common Cursor debug ports.
 * Same Runtime.evaluate expressions as browser_cdp MCP.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'f8a339';

function checkStep(n, value, raw) {
  if (raw?.exceptionDetails) return { fail: true, reason: 'exception', value: raw.exceptionDetails };
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return { fail: true, reason: 'step4', value };
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return { fail: true, reason: 'step5', value };
  if (n === 6 && !value?.ok) return { fail: true, reason: 'step6', value };
  if (n === 7 && !value?.ok) return { fail: true, reason: 'step7', value };
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return { fail: true, reason: 'step29', value };
  return { fail: false };
}

async function findPage() {
  const ports = [];
  for (let p = 9222; p <= 9230; p++) ports.push(p);
  ports.push(9333, 19222, 8315, 9229, 4567, 5080, 8765);
  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1500) });
      const tabs = await res.json();
      if (!Array.isArray(tabs) || !tabs.length) continue;
      const tab = tabs.find((t) => (t.url || '').includes('wp-admin/post.php')) || tabs.find((t) => (t.url || '').includes('wp-admin')) || tabs[0];
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin/post.php')) ||
        browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page, port, url: page.url() };
      await browser.close();
    } catch {
      /* next */
    }
  }
  return null;
}

const conn = await findPage();
if (!conn) {
  console.log(JSON.stringify({ error: 'NO_CDP', hint: 'use CallMcpTool', start, end, viewId }));
  process.exit(2);
}

const { browser, page, port, url } = conn;
const errors = [];

for (let n = start; n <= end; n++) {
  const callPath = path.join(dir, `.cdp-step-${n}.call.json`);
  if (!fs.existsSync(callPath)) {
    require('child_process').execSync(`node .cdp-agent-step.mjs prep ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  }
  const call = JSON.parse(fs.readFileSync(callPath, 'utf8'));
  const { expression, awaitPromise, returnByValue } = call.params;
  try {
    const value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        let v = eval(expression);
        if (awaitPromise && v && typeof v.then === 'function') v = await v;
        return v;
      },
      { expression, awaitPromise: !!awaitPromise }
    );
    const out = { result: { type: 'object', value } };
    fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify(out));
    const chk = checkStep(n, value, out);
    if (chk.fail) {
      errors.push({ step: n, ...chk });
      break;
    }
    process.stderr.write(`OK ${n}\n`);
  } catch (e) {
    errors.push({ step: n, error: String(e) });
    break;
  }
}

await browser.close().catch(() => {});
console.log(JSON.stringify({ done: !errors.length, errors, port, url, viewId }));
process.exit(errors.length ? 1 : 0);
