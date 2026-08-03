import fs from 'fs';

const steps = [
  ['css-q1', '.mcp-step-css-q1.json', true],
  ['css-q2', '.params-css-q2.json', false],
  ['css-q3', '.params-css-q3.json', false],
  ['css-q4', '.params-css-q4.json', false],
];

let b64 = '';
global.window = {
  get __cssb64() {
    return b64;
  },
  set __cssb64(v) {
    b64 = v;
  },
};

for (const [name, file, nested] of steps) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const expr = nested ? raw.params.expression : raw.expression;
  // eslint-disable-next-line no-await-in-loop, no-eval
  const r = await eval(expr);
  console.error(name, r, 'len', b64.length);
}

let ok = true;
let err = '';
try {
  Buffer.from(b64, 'base64');
} catch (e) {
  ok = false;
  err = String(e.message);
}
const bad = [...b64].filter((c) => !/[A-Za-z0-9+/=]/.test(c));

console.log(
  JSON.stringify({
    len: b64.length,
    atobOk: ok,
    err,
    badCount: bad.length,
    badSample: bad.slice(0, 5),
    dec: ok ? Buffer.from(b64, 'base64').length : null,
    hasGrid: ok ? Buffer.from(b64, 'base64').toString('utf8').includes('as-hero-v2__grid') : null,
  })
);
