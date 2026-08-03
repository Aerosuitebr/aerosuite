import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const idx = Number(process.argv[2]);
const q = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-call-queue.json'), 'utf8'));
const item = q.queue[idx];
if (!item) {
  console.error(JSON.stringify({ error: 'no item', idx, count: q.queue.length }));
  process.exit(1);
}
console.log(JSON.stringify({ idx, step: item.step, type: item.type, rel: item.rel, call: item.call }));
