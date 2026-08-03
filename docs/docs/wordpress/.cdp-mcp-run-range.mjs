/**
 * Run steps start..end: read .cdp-mcp-args-N.json, evaluate via Playwright (MCP tab fallback).
 * Writes MCP-shaped responses and calls .cdp-mcp-exec-loop.mjs record.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const url =
  process.argv[4] ||
  'https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit';

const storage = path.join(dir, 'wp-storage.json');
const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext(
  fs.existsSync(storage) ? { storageState: storage } : {}
);
const page = await context.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
if (page.url().includes('wp-login')) {
  console.error(JSON.stringify({ error: 'NOT_LOGGED_IN', url: page.url() }));
  await browser.close();
  process.exit(2);
}

for (let n = start; n <= end; n++) {
  const argsPath = path.join(dir, `.cdp-mcp-args-${n}.json`);
  if (!fs.existsSync(argsPath)) {
    console.error(JSON.stringify({ error: 'missing_args', step: n }));
    break;
  }
  const { params } = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
  let value;
  try {
    value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        let v = eval(expression);
        if (awaitPromise) v = await v;
        return v;
      },
      { expression: params.expression, awaitPromise: !!params.awaitPromise }
    );
  } catch (e) {
    const mcpOut = { exceptionDetails: { text: String(e) } };
    fs.writeFileSync(path.join(dir, '.cdp-temp-resp.json'), JSON.stringify(mcpOut));
    spawnSync('node', ['.cdp-mcp-exec-loop.mjs', 'record', String(n), JSON.stringify(mcpOut)], {
      cwd: dir,
      encoding: 'utf8',
      stdio: 'inherit',
    });
    break;
  }
  const mcpOut = { result: { type: 'object', value } };
  fs.writeFileSync(path.join(dir, '.cdp-temp-resp.json'), JSON.stringify(mcpOut));
  const rec = spawnSync(
    'node',
    ['.cdp-mcp-exec-loop.mjs', 'record', String(n), JSON.stringify(mcpOut)],
    { cwd: dir, encoding: 'utf8' }
  );
  process.stdout.write(rec.stdout || '');
  if (rec.status !== 0) {
    process.stderr.write(rec.stderr || '');
    break;
  }
}

await browser.close();
