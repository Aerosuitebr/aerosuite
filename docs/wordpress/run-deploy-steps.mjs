/**
 * Executa deploy-steps.json via Playwright (requer sessão wp-admin exportada ou login manual).
 * Alternativa: os passos são aplicados via browser CDP no wp-admin logado.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const dir = path.dirname(fileURLToPath(import.meta.url));
const steps = JSON.parse(fs.readFileSync(path.join(dir, 'deploy-steps.json'), 'utf8'));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto('https://aerosuite.com.br/wp-admin/', { waitUntil: 'domcontentloaded' });
if (page.url().includes('wp-login')) {
  console.error('Não logado no WordPress. Faça login no browser e exporte cookies, ou rode os passos via CDP no wp-admin.');
  process.exit(1);
}

const results = [];
for (const step of steps) {
  const value = await page.evaluate(
    async ({ expr, awaitPromise }) => {
      // eslint-disable-next-line no-eval
      const fn = eval(expr);
      return awaitPromise ? await fn() : fn();
    },
    { expr: step.expr, await: !!step.await }
  );
  results.push({ name: step.name, value });
  console.log(step.name, typeof value === 'object' ? JSON.stringify(value).slice(0, 120) : value);
}

await browser.close();
fs.writeFileSync(path.join(dir, 'deploy-results.json'), JSON.stringify(results, null, 2));
console.log('done');
