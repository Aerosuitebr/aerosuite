import fs from 'fs';
const batches = [0, 1, 2, 3];
let total = 0;
for (const b of batches) {
  const j = JSON.parse(fs.readFileSync(`.cdp-step-${b}.args.json`, 'utf8'));
  const re = /__cssParts\[(\d+)\]="([^"]*)"/g;
  let m;
  let len = 0;
  const indices = [];
  while ((m = re.exec(j.params.expression))) {
    len += m[2].length;
    indices.push(Number(m[1]));
  }
  console.log(`batch ${b}: parts ${indices.join(',')} chars ${len}`);
  total += len;
}
console.log('total', total, 'expected 34708 diff', 34708 - total);
