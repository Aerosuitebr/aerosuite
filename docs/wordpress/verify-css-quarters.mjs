import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'aerosuite-premium.css'), 'utf8');
const full = Buffer.from(css, 'utf8').toString('base64');

function extractAppend(file) {
  const ex = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')).expression;
  const m = ex.match(/__cssb64\+="([^"]+)"/);
  return m ? m[1] : null;
}

const q1ex = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-step-css-q1.json'), 'utf8')).params
  .expression;
const q1m = q1ex.match(/__cssb64='([^']+)'/);
let acc = q1m ? q1m[1] : '';
console.log('q1', acc.length);
for (const s of ['css-q2', 'css-q3', 'css-q4']) {
  const part = extractAppend(`.params-${s}.json`);
  console.log(s, part?.length ?? 'MISSING');
  acc += part ?? '';
}
console.log('full', full.length, 'acc', acc.length, 'match', acc === full);
