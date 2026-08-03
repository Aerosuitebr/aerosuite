import fs from 'fs';

function chunkLens(expr) {
  const lens = [];
  for (const m of expr.matchAll(/__cssb64(?:\+)?=['"]([^'"]*)['"]/g)) {
    if (m[1].length) lens.push(m[1].length);
  }
  return lens;
}

let total = 0;
for (const s of ['css-q1', 'css-q2', 'css-q3', 'css-q4']) {
  const inv = JSON.parse(fs.readFileSync(`.invoke-${s}.json`, 'utf8'));
  const st = fs.readFileSync(`step-${s}.expr.txt`, 'utf8');
  const a = chunkLens(inv.expression);
  const b = chunkLens(st);
  const sumA = a.reduce((x, y) => x + y, 0);
  const sumB = b.reduce((x, y) => x + y, 0);
  total += sumA;
  console.log(s, { invoke: a, step: b, sumInvoke: sumA, sumStep: sumB });
}
console.log('total invoke chunks', total, 'expected b64', 34708, 'delta', 34708 - total);
