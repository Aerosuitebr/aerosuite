import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);

const summaryKeys = { 4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit', 29: 'encRun' };
function checkStep(n, value) {
  if (n === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (n === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return 'step5';
  if (n === 6 && !value?.ok) return 'step6';
  if (n === 7 && !value?.ok) return 'step7';
  if (n === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29';
  return null;
}

const storage = path.join(dir, 'wp-storage.json');
const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext(fs.existsSync(storage) ? { storageState: storage } : {});
const page = await context.newPage();
await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (page.url().includes('wp-login')) {
  console.error(JSON.stringify({ error: 'NOT_LOGGED_IN' }));
  process.exit(2);
}

for (let n = start; n <= end; n++) {
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-mcp-b64-step-${n}.json`), 'utf8'));
  let value;
  try {
    value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        let v = eval(expression);
        if (awaitPromise && v && typeof v.then === 'function') v = await v;
        return v;
      },
      { expression: args.params.expression, awaitPromise: !!args.params.awaitPromise },
    );
  } catch (e) {
    console.log(JSON.stringify({ fail: n, error: String(e.message || e) }));
    process.exit(1);
  }
  fs.writeFileSync(path.join(dir, '.cdp-mcp-results', `${n}.json`), JSON.stringify({ result: { type: 'object', value } }));
  const fail = checkStep(n, value);
  if (fail) {
    console.log(JSON.stringify({ fail: n, reason: fail, value }));
    process.exit(1);
  }
  process.stderr.write(`step ${n} ok\n`);
}
await browser.close();
console.log(JSON.stringify({ ok: true, from: start, to: end }));
