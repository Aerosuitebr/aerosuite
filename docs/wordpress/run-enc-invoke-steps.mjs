import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const cdpUrl = process.env.CHROME_WS || process.env.CURSOR_CDP_URL || 'http://127.0.0.1:9222';
const only = process.argv.slice(2);

const steps = ['enc-1', 'enc-2', 'enc-3', 'enc-run'].filter((s) => !only.length || only.includes(s));

const browser = await pw.chromium.connectOverCDP(cdpUrl, { timeout: 8000 });
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.error(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const summary = { tab: page.url(), steps: {}, errors: [] };
for (const name of steps) {
  const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${name}.json`), 'utf8'));
  try {
    const value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        let v = eval(expression);
        if (awaitPromise) v = await v;
        return v;
      },
      { expression: params.expression, awaitPromise: !!params.awaitPromise }
    );
    summary.steps[name] = value;
    console.error('OK', name, JSON.stringify(value).slice(0, 240));
  } catch (e) {
    summary.errors.push({ step: name, message: String(e) });
    console.error('FAIL', name, e.message || e);
    break;
  }
}

console.log(JSON.stringify(summary, null, 2));
await browser.close();
