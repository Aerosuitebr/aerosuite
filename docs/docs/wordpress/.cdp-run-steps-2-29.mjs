/**
 * Run steps 2-29 via page.evaluate (same as browser_cdp) when Playwright CDP works.
 * Otherwise writes .cdp-needs-mcp-step.txt with step number.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const viewId = process.argv[2] || '4610b7';

function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return { fail: true, reason: 'step4', value };
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return { fail: true, reason: 'step5', value };
  if (n === 6 && !value?.ok) return { fail: true, reason: 'step6', value };
  if (n === 7 && !value?.ok) return { fail: true, reason: 'step7', value };
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return { fail: true, reason: 'step29', value };
  return { fail: false };
}

async function getPage() {
  for (const port of [9222, 9223, 9333]) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1500) })).json();
      const tab = tabs.find((t) => (t.url || '').includes('wp-admin/post.php'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin/post.php')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page };
    } catch {
      /* */
    }
  }
  return null;
}

const conn = await getPage();
const errors = [];

if (!conn) {
  console.log(JSON.stringify({ error: 'NO_CDP', viewId }));
  process.exit(2);
}

const { browser, page } = conn;

for (let n = 2; n <= 29; n++) {
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
    fs.writeFileSync(
      path.join(dir, `.cdp-step-${n}.mcp-out.json`),
      JSON.stringify({ result: { type: 'object', value } })
    );
    const chk = checkStep(n, value);
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
console.log(JSON.stringify({ done: !errors.length, errors, viewId }));
process.exit(errors.length ? 1 : 0);
