/**
 * Run .mcp-payload-0..29 via Playwright CDP (same as browser_cdp Runtime.evaluate).
 * Usage: node run-mcp-payloads-cdp.mjs [start] [end] [viewIdNote]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const viewIdNote = process.argv[4] ?? '4d6eae';

async function connect() {
  const ports = [8080, 9222, 9223, 9333, 19222, 8315, 9229, 18792, 9224];
  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, {
        signal: AbortSignal.timeout(2500),
      });
      const tabs = await res.json();
      const tab =
        tabs.find((t) => (t.url || '').includes('wp-admin/post.php?post=21')) ||
        tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser
          .contexts()
          .flatMap((c) => c.pages())
          .find((p) => (p.url() || '').includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page, port, tabUrl: tab.url };
    } catch {
      /* */
    }
  }
  return null;
}

function loadPayload(i) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, `.mcp-payload-${i}.json`), 'utf8'));
  const params = j.arguments?.params ?? j.params;
  return params;
}

function checkpointFail(step, v) {
  if (step === 4) return !(v?.len === 34708 && v?.ok === true);
  if (step === 5) return !(v?.b64 === 34708 && v?.hasGrid === true);
  if (step === 6) return v?.ok !== true;
  if (step === 7) return v?.ok !== true;
  if (step === 29) return !(v?.ok === true && v?.hasHeroV2 === true);
  return false;
}

async function evalExpr(page, params) {
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise && v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expression: params.expression, awaitPromise: !!params.awaitPromise }
  );
}

const conn = await connect();
if (!conn) {
  console.log(JSON.stringify({ error: 'NO_CDP', hint: 'use CallMcpTool browser_cdp' }));
  process.exit(2);
}

const { browser, page, port, tabUrl } = conn;
const results = {};
const errors = [];

for (let i = start; i <= end; i++) {
  const params = loadPayload(i);
  let value;
  try {
    value = await evalExpr(page, params);
  } catch (e) {
    errors.push({ step: i, error: String(e) });
    break;
  }
  results[i] = value;
  if (checkpointFail(i, value)) {
    errors.push({ step: i, checkpoint: 'fail', value });
    if (i === 4) {
      try {
        await evalExpr(page, {
          expression: `(async()=>{window.__cssParts=null;window.__cssb64='';return{cleared:true};})()`,
          awaitPromise: true,
        });
      } catch {
        /* */
      }
    }
    break;
  }
}

await browser.close().catch(() => {});

const out = { viewId: viewIdNote, port, tabUrl, results, errors };
fs.writeFileSync(path.join(dir, '.mcp-runner-final.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
