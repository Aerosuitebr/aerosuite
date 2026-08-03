/**
 * Auto-run all invoke steps using Playwright via page from browser tab.
 * Reads .invoke-step-N.json and evaluates on wp-admin page.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '5c671d';
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

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

function loadManifest() {
  const p = path.join(dir, '.invoke-steps-manifest.json');
  if (!fs.existsSync(p)) execSync(`node gen-invoke-steps.mjs ${viewId}`, { cwd: dir, stdio: 'inherit' });
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function evalArgs(page, args) {
  const { expression, awaitPromise } = args.params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise && v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

function recordKey(rel) {
  if (rel.includes('cssfull-run')) return 'cssFullRun';
  if (rel.includes('css-verify')) return 'cssVerify';
  if (rel.includes('css-finalize')) return 'cssFinalize';
  if (rel.includes('enc-init')) return 'encInit';
  if (rel.includes('enc-run')) return 'encRun';
  const m = rel.match(/enc-(\d)\/run/);
  if (m) return `enc${m[1]}`;
  return null;
}

function checkpoint(rel, value) {
  if (rel.includes('cssfull-run') && (!value?.ok || value?.len !== 34708))
    return { fail: true, reason: 'cssFullRun', value };
  if (rel.includes('css-verify') && (!value?.hasGrid || value?.b64 !== 34708))
    return { fail: true, reason: 'cssVerify', value };
  if (rel.includes('css-finalize') && !value?.ok) return { fail: true, reason: 'cssFinalize', value };
  if (rel.includes('enc-init') && !value?.ok) return { fail: true, reason: 'encInit', value };
  if (rel.includes('enc-run') && (!value?.ok || !value?.hasHeroV2))
    return { fail: true, reason: 'encRun', value };
  return { fail: false };
}

// Try CDP endpoints used by Cursor embedded browser
const ports = [9222, 9223, 9333, 8315, 9229];
let browser;
let lastErr;
for (const port of ports) {
  try {
    browser = await pw.chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    break;
  } catch (e) {
    lastErr = e;
  }
}

if (!browser) {
  console.log(JSON.stringify({ error: 'NO_CDP', message: String(lastErr), hint: 'use CallMcpTool loop' }));
  process.exit(2);
}

const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages().find((p) => p.url().includes('aerosuite')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.log(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const manifest = loadManifest();
execSync('node mcp-deploy-runner.mjs reset', { cwd: dir, stdio: 'pipe' });

for (let i = 0; i < manifest.count; i++) {
  const rel = manifest.steps[i].replace(/\\/g, '/');
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-step-${i}.json`), 'utf8'));
  try {
    const value = await evalArgs(page, args);
    const key = recordKey(rel);
    if (key) summary[key] = value;
    const chk = checkpoint(rel, value);
    if (chk.fail) {
      summary.errors.push({ file: rel, reason: chk.reason, value: chk.value });
      break;
    }
  } catch (e) {
    summary.errors.push({ file: rel, error: String(e) });
    break;
  }
}

console.log(JSON.stringify(summary));
await browser.close();
process.exit(summary.errors.length ? 1 : 0);
