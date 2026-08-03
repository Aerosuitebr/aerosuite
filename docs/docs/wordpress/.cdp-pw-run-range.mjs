/**
 * Run .cdp-call-N.json via Playwright page.evaluate (same as browser_cdp).
 * Usage: node .cdp-pw-run-range.mjs <start> <end> [viewIdNote]
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
const viewNote = process.argv[4] ?? 'f20479';

async function connect() {
  const urls = [
    process.env.CURSOR_CDP_URL,
    process.env.CHROME_WS,
    'http://127.0.0.1:9222',
    'http://127.0.0.1:9223',
    'http://127.0.0.1:9333',
  ].filter(Boolean);
  for (const base of urls) {
    try {
      const listUrl = base.includes('://') && !base.includes('/json')
        ? `${base.replace(/\/$/, '')}/json/list`
        : null;
      if (listUrl) {
        const res = await fetch(listUrl, { signal: AbortSignal.timeout(2500) });
        const tabs = await res.json();
        const tab =
          tabs.find((t) => (t.url || '').includes('wp-admin/post.php?post=21')) ||
          tabs.find((t) => (t.url || '').includes('wp-admin'));
        if (tab?.webSocketDebuggerUrl) {
          const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
          const page =
            browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
            browser.contexts()[0]?.pages()[0];
          if (page) return { browser, page, tabUrl: tab.url };
        }
      }
      const browser = await pw.chromium.connectOverCDP(base);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page, tabUrl: page.url() };
    } catch {
      /* next */
    }
  }
  return null;
}

const conn = await connect();
if (!conn) {
  console.error(JSON.stringify({ error: 'NO_CDP', hint: 'use CallMcpTool browser_cdp' }));
  process.exit(2);
}

const { browser, page, tabUrl } = conn;
const errors = [];

for (let n = start; n <= end; n++) {
  const callPath = path.join(dir, `.cdp-call-${n}.json`);
  if (!fs.existsSync(callPath)) {
    errors.push({ step: n, error: 'missing-call' });
    break;
  }
  const call = JSON.parse(fs.readFileSync(callPath, 'utf8'));
  try {
    const value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        const fn = eval(expression);
        return awaitPromise ? await fn : fn;
      },
      { expression: call.params.expression, awaitPromise: !!call.params.awaitPromise },
    );
    const out = JSON.stringify({ result: { type: 'object', value } });
    fs.writeFileSync(path.join(dir, `.cdp-last-mcp.json`), out);
    fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), out);
    const r = spawnSync('node', ['.cdp-save-mcp-and-record.mjs', String(n), path.join(dir, '.cdp-last-mcp.json')], {
      cwd: dir,
      encoding: 'utf8',
    });
    process.stderr.write(`step ${n}: ${(r.stdout || '').trim()}\n`);
    if (r.status !== 0) {
      errors.push({ step: n, stdout: r.stdout, stderr: r.stderr, status: r.status });
      if (n === 4) break;
    }
  } catch (e) {
    errors.push({ step: n, error: String(e) });
    break;
  }
}

await browser.close?.().catch(() => {});
const sum = spawnSync('node', ['.cdp-mcp-loop-exec.mjs', 'summary'], { cwd: dir, encoding: 'utf8' });
console.log(sum.stdout || '');
if (errors.length) console.error(JSON.stringify({ errors }));
process.exit(errors.length ? 1 : sum.status ?? 0);
