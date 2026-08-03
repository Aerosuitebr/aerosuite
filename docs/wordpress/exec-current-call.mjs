/**
 * Execute one .cdp-mcp-current-call.json via node + playwright if CDP available,
 * otherwise print call path for external MCP (exit 2).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const call = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-mcp-current-call.json'), 'utf8'));

async function tryCdp() {
  const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
  const ports = [9222, 9223, 9333, 19222, 8315, 9229, 9334];
  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1500) });
      const tabs = await res.json();
      const tab = tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      const cdp = await page.context().newCDPSession(page);
      const r = await cdp.send('Runtime.evaluate', {
        expression: call.params.expression,
        awaitPromise: call.params.awaitPromise ?? true,
        returnByValue: call.params.returnByValue ?? true,
      });
      await browser.close();
      if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
      fs.writeFileSync(path.join(dir, '.cdp-mcp-current-response.json'), JSON.stringify(r));
      console.log(JSON.stringify({ ok: true, via: 'cdp', value: r.result?.value }));
      return true;
    } catch {
      /* next port */
    }
  }
  return false;
}

if (await tryCdp()) process.exit(0);
console.log(JSON.stringify({ needMcp: true, call: path.join(dir, '.cdp-mcp-current-call.json') }));
process.exit(2);
