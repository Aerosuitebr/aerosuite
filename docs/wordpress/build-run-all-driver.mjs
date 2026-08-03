import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const steps = [
  { key: 'preload', file: '.params-css-preload-17354.json' },
  { key: 'css-q3', file: '.params-css-q3.json' },
  { key: 'css-q4', file: '.params-css-q4.json' },
  { key: 'cssVerify', file: '.params-css-verify.json' },
  { key: 'cssFinalize', file: '.params-css-finalize.json' },
  { key: 'enc-init', file: '.params-enc-init.json' },
  { key: 'enc-0', file: '.params-enc-0.json' },
  { key: 'enc-1', file: '.params-enc-1.json' },
  { key: 'enc-2', file: '.params-enc-2.json' },
  { key: 'enc-3', file: '.params-enc-3.json' },
  { key: 'encRun', file: '.params-enc-run.json' },
];

const embedded = steps.map(({ key, file }) => {
  const { expression } = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  return { key, expression };
});

const driver = `(async()=>{
  const steps = ${JSON.stringify(embedded)};
  const out = { errors: [] };
  for (const { key, expression } of steps) {
    try {
      out[key] = await eval(expression);
    } catch (e) {
      out.errors.push({ step: key, error: String(e && e.message || e) });
      break;
    }
  }
  return out;
})()`;

const payload = {
  method: 'Runtime.evaluate',
  params: { expression: driver, awaitPromise: true, returnByValue: true },
  viewId: process.argv[2] || '9a6000',
};

fs.writeFileSync(path.join(dir, '.cdp-run-all-steps.json'), JSON.stringify(payload));
console.log('driver chars', driver.length);
console.log('written .cdp-run-all-steps.json');
