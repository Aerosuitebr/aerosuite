import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '041fe0';
const batches = ['3', '4-7', '8-13', '14-19', '20-25', '26-29'];

for (const b of batches) {
  const invokePath =
    b === '3'
      ? path.join(dir, '.cdp-step-3.call.json')
      : path.join(dir, `.cdp-combined-${b}-invoke.json`);
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
    console.log(JSON.stringify({ error: 'timeout', batch: b }));
    process.exit(1);
  }
  const value = result?.result?.value ?? result?.value ?? result;
  fs.writeFileSync(path.join(dir, `.cdp-batch-${b}-out.json`), JSON.stringify(value));
  console.log(`DONE ${b}`, JSON.stringify(value).slice(0, 200));
  if (value?.ok === false || value?.__error) {
    console.log(JSON.stringify({ error: 'step failed', batch: b, value }));
    process.exit(1);
  }
  if (b === '4-7') {
    const o = value.out || value;
    if (!o[4]?.ok || o[4]?.len !== 34708) process.exit(1);
    if (!o[5]?.hasGrid || o[5]?.b64 !== 34708) process.exit(1);
    if (!o[6]?.ok) process.exit(1);
    if (!o[7]?.ok) process.exit(1);
  }
  if (b === '26-29') {
    const o = value.out || value;
    const encRun = o[29] || value;
    if (!encRun?.ok || !encRun?.hasHeroV2) process.exit(1);
  }
}

console.log('ALL_DONE');
