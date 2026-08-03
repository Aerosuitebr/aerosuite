import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const batches = [
  '.cdp-emit-0.txt',
  '.cdp-emit-1-3.txt',
  '.cdp-emit-4.txt',
  '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt',
  '.cdp-emit-13-18.txt',
  '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt',
  '.cdp-emit-29.txt',
];

const idx = parseInt(process.argv[2] ?? '0', 10);
const name = batches[idx];
if (!name) {
  console.error('invalid batch index', idx);
  process.exit(1);
}
const j = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
process.stdout.write(JSON.stringify({ viewId: j.viewId, method: j.method, params: j.params }));
