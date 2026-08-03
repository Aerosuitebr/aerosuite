/**
 * Execute invoke steps 0-29 via Playwright on Cursor browser; write MCP-shaped responses.
 * Same Runtime.evaluate as browser_cdp. Usage: node .cdp-run-invoke-mcp-loop.mjs [liveViewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const invokeViewId = 'd15c6f';
const liveViewId = process.argv[2] || 'b45110';
const activeViewId = liveViewId;
const requestedViewId = 'a9930e';

const cdpCandidates = [
  process.env.CURSOR_CDP_URL,
  process.env.CHROME_WS,
  'http://127.0.0.1:9222',
  'http://127.0.0.1:9223',
].filter(Boolean);

const summaryKeys = {
  4: 'cssFullRun',
  5: 'cssVerify',
  6: 'cssFinalize',
  7: 'encInit',
  13: 'enc0',
  19: 'enc1',
  25: 'enc2',
  28: 'enc3',
  29: 'encRun',
};

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) {
    return { fail: true, reason: `cssFullRun len=${value?.len} ok=${value?.ok}` };
  }
  if (i === 5 && (!value?.hasGrid || value?.b64 !== 34708)) {
    return { fail: true, reason: 'cssVerify' };
  }
  if (i === 6 && !value?.ok) return { fail: true, reason: 'cssFinalize' };
  if (i === 7 && !value?.ok) return { fail: true, reason: 'encInit' };
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) {
    return { fail: true, reason: 'encRun' };
  }
  return { fail: false };
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

let browser;
for (const url of cdpCandidates) {
  try {
    browser = await pw.chromium.connectOverCDP(url);
    break;
  } catch {
    /* try next */
  }
}
if (!browser) {
  console.log(JSON.stringify({ error: 'CDP_CONNECT_FAILED' }));
  process.exit(2);
}

const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin/post.php?post=21')) ||
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.log(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

const summary = {};
const errors = [];
let start = Number(process.env.CDP_START || 0);
const end = Number(process.env.CDP_END || 29);

for (let i = start; i <= end; i++) {
  if (i === 0 && start === 0) continue;
  const argsJson = execSync(`node .cdp-exec-invoke-step.mjs ${i} ${invokeViewId}`, {
    cwd: dir,
    encoding: 'utf8',
  }).trim();
  const args = JSON.parse(argsJson);
  try {
    const value = await evalArgs(page, args);
    const mcpShape = { result: { type: 'object', value } };
    fs.writeFileSync(path.join(dir, `.cdp-step-${i}-mcp-response.json`), JSON.stringify(mcpShape));
    const key = summaryKeys[i];
    if (key) summary[key] = value;
    const chk = checkStep(i, value);
    if (chk.fail) {
      errors.push({ step: i, value, reason: chk.reason });
      if (i === 4) {
        for (let r = 0; r <= 3; r++) {
          const a2 = JSON.parse(
            execSync(`node .cdp-exec-invoke-step.mjs ${r} ${invokeViewId}`, { cwd: dir, encoding: 'utf8' }).trim()
          );
          const v2 = await evalArgs(page, a2);
          fs.writeFileSync(
            path.join(dir, `.cdp-step-${r}-mcp-response.json`),
            JSON.stringify({ result: { type: 'object', value: v2 } })
          );
        }
        i = 3;
        continue;
      }
      break;
    }
  } catch (e) {
    errors.push({ step: i, error: String(e) });
    break;
  }
}

const out = {
  viewId: requestedViewId,
  activeViewId,
  cssFullRun: summary.cssFullRun ?? null,
  cssVerify: summary.cssVerify ?? null,
  cssFinalize: summary.cssFinalize ?? null,
  encInit: summary.encInit ?? null,
  enc0: summary.enc0 ?? null,
  enc1: summary.enc1 ?? null,
  enc2: summary.enc2 ?? null,
  enc3: summary.enc3 ?? null,
  encRun: summary.encRun ?? null,
  errors,
};
fs.writeFileSync(path.join(dir, '.cdp-final-summary.json'), JSON.stringify(out));
console.log(JSON.stringify(out));
await browser.close();
process.exit(errors.length ? 1 : 0);
