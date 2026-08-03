/**
 * Run prepared .mcp-*.json steps via Playwright page.evaluate (same Runtime.evaluate as browser_cdp).
 * Writes deploy-mcp-summary.json for the agent.
 * Usage: node exec-mcp-sequence.mjs [viewIdNote]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const requestedViewId = process.argv[2] || 'a9930e';
const activeViewId = process.env.ACTIVE_VIEW_ID || 'c11c39';

const summary = {
  viewId: requestedViewId,
  activeViewId,
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
  const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  if (j.arguments) {
    const args = { ...j.arguments };
    args.viewId = activeViewId;
    return args;
  }
  return {
    viewId: activeViewId,
    method: 'Runtime.evaluate',
    params: j,
  };
}

async function evalArgs(page, args, label) {
  const { expression, awaitPromise, returnByValue } = args.params;
  const value = await page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
  if (args.params.returnByValue === false) return value;
  return value;
}

async function runMcpFile(page, file, label) {
  const args = loadArgs(file);
  try {
    const value = await evalArgs(page, args, label);
    return { ok: true, value };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function ensureEncChunks(enc) {
  const encDir = path.join(dir, `.mcp-${enc}`);
  if (!fs.existsSync(encDir)) {
    execSync(`node emit-mcp-chunks.mjs ${enc} ${requestedViewId}`, { cwd: dir, stdio: 'inherit' });
  }
  return encDir;
}

async function runEncStep(page, enc) {
  const encDir = await ensureEncChunks(enc);
  const uploads = fs
    .readdirSync(encDir)
    .filter((f) => /^upload-\d+\.json$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  for (const u of uploads) {
    const rel = path.join(`.mcp-${enc}`, u);
    const r = await runMcpFile(page, rel, `${enc}:${u}`);
    if (!r.ok) return r;
  }
  return runMcpFile(page, path.join(`.mcp-${enc}`, 'run.json'), `${enc}:run`);
}

// Connect via MCP-exposed browser: use browser from playwright connecting to Cursor internal WS is unavailable.
// This script is invoked only when CHROME_WS is set; otherwise agent uses CallMcpTool directly.
const cdpUrl = process.env.CHROME_WS || process.env.CURSOR_CDP_URL;
if (!cdpUrl) {
  console.error(JSON.stringify({ error: 'NO_CDP_URL', hint: 'use CallMcpTool browser_cdp' }));
  process.exit(2);
}

const browser = await pw.chromium.connectOverCDP(cdpUrl);
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.error(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const cssBatches = [
  '.mcp-cssfull-batch-0.json',
  '.mcp-cssfull-batch-1.json',
  '.mcp-cssfull-batch-2.json',
  '.mcp-cssfull-batch-3.json',
];
for (const f of cssBatches) {
  const r = await runMcpFile(page, f, f);
  if (!r.ok) {
    summary.errors.push({ step: f, error: r.error });
    break;
  }
}
if (!summary.errors.length) {
  const run = await runMcpFile(page, '.mcp-cssfull-run.json', 'cssfull-run');
  if (run.ok) summary.cssFullRun = run.value;
  else summary.errors.push({ step: 'cssfull-run', error: run.error });
}
if (!summary.errors.length) {
  const v = await runMcpFile(page, '.mcp-css-verify.json', 'css-verify');
  if (v.ok) summary.cssVerify = v.value;
  else summary.errors.push({ step: 'css-verify', error: v.error });
}
if (!summary.errors.length) {
  const f = await runMcpFile(page, '.mcp-css-finalize.json', 'css-finalize');
  if (f.ok) summary.cssFinalize = f.value;
  else summary.errors.push({ step: 'css-finalize', error: f.error });
}
if (!summary.errors.length) {
  const i = await runMcpFile(page, '.mcp-enc-init.json', 'enc-init');
  if (i.ok) summary.encInit = i.value;
  else summary.errors.push({ step: 'enc-init', error: i.error });
}
for (const enc of ['enc-0', 'enc-1', 'enc-2', 'enc-3']) {
  if (summary.errors.length) break;
  const r = await runEncStep(page, enc);
  const key = enc.replace('-', '');
  if (r.ok) summary[key] = r.value;
  else summary.errors.push({ step: enc, error: r.error });
}
if (!summary.errors.length) {
  const e = await runMcpFile(page, '.mcp-enc-run.json', 'enc-run');
  if (e.ok) summary.encRun = e.value;
  else summary.errors.push({ step: 'enc-run', error: e.error });
}

fs.writeFileSync(path.join(dir, 'deploy-mcp-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
await browser.close();
process.exit(summary.errors.length ? 1 : 0);
