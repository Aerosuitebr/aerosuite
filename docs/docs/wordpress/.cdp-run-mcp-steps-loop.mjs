/**
 * Execute steps via Playwright if CHROME_WS available, else exit 2.
 * Writes .cdp-step-N.mcp-out.json in MCP response shape.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? '7e22ca';

const cdpUrl =
  process.env.CURSOR_CDP_URL ||
  process.env.CHROME_WS ||
  (() => {
    try {
      const list = JSON.parse(
        fs.readFileSync(0, 'utf8') || '[]'
      );
    } catch {
      /* noop */
    }
    return null;
  })();

function checkStep(i, value) {
  if (value?.exceptionDetails) return 'exception';
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

async function main() {
  let ws = process.env.CURSOR_CDP_URL || process.env.CHROME_WS;
  if (!ws) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const tabs = await res.json();
      const tab = tabs.find((t) => (t.url || '').includes('wp-admin/post.php'));
      if (tab?.webSocketDebuggerUrl) ws = tab.webSocketDebuggerUrl;
    } catch {
      /* ignore */
    }
  }
  if (!ws) {
    console.log(JSON.stringify({ error: 'NO_CDP' }));
    process.exit(2);
  }

  const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
  const browser = await pw.chromium.connectOverCDP(ws, { timeout: 15000 });
  const page =
    browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin/post.php')) ||
    browser.contexts()[0]?.pages()[0];
  if (!page) {
    console.log(JSON.stringify({ error: 'NO_PAGE' }));
    process.exit(3);
  }

  const errors = [];
  for (let n = start; n <= end; n++) {
    const argsPath = path.join(dir, `.cdp-step-${n}.args.json`);
    if (!fs.existsSync(argsPath)) continue;
    const args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
    const { expression, awaitPromise } = args.params;
    try {
      const value = await page.evaluate(
        async ({ expression, awaitPromise }) => {
          const fn = (0, eval)(expression);
          return awaitPromise ? await fn() : fn();
        },
        { expression, awaitPromise: !!awaitPromise }
      );
      fs.writeFileSync(
        path.join(dir, `.cdp-step-${n}.mcp-out.json`),
        JSON.stringify({ result: { type: 'object', value } })
      );
      const fail = checkStep(n, value);
      if (fail) {
        errors.push({ step: n, value, reason: fail });
        break;
      }
      process.stderr.write(`OK ${n}\n`);
    } catch (e) {
      errors.push({ step: n, error: String(e) });
      break;
    }
  }
  await browser.close().catch(() => {});
  console.log(JSON.stringify({ viewId, done: true, errors }));
  process.exit(errors.length ? 1 : 0);
}

main();
