import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const chunks = [
  '.cdp-q2-1-expr.txt',
  '.cdp-q2-2-expr.txt',
  '.cdp-q3-0-expr.txt',
  '.cdp-q3-1-expr.txt',
  '.cdp-q3-2-expr.txt',
  '.cdp-q4-0-expr.txt',
  '.cdp-q4-1-expr.txt',
  '.cdp-q4-2-expr.txt',
];
const payloads = chunks.map((f) => {
  const expression = fs.readFileSync(path.join(dir, f), 'utf8');
  return { file: f, len: expression.length, expression };
});
fs.writeFileSync(path.join(dir, '.chunk-payloads.json'), JSON.stringify(payloads));
console.log('wrote', payloads.length, 'chunks');
