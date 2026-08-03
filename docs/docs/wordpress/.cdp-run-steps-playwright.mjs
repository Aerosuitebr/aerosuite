/**
 * Run steps start..end via Playwright page.evaluate (same as browser_cdp).
 * Requires wp-admin tab reachable on local CDP or uses embedded browser WS from env.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] || '3a0808';

const summaryKeys = {
  4: 'cssFullRun',
  5: 'cssVerify',
  6: 'cssFinalize',
  7: 'encInit',
  13: 'enc0',
  19: 'enc1',
  25: 'enc2',
  28: 'enc3',
  29: 'encRun',
};

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return 'step5 verify';
  if (n === 6 && !value?.ok) return 'step6';
  if (n === 7 && !value?.ok) return 'step7';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29';
  return null;
}

async function connect() {
  for (const port of [9222, 9223, 9333, 19222, 8315, 9229]) {
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
      if (page) return { browser, page };
    } catch {
      /* */
    }
  }
  return null;
}

const conn = await connect();
if (!conn) {
  console.error(JSON.stringify({ error: 'NO_CDP', hint: 'use CallMcpTool browser_cdp' }));
  process.exit(2);
}

const { browser, page } = conn;
const errors = [];

for (let n = start; n <= end; n++) {
  execSync(`node .cdp-prep-and-snapshot.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-snap-${n}.json`), 'utf8'));
  try {
    const value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        const fn = eval(expression);
        return awaitPromise ? await fn : fn;
      },
      { expression: args.params.expression, awaitPromise: !!args.params.awaitPromise },
    );
    const mcpResult = JSON.stringify({ result: { type: 'object', value } });
    fs.writeFileSync(path.join(dir, '.cdp-mcp-last-result.json'), mcpResult);
    const fail = checkStep(n, value);
    const rec = execSync(`node .cdp-save-record.mjs ${n}`, { cwd: dir, encoding: 'utf8' });
    process.stderr.write(`step ${n}: ${rec.trim()}\n`);
    if (fail) {
      errors.push({ step: n, reason: fail, value });
      break;
    }
  } catch (e) {
    errors.push({ step: n, error: String(e.message || e) });
    break;
  }
}

await browser.close();
if (errors.length) {
  console.log(JSON.stringify({ ok: false, errors }));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, from: start, to: end }));
