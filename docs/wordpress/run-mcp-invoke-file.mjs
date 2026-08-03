/**
 * Run one .mcp-invoke-*.json via page.evaluate in browser (Playwright CDP) or print for agent.
 * Usage: node run-mcp-invoke-file.mjs <invoke-json-file>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const file = process.argv[2];
if (!file) {
  console.error('usage: node run-mcp-invoke-file.mjs <invoke-json-file>');
  process.exit(1);
}
const args = JSON.parse(fs.readFileSync(path.isAbsolute(file) ? file : path.join(dir, file), 'utf8'));

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
      /* next */
    }
  }
  return null;
}

const conn = await connect();
if (!conn) {
  process.stdout.write(JSON.stringify({ mode: 'agent', args }));
  process.exit(2);
}

const { browser, page } = conn;
const { expression, awaitPromise } = args.params;
const value = await page.evaluate(
  async ({ expression, awaitPromise }) => {
    let v = eval(expression);
    if (awaitPromise) v = await v;
    return v;
  },
  { expression, awaitPromise: !!awaitPromise }
);
await browser.close().catch(() => {});
console.log(JSON.stringify({ result: { type: 'object', value } }));
