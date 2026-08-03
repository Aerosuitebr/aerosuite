import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '8e6349';

const files = [
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

const idx = Number(process.argv[3] ?? 0);
if (idx >= files.length) {
  console.log(JSON.stringify({ done: true }));
  process.exit(0);
}

const args = JSON.parse(fs.readFileSync(path.join(dir, files[idx]), 'utf8'));
args.viewId = viewId;
fs.writeFileSync(path.join(dir, '.cdp-current-batch.json'), JSON.stringify(args));
console.log(JSON.stringify({ idx, file: files[idx], exprLen: args.params?.expression?.length ?? 0 }));
