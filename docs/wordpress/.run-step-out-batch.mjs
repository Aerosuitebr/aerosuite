/**
 * Run steps start..end from .step-out-N.json via Playwright CDP or emit for MCP.
 * Usage: node .run-step-out-batch.mjs <start> <end> [viewId] [--mcp-emit]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewIdArg = process.argv[4] && !process.argv[4].startsWith('--') ? process.argv[4] : '46863b';
const mcpEmit = process.argv.includes('--mcp-emit');

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (i === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return `step5 b64=${value?.b64} hasGrid=${value?.hasGrid}`;
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return `step29 ok=${value?.ok} hasHeroV2=${value?.hasHeroV2}`;
  return null;
}

function loadStep(n) {
  const p = path.join(dir, `.step-out-${n}.json`);
  const args = JSON.parse(fs.readFileSync(p, 'utf8'));
  args.viewId = viewIdArg;
  return args;
}

if (mcpEmit) {
  process.stdout.write(JSON.stringify(loadStep(start)));
  process.exit(0);
}

const cdpCandidates = [
  process.env.CURSOR_CDP_URL,
  process.env.CHROME_WS,
  'http://127.0.0.1:9222',
  'http://127.0.0.1:9223',
].filter(Boolean);

const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
let browser;
let lastErr;
for (const url of cdpCandidates) {
  try {
    browser = await pw.chromium.connectOverCDP(url);
    break;
  } catch (e) {
    lastErr = e;
  }
}
if (!browser) {
  console.log(JSON.stringify({ error: 'NO_CDP', message: String(lastErr) }));
  process.exit(2);
}

const page =
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('post.php')) ||
  browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];

if (!page) {
  console.log(JSON.stringify({ error: 'NO_PAGE' }));
  process.exit(3);
}

async function evalArgs(args) {
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

const stepResults = {};
const errors = [];

for (let n = start; n <= end; n++) {
  const file = path.join(dir, `.step-out-${n}.json`);
  if (!fs.existsSync(file)) continue;
  try {
    const value = await evalArgs(loadStep(n));
    stepResults[n] = value;
    fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), JSON.stringify({ result: { type: 'object', value } }));
    const fail = checkStep(n, value);
    if (fail) {
      errors.push({ step: n, reason: fail, value });
      break;
    }
  } catch (e) {
    errors.push({ step: n, error: String(e) });
    break;
  }
}

const out = {
  viewId: 'a9930e',
  activeViewId: viewIdArg,
  tab: page.url(),
  cssFullRun: stepResults[4] ?? null,
  cssVerify: stepResults[5] ?? null,
  cssFinalize: stepResults[6] ?? null,
  encInit: stepResults[7] ?? null,
  enc0: stepResults[13] ?? null,
  enc1: stepResults[19] ?? null,
  enc2: stepResults[25] ?? null,
  enc3: stepResults[28] ?? null,
  encRun: stepResults[29] ?? null,
  errors,
};

console.log(JSON.stringify(out));
await browser.close();
process.exit(errors.length ? 1 : 0);
