import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const i = Number(process.argv[2]);
const payloads = JSON.parse(fs.readFileSync(path.join(dir, 'step-payloads.json'), 'utf8'));
if (!Number.isInteger(i) || i < 0 || i >= payloads.length) {
  console.error('index out of range', i, payloads.length);
  process.exit(1);
}
const out = path.join(dir, 'step-current.json');
fs.writeFileSync(out, JSON.stringify(payloads[i]));
console.log(payloads[i].name, payloads[i].awaitPromise, payloads[i].expression.length);
