/**
 * Runs all step payloads via Playwright page.evaluate (eval in function scope).
 * Requires wp-admin session: set WP_STORAGE or run headed and log in once.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const dir = path.dirname(fileURLToPath(import.meta.url));
const payloads = JSON.parse(fs.readFileSync(path.join(dir, 'step-payloads.json'), 'utf8'));
const storage = process.env.WP_STORAGE || path.join(dir, 'wp-storage.json');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : {}
);
const page = await context.newPage();
await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (page.url().includes('wp-login')) {
  console.error('NOT_LOGGED_IN', page.url());
  process.exit(2);
}

const hasWp = await page.evaluate(() => typeof wp !== 'undefined' && !!wp.apiFetch);
if (!hasWp) {
  console.error('NO_WP_API');
  process.exit(3);
}

const results = [];
for (const step of payloads) {
  const value = await page.evaluate(
    async ({ expr, awaitPromise }) => {
      let v = eval(expr);
      if (awaitPromise) v = await v;
      return v;
    },
    { expr: step.expression, awaitPromise: step.awaitPromise }
  );
  results.push({ name: step.name, value });
  console.log(step.name, JSON.stringify(value).slice(0, 200));
}

const final = results.find((r) => r.name === 'finalize.js')?.value;
fs.writeFileSync(path.join(dir, 'deploy-results.json'), JSON.stringify(results, null, 2));
console.log('FINAL', JSON.stringify(final));
await browser.close();
