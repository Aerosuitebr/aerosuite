import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const idx = Number(process.argv[2] ?? 0);
const steps = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));
const step = steps[idx];
if (!step) process.exit(1);
fs.writeFileSync(path.join(dir, '_expr-only.txt'), step.expression);
console.log(JSON.stringify({ index: idx, name: step.name, awaitPromise: step.awaitPromise, len: step.expression.length }));
