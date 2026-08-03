/**
 * Bridge: reads .cdp-current-mcp-args.json, evaluates via Playwright CDP,
 * writes MCP-shaped .cdp-current-mcp-result.json for .cdp-orchestrate.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

const argsPath = path.join(dir, '.cdp-current-mcp-args.json');
const resultPath = path.join(dir, '.cdp-current-mcp-result.json');
const finalPath = path.join(dir, '.cdp-final-out.json');

const cdpCandidates = [
  process.env.CURSOR_CDP_URL,
  process.env.CHROME_WS,
  'http://127.0.0.1:9222',
  'http://127.0.0.1:9223',
].filter(Boolean);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function evalArgs(page, params) {
  const { expression, awaitPromise } = params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

let browser;
for (const url of cdpCandidates) {
  try {
    browser = await pw.chromium.connectOverCDP(url);
    break;
  } catch {
    /* try next */
  }
}
if (!browser) {
  console.error('CDP_CONNECT_FAILED');
  process.exit(2);
}

const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin/post.php?post=21')) ||
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.error('NO_PAGE');
  process.exit(3);
}

console.log('bridge ready', page.url());

let steps = 0;
while (!fs.existsSync(finalPath)) {
  if (fs.existsSync(argsPath) && !fs.existsSync(resultPath)) {
    const args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
    try {
      const value = await evalArgs(page, args.params);
      const mcpResult = { result: { type: 'object', value } };
      fs.writeFileSync(resultPath, JSON.stringify(mcpResult));
      steps++;
      console.log('step done', steps, JSON.stringify(value)?.slice(0, 120));
    } catch (e) {
      fs.writeFileSync(
        resultPath,
        JSON.stringify({ exceptionDetails: { text: String(e) } })
      );
      console.error('eval error', e);
      process.exit(1);
    }
  }
  await sleep(100);
  if (steps > 35) break;
}

console.log('bridge exit steps=', steps);
await browser.close();
process.exit(0);
