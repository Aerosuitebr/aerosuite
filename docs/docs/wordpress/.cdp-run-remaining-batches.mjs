/**
 * Run steps 1-29 in Playwright (same expressions as MCP batches) and record to .cdp-mcp-seq-state.json
 * Usage: node .cdp-run-remaining-batches.mjs [startStep]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const viewId = 'f488e5';

const batches = [
  { file: '.cdp-batch-1-3.json', steps: [1, 2, 3] },
  { file: '.cdp-batch-4-7.json', steps: [4, 5, 6, 7] },
  { file: '.cdp-batch-8-13.json', steps: [8, 9, 10, 11, 12, 13] },
  { file: '.cdp-batch-14-19.json', steps: [14, 15, 16, 17, 18, 19] },
  { file: '.cdp-batch-20-25.json', steps: [20, 21, 22, 23, 24, 25] },
  { file: '.cdp-batch-26-29.json', steps: [26, 27, 28, 29] },
];

function record(step, value) {
  const payload = JSON.stringify({ result: { result: { value } } });
  const res = spawnSync(
    'node',
    ['.cdp-run-all-mcp-steps.mjs', 'record', String(step), payload],
    { cwd: dir, encoding: 'utf8' }
  );
  process.stdout.write(res.stdout || '');
  if (res.status !== 0) {
    process.stderr.write(res.stderr || '');
    process.exit(res.status ?? 1);
  }
}

function extractValue(resp) {
  const val = resp?.result?.result?.value ?? resp?.result?.value ?? resp?.value ?? resp;
  return val;
}

async function evalExpr(page, expression) {
  return page.evaluate(
    async ({ expression }) => {
      let v = eval(expression);
      if (v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expression }
  );
}

const storage = path.join(dir, 'wp-storage.json');
const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : {}
);
const page = await context.newPage();
await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
if (page.url().includes('wp-login')) {
  console.error(JSON.stringify({ error: 'NOT_LOGGED_IN' }));
  process.exit(2);
}

// Re-run step 0 to seed __cssParts (separate browser session)
const step0 = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-batch-step0.json'), 'utf8'));
await evalExpr(page, step0.params.expression);

for (const batch of batches) {
  const minStep = Math.min(...batch.steps);
  if (minStep < start) continue;
  const j = JSON.parse(fs.readFileSync(path.join(dir, batch.file), 'utf8'));
  const val = await evalExpr(page, j.params.expression);
  if (val?.out) {
    for (const [k, v] of Object.entries(val.out).sort((a, b) => Number(a) - Number(b))) {
      const n = Number(k);
      if (n >= start) record(n, v);
    }
  } else {
    for (const n of batch.steps) {
      if (n >= start && val[n] !== undefined) record(n, val[n]);
    }
    if (batch.steps.length === 1 && val && !val.out) {
      const n = batch.steps[0];
      if (n >= start) record(n, val);
    }
  }
}

await browser.close();
console.log(JSON.stringify({ ok: true, viewId }));
