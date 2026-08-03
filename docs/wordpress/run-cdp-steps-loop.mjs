/**
 * Runs all deploy steps by shelling out to Cursor browser CDP via a temp driver.
 * Fallback: writes step index + expression length; parent agent should call browser_cdp.
 *
 * This script runs steps in-page using puppeteer-core if CHROME_WS env is set.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pwPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'node_modules',
  'playwright-core'
);
const pw = require(pwPath);
const dir = path.dirname(fileURLToPath(import.meta.url));
const payloads = JSON.parse(fs.readFileSync(path.join(dir, 'step-payloads.json'), 'utf8'));
const ws = process.env.CHROME_WS;
if (!ws) {
  console.error('Set CHROME_WS to browser CDP websocket URL');
  process.exit(2);
}

const browser = await pw.chromium.connectOverCDP(ws);
const page =
  browser
    .contexts()[0]
    ?.pages()
    .find((p) => p.url().includes('aerosuite.com.br')) || browser.contexts()[0].pages()[0];

const results = [];
for (let i = 0; i < payloads.length; i++) {
  const step = payloads[i];
  const expr = step.awaitPromise
    ? step.expression
    : fs.readFileSync(path.join(dir, 'steps', step.name), 'utf8');
  const value = await page.evaluate(
    async ({ expr, awaitPromise }) => {
      let v = eval(expr);
      if (awaitPromise) v = await v;
      return v;
    },
    { expr, awaitPromise: step.awaitPromise }
  );
  results.push({ name: step.name, value });
  console.log('STEP', i, step.name, JSON.stringify(value).slice(0, 160));
}

const final = results.find((r) => r.name === 'finalize.js')?.value;
fs.writeFileSync(path.join(dir, 'deploy-results.json'), JSON.stringify({ results, final }, null, 2));
console.log('FINAL_RESULT', JSON.stringify(final));
await browser.close();
