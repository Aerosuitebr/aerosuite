import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '041fe0';
const batches = ['1-3', '4-7', '8-13', '14-19', '20-25', '26-29'];
const summary = {
  viewId: 'a9930e',
  activeViewId: viewId,
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

for (const b of batches) {
  const invokePath = path.join(dir, `.cdp-combined-${b}-invoke.json`);
  const a = JSON.parse(fs.readFileSync(invokePath, 'utf8'));
  a.viewId = viewId;
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(a));
  if (fs.existsSync(path.join(dir, '.cdp-current-mcp-result.json')))
    fs.unlinkSync(path.join(dir, '.cdp-current-mcp-result.json'));
  console.log(`AWAIT ${b} exprLen=${a.params.expression.length}`);
  let result = null;
  for (let t = 0; t < 1200; t++) {
    if (fs.existsSync(path.join(dir, '.cdp-current-mcp-result.json'))) {
      result = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-current-mcp-result.json'), 'utf8'));
      break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!result) {
    summary.errors.push({ batch: b, error: 'timeout' });
    break;
  }
  const value = result?.result?.value ?? result?.value ?? result;
  fs.writeFileSync(path.join(dir, `.cdp-batch-${b}-out.json`), JSON.stringify(value));
  console.log(`DONE ${b}`, JSON.stringify(value).slice(0, 300));

  const o = value?.out || {};
  if (b === '4-7') {
    summary.cssFullRun = o[4] ?? null;
    summary.cssVerify = o[5] ?? null;
    summary.cssFinalize = o[6] ?? null;
    summary.encInit = o[7] ?? null;
    if (!o[4]?.ok || o[4]?.len !== 34708) summary.errors.push({ batch: b, step: 4, value: o[4] });
    if (!o[5]?.hasGrid || o[5]?.b64 !== 34708) summary.errors.push({ batch: b, step: 5, value: o[5] });
    if (!o[6]?.ok) summary.errors.push({ batch: b, step: 6, value: o[6] });
    if (!o[7]?.ok) summary.errors.push({ batch: b, step: 7, value: o[7] });
  }
  if (b === '8-13') summary.enc0 = o[13] ?? null;
  if (b === '14-19') summary.enc1 = o[19] ?? null;
  if (b === '20-25') summary.enc2 = o[25] ?? null;
  if (b === '26-29') {
    summary.enc3 = o[28] ?? null;
    summary.encRun = o[29] ?? null;
    if (!o[29]?.ok || !o[29]?.hasHeroV2) summary.errors.push({ batch: b, step: 29, value: o[29] });
  }
  if (value?.ok === false || value?.__error) {
    summary.errors.push({ batch: b, value });
    break;
  }
  if (summary.errors.length) break;
}

fs.writeFileSync(path.join(dir, '.cdp-final-summary.json'), JSON.stringify(summary, null, 2));
console.log('FINAL ' + JSON.stringify(summary));
