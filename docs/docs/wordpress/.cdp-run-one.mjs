import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const n = Number(process.argv[2]);
if (!Number.isInteger(n) || n < 0 || n > 14) {
  console.error('usage: node .cdp-run-one.mjs <0-14>');
  process.exit(1);
}
const base = path.dirname(fileURLToPath(import.meta.url));
const file =
  n <= 13 ? `deploy-manifest-${n}.js` : 'deploy-manifest-run.js';
const expression = fs.readFileSync(path.join(base, file), 'utf8').trim();
const out = path.join(base, '.cdp-next-invoke.json');
fs.writeFileSync(
  out,
  JSON.stringify({ file, expression, index: n }),
  'utf8'
);
console.log(file, expression.length);
