/**
 * Run manifest steps 1-29 via Playwright CDP on the Cursor browser.
 * Usage: node cdp-run-all.mjs <cdpWsUrl> [viewIdNote]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const cdpUrl = process.argv[2];
const requestedViewId = process.argv[3] || 'a9930e';
const activeViewId = process.argv[4] || '8a2e1a';

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

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708))
    return { fail: true, reason: 'cssFullRun', value };
  if (i === 5 && (!value?.hasGrid || value?.b64 !== 34708))
    return { fail: true, reason: 'cssVerify', value };
  if (i === 6 && !value?.ok) return { fail: true, reason: 'cssFinalize', value };
  if (i === 7 && !value?.ok) return { fail: true, reason: 'encInit', value };
  if (i === 29 && (!value?.ok || !value?.hasHeroV2))
    return { fail: true, reason: 'encRun', value };
  return { fail: false };
}

async function main() {
  if (!cdpUrl) {
    console.log(JSON.stringify({ ...summary, errors: [{ error: 'NO_CDP_URL' }] }));
    process.exit(2);
  }
  const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
  const browser = await pw.chromium.connectOverCDP(cdpUrl);
  const page =
    browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
    browser.contexts()[0]?.pages()[0];
  if (!page) {
    console.log(JSON.stringify({ ...summary, errors: [{ error: 'NO_PAGE' }] }));
    process.exit(3);
  }

  for (let n = 1; n <= 29; n++) {
    const argsPath = path.join(dir, `.cdp-step-${n}.args.json`);
    const args = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
    const { expression, awaitPromise, returnByValue } = args.params;
    try {
      const value = await page.evaluate(
        async ({ expression, awaitPromise }) => {
          let v = eval(expression);
          if (awaitPromise) v = await v;
          return v;
        },
        { expression, awaitPromise: !!awaitPromise }
      );
      const key = summaryKeys[n];
      if (key) summary[key] = value;
      const chk = checkStep(n, value);
      if (chk.fail) {
        summary.errors.push({ step: n, reason: chk.reason, value: chk.value });
        break;
      }
    } catch (e) {
      summary.errors.push({ step: n, error: String(e) });
      break;
    }
  }
  await browser.close();
  console.log(JSON.stringify(summary));
  process.exit(summary.errors.length ? 1 : 0);
}

main();
