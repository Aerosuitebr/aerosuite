/**
 * Run .cdp-live-step-N.json expressions via Playwright on wp-admin (same as browser_cdp).
 * Usage: node .cdp-run-live-steps-pw.mjs <start> <end> [cookiesFile]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const cookiesFile = process.argv[4] || path.join(dir, '.cdp-wp-cookies.json');

async function evalExpr(page, expression, awaitPromise) {
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise && v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise },
  );
}

const cookiesData = JSON.parse(fs.readFileSync(cookiesFile, 'utf8'));
const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext();
if (cookiesData.cookies) {
  const pairs = cookiesData.cookies.split(';').map((s) => s.trim()).filter(Boolean);
  const cookieList = pairs.map((p) => {
    const i = p.indexOf('=');
    return {
      name: p.slice(0, i),
      value: p.slice(i + 1),
      domain: 'aerosuite.com.br',
      path: '/',
    };
  });
  await context.addCookies(cookieList);
}
const page = await context.newPage();
await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (page.url().includes('wp-login')) {
  console.error(JSON.stringify({ error: 'NOT_LOGGED_IN', url: page.url() }));
  process.exit(2);
}

// Restore in-page state from MCP tab if provided
if (cookiesData.inPage) {
  await page.evaluate((s) => {
    window.__cssParts = s.parts || [];
    window.__cssb64 = s.b64 || '';
    window.__stepB64 = s.stepB64;
    window.__homeb64 = s.homeb64;
  }, cookiesData.inPage);
}

for (let n = start; n <= end; n++) {
  const live = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-live-step-${n}.json`), 'utf8'));
  let value;
  try {
    value = await evalExpr(page, live.params.expression, live.params.awaitPromise);
  } catch (e) {
    const mcpOut = { exceptionDetails: { text: String(e) } };
    fs.writeFileSync(path.join(dir, '.cdp-temp-resp.json'), JSON.stringify(mcpOut));
    execFileSync('node', ['.cdp-mcp-exec-loop.mjs', 'record', String(n), JSON.stringify(mcpOut)], {
      cwd: dir,
      stdio: 'inherit',
    });
    process.exit(1);
  }
  const mcpOut = { result: { type: 'object', value } };
  fs.writeFileSync(path.join(dir, '.cdp-temp-resp.json'), JSON.stringify(mcpOut));
  try {
    execFileSync('node', ['.cdp-mcp-exec-loop.mjs', 'record', String(n), JSON.stringify(mcpOut)], {
      cwd: dir,
      stdio: 'inherit',
    });
  } catch {
    process.exit(1);
  }
  process.stderr.write(`OK ${n}\n`);
}

await browser.close();
process.stderr.write('DONE\n');
