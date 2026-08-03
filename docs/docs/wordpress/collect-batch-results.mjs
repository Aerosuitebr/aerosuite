import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const batches = [
  ['.cdp-combined-1-3.json', [1, 2, 3]],
  ['.cdp-combined-4-4.json', [4]],
  ['.cdp-combined-5-7.json', [5, 6, 7]],
  ['.cdp-combined-8-12.json', [8, 9, 10, 11, 12]],
  ['.cdp-combined-13-18.json', [13, 14, 15, 16, 17, 18]],
  ['.cdp-combined-19-24.json', [19, 20, 21, 22, 23, 24]],
  ['.cdp-combined-25-28.json', [25, 26, 27, 28]],
  ['.cdp-combined-29-29.json', [29]],
];

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

const results = {};
const errors = [];

for (const [file, steps] of batches) {
  const outPath = path.join(dir, `.cdp-step-batch-${steps[0]}.mcp-out.json`);
  if (!fs.existsSync(outPath)) {
    errors.push({ batch: file, error: 'missing mcp-out', steps });
    break;
  }
  const raw = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const value = raw?.result?.value ?? raw?.value ?? raw;
  for (const s of steps) {
    results[s] = value[s] ?? value;
  }
}

function check(n, v) {
  if (n === 4 && (!v?.ok || v?.len !== 34708)) return `step4 ${JSON.stringify(v)}`;
  if (n === 5 && (!v?.hasGrid || v?.b64 !== 34708)) return `step5 ${JSON.stringify(v)}`;
  if (n === 6 && !v?.ok) return 'step6';
  if (n === 7 && !v?.ok) return 'step7';
  if (n === 29 && (!v?.ok || !v?.hasHeroV2)) return `step29 ${JSON.stringify(v)}`;
  return null;
}

for (const n of [4, 5, 6, 7, 29]) {
  const fail = check(n, results[n]);
  if (fail) errors.push({ step: n, reason: fail, value: results[n] });
}

const out = {
  viewId: 'a9930e',
  activeViewId: process.argv[2] || '8e6349',
  cssFullRun: results[4] ?? null,
  cssVerify: results[5] ?? null,
  cssFinalize: results[6] ?? null,
  encInit: results[7] ?? null,
  enc0: results[13] ?? null,
  enc1: results[19] ?? null,
  enc2: results[25] ?? null,
  enc3: results[28] ?? null,
  encRun: results[29] ?? null,
  errors,
};
console.log(JSON.stringify(out));
process.exit(errors.length ? 1 : 0);
