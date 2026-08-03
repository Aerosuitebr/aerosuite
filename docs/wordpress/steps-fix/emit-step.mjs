import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const i = Number(process.argv[2] ?? 0);
const inv = JSON.parse(fs.readFileSync(path.join(dir, 'all-invocations.json'), 'utf8'));
const step = inv[i];
if (!step) {
  console.log('DONE');
  process.exit(0);
}
const out = {
  step: i,
  name: step.name,
  method: 'Runtime.evaluate',
  params: {
    expression: step.expression,
    awaitPromise: step.awaitPromise,
    returnByValue: step.awaitPromise,
  },
};
fs.writeFileSync(path.join(dir, 'emit-step.json'), JSON.stringify(out));
fs.writeFileSync(path.join(dir, `invoke-${i}.json`), JSON.stringify(out));
console.log('STEP', i, step.name, step.awaitPromise, step.expression.length);
