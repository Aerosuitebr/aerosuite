/**
 * Run deploy-encoding steps via Playwright CDP (same as browser_cdp).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

const STEPS = ['init', 0, 1, 2, 3, 4, 'run'];

async function connect() {
  for (const port of [9222, 9223, 9333, 19222, 8315, 9229]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, {
        signal: AbortSignal.timeout(2000),
      });
      const tabs = await res.json();
      const tab =
        tabs.find((t) => (t.url || '').includes('aerosuite.com.br/wp-admin')) ||
        tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page, tabUrl: tab.url };
    } catch {
      /* next */
    }
  }
  return null;
}

function loadExpression(step) {
  if (step === 'init') return "(async()=>{window.__homeb64='';return{init:true,len:0};})()";
  const file = path.join(dir, `deploy-encoding-${step === 'run' ? 'run' : step}.js`);
  return fs.readFileSync(file, 'utf8').trim();
}

const conn = await connect();
if (!conn) {
  console.error(JSON.stringify({ error: 'no-cdp-browser', hint: 'use CallMcpTool' }));
  process.exit(2);
}

const { browser, page, tabUrl } = conn;
const results = {};

for (const step of STEPS) {
  const expression = loadExpression(step);
  const value = await page.evaluate(
    async ({ expression }) => {
      const fn = eval(expression);
      return await fn;
    },
    { expression }
  );
  results[step] = value;
  if (step === 'run') break;
}

await browser.close();
console.log(JSON.stringify({ ok: true, tabUrl, results }, null, 2));
