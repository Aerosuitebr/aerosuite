/**
 * Execute all .cdp-emit-*.txt batches via Playwright page.evaluate (CDP or storage).
 * Mirrors browser_cdp Runtime.evaluate with full expressions from emit files.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

const batches = [
  '.cdp-emit-0.txt',
  '.cdp-emit-1-3.txt',
  '.cdp-emit-4.txt',
  '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt',
  '.cdp-emit-13-18.txt',
  '.cdp-emit-25-28.txt',
  '.cdp-emit-19-24.txt',
  '.cdp-emit-13-18.txt',
].filter((v, i, a) => a.indexOf(v) === i);

const batchesFixed = [
  '.cdp-emit-0.txt',
  '.cdp-emit-1-3.txt',
  '.cdp-emit-4.txt',
  '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt',
  '.cdp-emit-13-18.txt',
  '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt',
  '.cdp-emit-29.txt',
];

async function connect() {
  for (const port of [9222, 9223, 9333, 19222, 8315, 9229, 18792, 9224]) {
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
      if (page) return { browser, page, mode: 'cdp', port };
    } catch {
      /* */
    }
  }
  const storage = path.join(dir, 'wp-storage.json');
  if (!fs.existsSync(storage)) return null;
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: storage });
  const page = await context.newPage();
  await page.goto('https://aerosuite.com.br/wp-admin/post.php?post=21&action=edit', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (page.url().includes('wp-login')) {
    await browser.close();
    return null;
  }
  return { browser, page, mode: 'storage' };
}

function checkpointFail(step, v) {
  if (step === 4) return !(v?.len === 34708 && v?.ok === true);
  if (step === 5) return !(v?.b64 === 34708 && v?.hasGrid === true);
  if (step === 6) return v?.ok !== true;
  if (step === 7) return v?.ok !== true;
  if (step === 29) return !(v?.ok === true && v?.hasHeroV2 === true);
  return false;
}

async function evalExpr(page, expression, awaitPromise) {
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise && v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

const conn = await connect();
if (!conn) {
  console.log(JSON.stringify({ error: 'NO_CDP_OR_STORAGE' }));
  process.exit(2);
}

const { browser, page } = conn;
const steps = {};
const errors = [];

for (const batch of batchesFixed) {
  const { params } = JSON.parse(fs.readFileSync(path.join(dir, batch), 'utf8'));
  let value;
  try {
    value = await evalExpr(page, params.expression, params.awaitPromise);
  } catch (e) {
    errors.push({ batch, error: String(e) });
    break;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (/^\d+$/.test(k)) {
        const n = Number(k);
        steps[n] = v;
        if ([4, 5, 6, 7, 29].includes(n) && checkpointFail(n, v)) {
          errors.push({ batch, step: n, checkpoint: 'fail', value: v });
          await browser.close().catch(() => {});
          console.log(
            JSON.stringify({
              steps,
              errors,
              stopped: true,
              cssFullRun: steps[4],
              cssVerify: steps[5],
              cssFinalize: steps[6],
              encInit: steps[7],
              enc0: steps[13],
              enc1: steps[19],
              enc2: steps[25],
              enc3: steps[28],
              encRun: steps[29],
            })
          );
          process.exit(1);
        }
      }
    }
  }
}

await browser.close().catch(() => {});
console.log(
  JSON.stringify({
    steps,
    errors,
    stopped: false,
    cssFullRun: steps[4],
    cssVerify: steps[5],
    cssFinalize: steps[6],
    encInit: steps[7],
    enc0: steps[13],
    enc1: steps[19],
    enc2: steps[25],
    enc3: steps[28],
    encRun: steps[29],
  })
);
