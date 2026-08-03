/**
 * Execute all prepared .mcp-*.json via Playwright CDP (fallback when agent loops MCP).
 * Set CURSOR_CDP_URL or pass as argv[2]. viewId in JSON is overridden by active tab URL match.
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
const cdpUrl = process.argv[3] || process.env.CURSOR_CDP_URL || process.env.CHROME_WS;

if (!cdpUrl) {
  console.error(JSON.stringify({ error: 'NO_CDP_URL' }));
  process.exit(2);
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

function loadArgs(file) {
  const p = path.join(dir, file);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const args = { ...(j.arguments || j) };
  args.viewId = viewId;
  return args;
}

async function evalArgs(page, args) {
  const { expression, awaitPromise } = args.params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

async function runFile(page, file) {
  try {
    const value = await evalArgs(page, loadArgs(file));
    return { ok: true, value };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function runEnc(page, enc) {
  const encDir = path.join(dir, `.mcp-${enc}`);
  if (!fs.existsSync(encDir)) {
    execSync(`node emit-mcp-chunks.mjs ${enc} ${viewId}`, { cwd: dir, stdio: 'inherit' });
  }
  const uploads = fs
    .readdirSync(encDir)
    .filter((f) => /^upload-\d+\.json$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  for (const u of uploads) {
    const r = await runFile(page, path.join(`.mcp-${enc}`, u));
    if (!r.ok) return r;
  }
  return runFile(page, path.join(`.mcp-${enc}`, 'run.json'));
}

const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages().find((p) => p.url().includes('aerosuite.com.br')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.error(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}
summary.tabUrl = page.url();

const cssBatches = [
  '.mcp-cssfull-batch-0.json',
  '.mcp-cssfull-batch-1.json',
  '.mcp-cssfull-batch-2.json',
  '.mcp-cssfull-batch-3.json',
];
for (const f of cssBatches) {
  const r = await runFile(page, f);
  if (!r.ok) {
    summary.errors.push({ step: f, error: r.error });
    break;
  }
}
if (!summary.errors.length) {
  const run = await runFile(page, '.mcp-cssfull-run.json');
  if (run.ok) summary.cssFullRun = run.value;
  else summary.errors.push({ step: 'cssfull-run', error: run.error });
}
if (!summary.errors.length) {
  const v = await runFile(page, '.mcp-css-verify.json');
  if (v.ok) summary.cssVerify = v.value;
  else summary.errors.push({ step: 'css-verify', error: v.error });
}
if (!summary.errors.length) {
  const f = await runFile(page, '.mcp-css-finalize.json');
  if (f.ok) summary.cssFinalize = f.value;
  else summary.errors.push({ step: 'css-finalize', error: f.error });
}
if (!summary.errors.length) {
  const i = await runFile(page, '.mcp-enc-init.json');
  if (i.ok) summary.encInit = i.value;
  else summary.errors.push({ step: 'enc-init', error: i.error });
}
for (const enc of ['enc-0', 'enc-1', 'enc-2', 'enc-3']) {
  if (summary.errors.length) break;
  const r = await runEnc(page, enc);
  const key = enc.replace('-', '');
  if (r.ok) summary[key] = r.value;
  else summary.errors.push({ step: enc, error: r.error });
}
if (!summary.errors.length) {
  const e = await runFile(page, '.mcp-enc-run.json');
  if (e.ok) summary.encRun = e.value;
  else summary.errors.push({ step: 'enc-run', error: e.error });
}

fs.writeFileSync(path.join(dir, 'deploy-mcp-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
await browser.close();
process.exit(summary.errors.length ? 1 : 0);
