/**
 * Run upload chunks start..end via Playwright CDP or fail with NEED_AGENT.
 * Usage: node .cdp-run-upload-chunks.mjs <start> <end> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 14);

const cdpCandidates = [
  process.env.CURSOR_CDP_URL,
  process.env.CHROME_WS,
  'http://127.0.0.1:9222',
].filter(Boolean);

async function connect() {
  let pw;
  try {
    pw = require(path.join(dir, 'node_modules', 'playwright-core'));
  } catch {
    return null;
  }
  for (const url of cdpCandidates) {
    try {
      const browser = await pw.chromium.connectOverCDP(url);
      return browser;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function evalExpr(page, expression, awaitPromise = false) {
  const client = await page.context().newCDPSession(page);
  const r = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (r.exceptionDetails) {
    throw new Error(JSON.stringify(r.exceptionDetails));
  }
  return r.result?.value;
}

const browser = await connect();
if (!browser) {
  console.log(JSON.stringify({ needAgent: true, start, end }));
  process.exit(2);
}

const pages = browser.contexts().flatMap((c) => c.pages());
const page =
  pages.find((p) => p.url().includes('post=21')) ||
  pages.find((p) => p.url().includes('wp-admin')) ||
  pages[0];
if (!page) {
  console.log(JSON.stringify({ error: 'no page' }));
  process.exit(1);
}

const results = [];
for (let i = start; i <= end; i++) {
  const call = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-up-${i}.json`), 'utf8'));
  const val = await evalExpr(page, call.params.expression, !!call.params.awaitPromise);
  results.push({ i, val });
  process.stderr.write(`OK ${i} ${JSON.stringify(val)}\n`);
}

console.log(JSON.stringify({ ok: true, results }));
await browser.close();
