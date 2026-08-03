/**
 * Run steps start..end: read .cdp-args-N.json, evaluate on wp-admin via Playwright CDP.
 * Writes .cdp-current-mcp-result.json compatible payloads and final summary.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const viewId = process.argv[2] || '87550c';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

async function connect() {
  for (const port of [9222, 9223, 9333, 19222, 8315, 9229]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000) });
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
      /* next port */
    }
  }
  return null;
}

const conn = await connect();
if (!conn) {
  console.error('NO_CDP');
  process.exit(2);
}

const { browser, page } = conn;
const recorded = {};
const errors = [];

for (let n = start; n <= end; n++) {
  const argsFile = path.join(dir, `.cdp-args-${n}.json`);
  if (!fs.existsSync(argsFile)) continue;
  const args = JSON.parse(fs.readFileSync(argsFile, 'utf8'));
  const { expression, awaitPromise, returnByValue } = args.params;
  try {
    const value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        const fn = eval(expression);
        return awaitPromise ? await fn : fn;
      },
      { expression, awaitPromise: !!awaitPromise },
    );
    fs.writeFileSync(
      path.join(dir, `.cdp-step-${n}.mcp-out.json`),
      JSON.stringify({ result: { type: 'object', value } }),
    );
    if (summaryKeys[n]) recorded[summaryKeys[n]] = value;
    const fail = checkStep(n, value);
    if (fail) {
      errors.push({ step: n, reason: fail, value });
      if (n === 4) {
        await page.evaluate(() => {
          window.__cssParts = [];
          window.__cssb64 = '';
          return { cleared: true };
        });
        n = -1;
        continue;
      }
      break;
    }
    process.stderr.write(`OK ${n}\n`);
  } catch (e) {
    errors.push({ step: n, error: String(e.message || e) });
    break;
  }
}

await browser.close();

const out = {
  viewId: 'a9930e',
  activeViewId: viewId,
  cssFullRun: recorded.cssFullRun ?? null,
  cssVerify: recorded.cssVerify ?? null,
  cssFinalize: recorded.cssFinalize ?? null,
  encInit: recorded.encInit ?? null,
  enc0: recorded.enc0 ?? null,
  enc1: recorded.enc1 ?? null,
  enc2: recorded.enc2 ?? null,
  enc3: recorded.enc3 ?? null,
  encRun: recorded.encRun ?? null,
  errors,
};
fs.writeFileSync(path.join(dir, '.cdp-final-out.json'), JSON.stringify(out, null, 2));
process.stdout.write(`FINAL ${JSON.stringify(out)}\n`);
process.exit(errors.length ? 1 : 0);
