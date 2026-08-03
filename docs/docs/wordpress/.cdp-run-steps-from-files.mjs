/**
 * Run step arg files 1..3 then batches 2..8 via page.evaluate.
 * Set CDP_WS_URL or ensure Chrome 9222 has wp-admin tab.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

async function connect() {
  const wsEnv = process.env.CDP_WS_URL;
  if (wsEnv) {
    const browser = await pw.chromium.connectOverCDP(wsEnv);
    const page =
      browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
      browser.contexts()[0]?.pages()[0];
    if (page) return { browser, page };
  }
  for (const port of [9222, 9223, 9333, 19222, 8315, 9229, 18792]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2500) });
      const tabs = await res.json();
      const tab =
        tabs.find((t) => (t.url || '').includes('wp-admin/post.php?post=21')) ||
        tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page, port };
    } catch {
      /* */
    }
  }
  return null;
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

const conn = await connect();
if (!conn) {
  console.log(JSON.stringify({ error: 'NO_CDP', hint: 'use CallMcpTool browser_cdp' }));
  process.exit(2);
}

const { browser, page, port } = conn;
const stepResults = {};
const errors = [];

// batch 0
const b0 = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-mcp-batch-0.json'), 'utf8'));
await evalExpr(page, b0.params.expression);

for (let n = 1; n <= 3; n++) {
  const a = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-step-${n}-args.json`), 'utf8'));
  const v = await evalExpr(page, a.params.expression);
  console.log(JSON.stringify({ step: n, v }));
}

for (let b = 2; b <= 8; b++) {
  const payload = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-mcp-batch-${b}.json`), 'utf8'));
  const v = await evalExpr(page, payload.params.expression);
  if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v)) {
      if (/^\d+$/.test(k)) stepResults[Number(k)] = val;
    }
  }
  console.log(JSON.stringify({ batch: b, v }));
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
  activeViewId: 'dab36f',
  port: port ?? null,
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
process.exit(errors.length ? 1 : 0);
