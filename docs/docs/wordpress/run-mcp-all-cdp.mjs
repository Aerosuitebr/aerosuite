/**
 * Runs all .mcp-* steps via page.evaluate on Playwright connected to Cursor browser.
 * Discovers CDP: argv[2] or CURSOR_CDP_URL or http://127.0.0.1:9222
 * Writes deploy-mcp-summary.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const viewId = process.argv[2] || 'b5108e';
const cdpUrl = process.argv[3] || process.env.CURSOR_CDP_URL || process.env.CHROME_WS || 'http://127.0.0.1:9222';

function buildPayload(rel) {
  const src = path.join(dir, rel);
  const j = JSON.parse(fs.readFileSync(src, 'utf8'));
  const args = { ...(j.arguments || j) };
  args.viewId = viewId;
  return args.params;
}

async function evalParams(page, params) {
  const { expression, awaitPromise } = params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

function orderedSteps() {
  const list = [
    '.mcp-cssfull-batch-0.json',
    '.mcp-cssfull-batch-1.json',
    '.mcp-cssfull-batch-2.json',
    '.mcp-cssfull-batch-3.json',
    '.mcp-cssfull-run.json',
    '.mcp-css-verify.json',
    '.mcp-css-finalize.json',
    '.mcp-enc-init.json',
  ];
  for (const enc of ['enc-0', 'enc-1', 'enc-2', 'enc-3']) {
    const encDir = path.join(dir, `.mcp-${enc}`);
    if (!fs.existsSync(encDir)) {
      execSync(`node emit-mcp-chunks.mjs ${enc} ${viewId}`, { cwd: dir, stdio: 'inherit' });
    }
    const uploads = fs
      .readdirSync(encDir)
      .filter((f) => /^upload-\d+\.json$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    for (const u of uploads) list.push(path.join(`.mcp-${enc}`, u));
    list.push(path.join(`.mcp-${enc}`, 'run.json'));
  }
  list.push('.mcp-enc-run.json');
  return list;
}

function summaryKeyFor(file) {
  if (file.endsWith('cssfull-run.json')) return 'cssFullRun';
  if (file.endsWith('css-verify.json')) return 'cssVerify';
  if (file.endsWith('css-finalize.json')) return 'cssFinalize';
  if (file.endsWith('enc-init.json')) return 'encInit';
  if (file.endsWith('enc-run.json')) return 'encRun';
  const m = file.match(/\.mcp-(enc-\d)\/run\.json$/);
  if (m) return m[1].replace('-', '');
  return null;
}

const summary = {
  viewId,
  cssFullRun: null,
  cssVerify: null,
  cssFinalize: null,
  encInit: null,
  enc0: null,
  enc1: null,
  enc2: null,
  enc3: null,
  encRun: null,
  errors: [],
};

let browser;
try {
  browser = await pw.chromium.connectOverCDP(cdpUrl);
} catch (e) {
  console.error(JSON.stringify({ error: 'connectOverCDP', message: e.message, cdpUrl }));
  process.exit(2);
}

const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages().find((p) => p.url().includes('aerosuite.com.br')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.error(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

for (const rel of orderedSteps()) {
  try {
    const value = await evalParams(page, buildPayload(rel));
    const key = summaryKeyFor(rel);
    if (key) summary[key] = value;
    if (rel.endsWith('cssfull-run.json') && (!value?.ok || value?.len !== 34708)) {
      summary.errors.push({ file: rel, reason: 'cssFullRun', value });
      break;
    }
    if (rel.endsWith('css-verify.json') && (!value?.hasGrid || value?.b64 !== 34708)) {
      summary.errors.push({ file: rel, reason: 'cssVerify', value });
      break;
    }
    if (rel.endsWith('css-finalize.json') && !value?.ok) {
      summary.errors.push({ file: rel, reason: 'cssFinalize', value });
      break;
    }
    if (rel.endsWith('enc-run.json') && (!value?.ok || !value?.hasHeroV2)) {
      summary.errors.push({ file: rel, reason: 'encRun', value });
      break;
    }
    console.log(JSON.stringify({ ok: true, file: rel, value }));
  } catch (e) {
    summary.errors.push({ file: rel, error: String(e) });
    console.error(JSON.stringify({ ok: false, file: rel, error: String(e) }));
    break;
  }
}

fs.writeFileSync(path.join(dir, 'deploy-mcp-summary.json'), JSON.stringify(summary, null, 2));
console.log('SUMMARY', JSON.stringify(summary));
await browser.close();
process.exit(summary.errors.length ? 1 : 0);
