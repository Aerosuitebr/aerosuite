/**
 * Run 12 invoke deploy steps via Playwright CDP (same as browser_cdp Runtime.evaluate).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

const STEPS = [
  'css-q1', 'css-q2', 'css-q3', 'css-q4',
  'css-verify', 'css-finalize',
  'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
];
const requestedViewId = process.argv[2] || '258c93';
const startStep = process.argv[3] || STEPS[0];
const startIdx = Math.max(0, STEPS.indexOf(startStep));

async function connect() {
  for (const port of [9222, 9223, 9333, 19222, 8315, 9229]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) });
      const tabs = await res.json();
      const tab =
        tabs.find((t) => (t.url || '').includes('aerosuite.com.br/wp-admin')) ||
        tabs.find((t) => (t.url || '').includes('wp-admin'));
      if (!tab?.webSocketDebuggerUrl) continue;
      const browser = await pw.chromium.connectOverCDP(tab.webSocketDebuggerUrl);
      const page =
        browser.contexts().flatMap((c) => c.pages()).find((p) => (p.url() || '').includes('wp-admin')) ||
        browser.contexts()[0]?.pages()[0];
      if (page) return { browser, page, tabUrl: tab.url };
    } catch {
      /* next port */
    }
  }
  return null;
}

function loadStep(name) {
  return JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${name}.json`), 'utf8'));
}

function checkStep(name, value) {
  if (name === 'css-verify') {
    if (value?.b64 !== 34708 || !value?.hasGrid) {
      return `css-verify b64=${value?.b64} dec=${value?.dec} hasGrid=${value?.hasGrid}`;
    }
  }
  if (name === 'css-finalize' && !value?.ok) return 'css-finalize not ok';
  if (name === 'enc-run' && (!value?.ok || !value?.hasHeroV2)) {
    return `enc-run ok=${value?.ok} hasHeroV2=${value?.hasHeroV2}`;
  }
  return null;
}

const conn = await connect();
if (!conn) {
  console.error(JSON.stringify({ error: 'no-cdp-browser', requestedViewId }));
  process.exit(2);
}

const { browser, page, tabUrl } = conn;
const summary = { viewId: requestedViewId, tabUrl, steps: {}, errors: [] };

for (let i = startIdx; i < STEPS.length; i++) {
  const name = STEPS[i];
  const params = loadStep(name);
  try {
    const value = await page.evaluate(
      async ({ expression, awaitPromise }) => {
        const fn = eval(expression);
        return awaitPromise ? await fn : fn;
      },
      { expression: params.expression, awaitPromise: !!params.awaitPromise },
    );
    const result = { result: { type: 'object', value } };
    fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), JSON.stringify(result));
    summary.steps[name] = value;
    const fail = checkStep(name, value);
    console.log(`DONE ${name}`, JSON.stringify(value).slice(0, 200));
    if (fail) {
      summary.errors.push({ step: name, reason: fail, value });
      break;
    }
  } catch (e) {
    summary.errors.push({ step: name, error: String(e.message || e) });
    break;
  }
}

await browser.close().catch(() => {});

summary.cssVerify = summary.steps['css-verify'] ?? null;
summary.cssFinalize = summary.steps['css-finalize'] ?? null;
summary.encRun = summary.steps['enc-run'] ?? null;

fs.writeFileSync(path.join(dir, 'deploy-invoke-summary.json'), JSON.stringify(summary, null, 2));
console.log('FINAL', JSON.stringify({
  viewId: summary.viewId,
  cssVerify: summary.cssVerify,
  cssFinalize: summary.cssFinalize,
  encRun: summary.encRun,
  errors: summary.errors,
}));
process.exit(summary.errors.length ? 1 : 0);
