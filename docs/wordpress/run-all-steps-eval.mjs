/**
 * Runs deploy steps in a Playwright page via eval() (same as run-deploy-steps.mjs).
 * Usage: node run-all-steps-eval.mjs
 * On first login required, run: $env:WP_HEADED='1'; node run-all-steps-eval.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const payloads = JSON.parse(fs.readFileSync(path.join(dir, 'step-payloads.json'), 'utf8'));
const storage = path.join(dir, 'wp-storage.json');
const headed = !!process.env.WP_HEADED;

const browser = await pw.chromium.launch({ headless: !headed });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : {}
);
const page = await context.newPage();
await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (page.url().includes('wp-login')) {
  if (headed) {
    console.error('Log in in the browser window, then press Enter in this terminal.');
    await new Promise((r) => process.stdin.once('data', r));
    await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
      waitUntil: 'domcontentloaded',
    });
    if (!page.url().includes('wp-login')) {
      await context.storageState({ path: storage });
    }
  }
}
if (page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN');
  process.exit(2);
}

const results = [];
for (const step of payloads) {
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
  console.log('OK', step.name, JSON.stringify(value).slice(0, 120));
}

const final = results.find((r) => r.name === 'finalize.js')?.value;
fs.writeFileSync(path.join(dir, 'deploy-results.json'), JSON.stringify({ results, final }, null, 2));
console.log('FINAL_RESULT', JSON.stringify(final));
await browser.close();
