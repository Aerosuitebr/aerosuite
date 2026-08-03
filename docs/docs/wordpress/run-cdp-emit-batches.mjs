/**
 * Run all .cdp-emit batch files via Playwright CDP (same eval as browser_cdp).
 * Outputs final summary JSON to stdout.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));

const batches = [
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

const cdpCandidates = [
  process.env.CURSOR_CDP_URL,
  process.env.CHROME_WS,
  'http://127.0.0.1:9222',
  'http://127.0.0.1:9223',
].filter(Boolean);

function checkCheckpoint(stepResults, errors) {
  const s4 = stepResults[4];
  if (s4 && (s4.len !== 34708 || !s4.ok)) {
    errors.push({ step: 4, reason: 'cssFullRun checkpoint', value: s4 });
    return false;
  }
  const s5 = stepResults[5];
  if (s5 && (s5.b64 !== 34708 || !s5.hasGrid)) {
    errors.push({ step: 5, reason: 'cssVerify checkpoint', value: s5 });
    return false;
  }
  const s6 = stepResults[6];
  if (s6 && !s6.ok) {
    errors.push({ step: 6, reason: 'cssFinalize checkpoint', value: s6 });
    return false;
  }
  const s7 = stepResults[7];
  if (s7 && !s7.ok) {
    errors.push({ step: 7, reason: 'encInit checkpoint', value: s7 });
    return false;
  }
  const s29 = stepResults[29];
  if (s29 && (!s29.ok || !s29.hasHeroV2)) {
    errors.push({ step: 29, reason: 'encRun checkpoint', value: s29 });
    return false;
  }
  return true;
}

async function evalBatch(page, payload) {
  const { expression, awaitPromise } = payload.params;
  return page.evaluate(
    async ({ expression, awaitPromise }) => {
      let v = eval(expression);
      if (awaitPromise) v = await v;
      return v;
    },
    { expression, awaitPromise: !!awaitPromise }
  );
}

function mergeStepResults(value, stepResults) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value);
    if (keys.length && keys.every((k) => /^\d+$/.test(k))) {
      for (const k of keys) stepResults[Number(k)] = value[k];
      return;
    }
  }
  // single-step batches store step in return or infer from context
}

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

const stepResults = {};
const errors = [];
const batchStepMap = [
  { batch: 0, steps: [] },
  { batch: 1, steps: [1, 2, 3] },
  { batch: 2, steps: [4] },
  { batch: 3, steps: [5, 6, 7] },
  { batch: 4, steps: [8, 9, 10, 11, 12] },
  { batch: 5, steps: [13, 14, 15, 16, 17, 18] },
  { batch: 6, steps: [19, 20, 21, 22, 23, 24] },
  { batch: 7, steps: [25, 26, 27, 28] },
  { batch: 8, steps: [29] },
];

if (!browser) {
  console.log(JSON.stringify({ error: 'CDP_CONNECT_FAILED', message: String(lastErr) }));
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

let stop = false;
for (let bi = 0; bi < batches.length && !stop; bi++) {
  const file = path.join(dir, batches[bi]);
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  try {
    const value = await evalBatch(page, payload);
    fs.writeFileSync(path.join(dir, `.cdp-batch-${bi}-result.json`), JSON.stringify(value));
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const keys = Object.keys(value);
      if (keys.some((k) => /^\d+$/.test(k))) {
        for (const k of keys) {
          if (/^\d+$/.test(k)) stepResults[Number(k)] = value[k];
        }
      } else if (batchStepMap[bi].steps.length === 1) {
        stepResults[batchStepMap[bi].steps[0]] = value;
      } else if (bi === 0) {
        // step 0 reset - no checkpoint
      }
    }
    // checkpoint after specific batches
    if (bi === 2 && (stepResults[4]?.len !== 34708 || !stepResults[4]?.ok)) {
      errors.push({ batch: bi, step: 4, value: stepResults[4] });
      stop = true;
    }
    if (bi === 3) {
      if (stepResults[5]?.b64 !== 34708 || !stepResults[5]?.hasGrid) {
        errors.push({ batch: bi, step: 5, value: stepResults[5] });
        stop = true;
      } else if (!stepResults[6]?.ok) {
        errors.push({ batch: bi, step: 6, value: stepResults[6] });
        stop = true;
      } else if (!stepResults[7]?.ok) {
        errors.push({ batch: bi, step: 7, value: stepResults[7] });
        stop = true;
      }
    }
    if (bi === 8 && (!stepResults[29]?.ok || !stepResults[29]?.hasHeroV2)) {
      errors.push({ batch: bi, step: 29, value: stepResults[29] });
      stop = true;
    }
  } catch (e) {
    errors.push({ batch: bi, error: String(e) });
    stop = true;
  }
}

await browser.close();

const out = {
  viewId: 'a9930e',
  activeViewId: '8e6349',
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
  stepResults,
};
console.log(JSON.stringify(out));
