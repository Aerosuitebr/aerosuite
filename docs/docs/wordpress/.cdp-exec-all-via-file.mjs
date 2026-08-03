/**
 * Execute all batch JSON files via page.evaluate on wp-admin.
 * Requires Chrome remote debugging OR Cursor browser CDP URL in CDP_WS_URL.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const viewId = process.argv[2] || 'dab36f';
const startBatch = Number(process.argv[3] ?? 2);
const endBatch = Number(process.argv[4] ?? 8);

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

async function connect() {
  const wsEnv = process.env.CDP_WS_URL;
  if (wsEnv) {
    const browser = await pw.chromium.connectOverCDP(wsEnv);
    const page =
      browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
      browser.contexts()[0]?.pages()[0];
    if (page) return { browser, page };
  }
  for (const port of [9222, 9223, 9333, 19222, 8315, 9229, 18792, 9224]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000) });
      const tabs = await res.json();
      const tab =
        tabs.find((t) => (t.url || '').includes('wp-admin/post.php?post=21')) ||
        tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page };
    } catch {
      /* */
    }
  }
  return null;
}

const conn = await connect();
if (!conn) {
  console.error(JSON.stringify({ error: 'NO_CDP' }));
  process.exit(2);
}

const { browser, page } = conn;
const stepResults = {};
const errors = [];

for (let b = startBatch; b <= endBatch; b++) {
  const p = path.join(dir, `.cdp-mcp-batch-${b}.json`);
  if (!fs.existsSync(p)) {
    errors.push({ batch: b, error: 'missing' });
    break;
  }
  const { params } = JSON.parse(fs.readFileSync(p, 'utf8'));
  const value = await page.evaluate(`return ${params.expression}`);
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (/^\d+$/.test(k)) stepResults[Number(k)] = v;
    }
  }
  fs.writeFileSync(path.join(dir, `.cdp-pw-result-${b}.json`), JSON.stringify(value));
  console.log(JSON.stringify({ batch: b, value }));
  if (b === 2 && (stepResults[4]?.len !== 34708 || !stepResults[4]?.ok)) {
    errors.push({ step: 4, value: stepResults[4] });
    break;
  }
  if (b === 3) {
    if (stepResults[5]?.b64 !== 34708 || !stepResults[5]?.hasGrid) errors.push({ step: 5, value: stepResults[5] });
    if (!stepResults[6]?.ok) errors.push({ step: 6, value: stepResults[6] });
    if (!stepResults[7]?.ok) errors.push({ step: 7, value: stepResults[7] });
    if (errors.length) break;
  }
  if (b === 8 && (!stepResults[29]?.ok || !stepResults[29]?.hasHeroV2)) {
    errors.push({ step: 29, value: stepResults[29] });
    break;
  }
}

await browser.close().catch(() => {});

const out = {
  viewId: 'a9930e',
  activeViewId: viewId,
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
fs.writeFileSync(path.join(dir, '.cdp-final-output.json'), JSON.stringify(out));
console.log(JSON.stringify(out));
process.exit(errors.length ? 1 : 0);
