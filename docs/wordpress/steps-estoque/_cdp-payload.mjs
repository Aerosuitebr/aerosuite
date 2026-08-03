import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '263924';
const idx = Number(process.argv[3] ?? 0);
const steps = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));
const step = steps[idx];
const raw = fs.readFileSync(path.join(dir, step.name), 'utf8').trim();
const expression = step.awaitPromise ? raw : `new Function(${JSON.stringify(raw)})()`;
const payload = {
  method: 'Runtime.evaluate',
  params: { expression, returnByValue: true, awaitPromise: step.awaitPromise },
  viewId,
};
fs.writeFileSync(path.join(dir, '_cdp-payload.json'), JSON.stringify(payload));
console.log(JSON.stringify({ index: idx, name: step.name, awaitPromise: step.awaitPromise, len: expression.length }));
