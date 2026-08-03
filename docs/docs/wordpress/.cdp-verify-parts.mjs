import fs from 'fs';

const parts = {};
for (let n = 0; n <= 3; n++) {
  const j = JSON.parse(fs.readFileSync(`.cdp-step-${n}.invoke.json`, 'utf8'));
  const e = j.params.expression;
  const re = /window\.__cssParts\[(\d+)\]="([^"]+)"/g;
  let m;
  while ((m = re.exec(e))) parts[m[1]] = m[2];
}
const keys = Object.keys(parts).map(Number).sort((a, b) => a - b);
const joined = keys.map((k) => parts[k]).join('');
console.log('parts', keys.length, 'min', keys[0], 'max', keys[keys.length - 1], 'b64len', joined.length);
const css = Buffer.from(joined, 'base64').toString('utf8');
console.log('dec', css.length, 'hasGrid', css.includes('as-hero-v2__grid'));
