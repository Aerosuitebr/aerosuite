/**
 * Run .cdp-mcp-args-N.json via CDP (Playwright connectOverCDP) or storage fallback.
 * Records each step through .cdp-mcp-exec-loop.mjs record.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);

async function connect() {
  for (const port of [9222, 9223, 9333, 19222, 8315, 9229, 18792]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, {
        signal: AbortSignal.timeout(2500),
      });
      const tabs = await res.json();
      const tab =
        tabs.find((t) => (t.url || '').includes('wp-admin/post.php?post=21')) ||
        tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser
          .contexts()
          .flatMap((c) => c.pages())
          .find((p) => (p.url() || '').includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page, port, tabUrl: tab.url };
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

let conn = await connect();
let browser;
let page;
let mode = 'cdp';

if (conn) {
  browser = conn.browser;
  page = conn.page;
} else {
  mode = 'storage';
  const storage = path.join(dir, 'wp-storage.json');
  browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext(
    fs.existsSync(storage) ? { storageState: storage } : {}
  );
  page = await context.newPage();
  await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (page.url().includes('wp-login')) {
    console.error(JSON.stringify({ error: 'NOT_LOGGED_IN' }));
    process.exit(2);
  }
}

for (let n = start; n <= end; n++) {
  const argsPath = path.join(dir, `.cdp-mcp-args-${n}.json`);
  if (!fs.existsSync(argsPath)) {
    console.error(JSON.stringify({ error: 'missing_args', step: n }));
    process.exit(1);
  }
  const { params } = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
  let value;
  try {
    value = await evalExpr(page, params.expression, params.awaitPromise);
  } catch (e) {
    const mcpOut = { exceptionDetails: { text: String(e) } };
    fs.writeFileSync(path.join(dir, '.cdp-temp-resp.json'), JSON.stringify(mcpOut));
    const rec = spawnSync('node', ['.cdp-mcp-exec-loop.mjs', 'record', String(n), JSON.stringify(mcpOut)], {
      cwd: dir,
      encoding: 'utf8',
    });
    process.stdout.write(rec.stdout || '');
    process.exit(rec.status ?? 1);
  }
  const mcpOut = { result: { type: 'object', value } };
  fs.writeFileSync(path.join(dir, '.cdp-temp-resp.json'), JSON.stringify(mcpOut));
  const rec = spawnSync('node', ['.cdp-mcp-exec-loop.mjs', 'record', String(n), JSON.stringify(mcpOut)], {
    cwd: dir,
    encoding: 'utf8',
  });
  process.stdout.write(rec.stdout || '');
  if (rec.status !== 0) {
    process.stderr.write(rec.stderr || '');
    break;
  }
}

if (mode === 'cdp') await browser.close().catch(() => {});
else await browser.close();
