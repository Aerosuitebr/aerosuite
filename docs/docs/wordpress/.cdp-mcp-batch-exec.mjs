/**
 * Execute steps start..end via page.evaluate using args from .cdp-step-N.mcp-ready.json
 * (same expressions as browser_cdp). Requires live tab via MCP viewId probe first.
 * Writes .cdp-step-N.mcp-out.json in MCP response shape.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '4610b7';

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return 'step5';
  if (n === 6 && !value?.ok) return 'step6';
  if (n === 7 && !value?.ok) return 'step7';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29';
  return null;
}

async function getPage() {
  const ports = [9222, 9223, 9333, 19222];
  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1500) });
      const tabs = await res.json();
      const tab = tabs.find((t) => (t.url || '').includes('wp-admin/post.php'));
      if (tab?.webSocketDebuggerUrl) {
        const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
        const page =
          browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin/post.php')) ||
          browser.contexts()[0]?.pages()[0];
        if (page) return { browser, page };
      }
    } catch {
      /* next */
    }
  }
  return null;
}

const conn = await getPage();
if (!conn) {
  console.log(JSON.stringify({ error: 'NO_CDP', hint: 'use CallMcpTool browser_cdp', viewId }));
  process.exit(2);
}

const { browser, page } = conn;
const errors = [];

for (let n = start; n <= end; n++) {
  execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const args = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-current-mcp-args.json'), 'utf8'));
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
    const mcpOut = { result: { type: 'object', value } };
    fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify(mcpOut));
    const fail = checkStep(n, value);
    if (fail) {
      errors.push({ step: n, reason: fail, value });
      break;
    }
    process.stderr.write(`OK ${n}\n`);
  } catch (e) {
    errors.push({ step: n, error: String(e) });
    break;
  }
}

await browser.close().catch(() => {});
console.log(JSON.stringify({ done: errors.length === 0, errors, viewId }));
process.exit(errors.length ? 1 : 0);
