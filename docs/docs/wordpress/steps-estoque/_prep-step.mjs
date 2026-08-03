import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const idx = Number(process.argv[2] ?? 0);
const steps = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));
if (idx < 0 || idx >= steps.length) {
  console.error('OUT_OF_RANGE', idx, steps.length);
  process.exit(1);
}
const step = steps[idx];
fs.writeFileSync(
  path.join(dir, '_current-step.json'),
  JSON.stringify({ index: idx, total: steps.length, ...step })
);
console.log('STEP', idx, step.name, step.awaitPromise);
