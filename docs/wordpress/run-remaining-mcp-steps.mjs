/**
 * Run steps start..end via .mcp-step-N-call.json using Playwright if CDP available,
 * else print AGENT_MCP_REQUIRED per step.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const start = Number(process.argv[2] ?? 3);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '5f37a3';

async function connect() {
  const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
  for (const port of [9222, 9223, 9333, 19222, 8315, 9229]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000) });
      const tabs = await res.json();
      const tab =
        tabs.find((t) => (t.url || '').includes('wp-admin/post.php')) ||
        tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page };
    } catch {
      /* */
    }
  }
  return null;
}

function record(n, value) {
  execSync(`node mcp-step-bridge.mjs record ${n} ${JSON.stringify(JSON.stringify(value))}`, {
    cwd: dir,
    stdio: 'pipe',
  });
}

function check(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return { step: 4, value };
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return { step: 5, value };
  if (n === 6 && !value?.ok) return { step: 6, value };
  if (n === 7 && !value?.ok) return { step: 7, value };
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return { step: 29, value };
  return null;
}

const conn = await connect();
if (!conn) {
  console.log(JSON.stringify({ mode: 'agent', start, end }));
  process.exit(2);
}

const { browser, page } = conn;
const errors = [];

for (let n = start; n <= end; n++) {
  const callFile = path.join(dir, `.mcp-step-${n}-call.json`);
  if (!fs.existsSync(callFile)) {
    execSync(`node mcp-step-bridge.mjs prepare ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
    fs.copyFileSync(path.join(dir, '.mcp-current.json'), callFile);
  }
  const args = JSON.parse(fs.readFileSync(callFile, 'utf8'));
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
    record(n, value);
    const fail = check(n, value);
    console.log('OK', n, JSON.stringify(value).slice(0, 120));
    if (fail) {
      errors.push(fail);
      break;
    }
  } catch (e) {
    errors.push({ step: n, error: String(e) });
    break;
  }
}

await browser.close().catch(() => {});
console.log(JSON.stringify({ ok: !errors.length, errors }));
process.exit(errors.length ? 1 : 0);
