import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

const files = process.argv.slice(2);
const cdpUrl = process.env.CDP_URL || 'http://127.0.0.1:9247';

const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin/post.php?post=21')) ||
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.error('NO_PAGE');
  process.exit(3);
}

const allResults = {};
for (const rel of files) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8'));
  const { expression, awaitPromise, returnByValue } = j.params;
  const value = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
  if (value?.out) {
    for (const [k, v] of Object.entries(value.out)) allResults[Number(k)] = v;
  } else {
    allResults[rel] = value;
  }
  console.log(JSON.stringify({ file: rel, ok: value?.ok !== false, keys: value?.out ? Object.keys(value.out) : null }));
}

fs.writeFileSync(path.join(dir, '.cdp-playwright-batch-results.json'), JSON.stringify(allResults, null, 2));
console.log(JSON.stringify({ done: true, results: allResults }));
await browser.close();
