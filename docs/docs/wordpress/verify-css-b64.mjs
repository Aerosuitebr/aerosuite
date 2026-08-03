import fs from 'fs';

const steps = [
  ['q1', '.mcp-step-css-q1.json', true],
  ['q2', '.params-css-q2.json', false],
  ['q3', '.params-css-q3.json', false],
  ['q4', '.params-css-q4.json', false],
];

let b64 = '';
for (const [name, file, nested] of steps) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const expr = nested ? raw.params.expression : raw.expression;
  const chunks = [...expr.matchAll(/window\.__cssb64(?:=\''|\+\=)\"([^\"]+)\"/g)];
  for (const c of chunks) b64 += c[1];
  console.error(name, 'chunks', chunks.length, 'total', b64.length);
}

console.log(JSON.stringify({ b64: b64.length, dec: Buffer.from(b64, 'base64').length, hasGrid: Buffer.from(b64, 'base64').toString('utf8').includes('as-hero-v2__grid') }));
