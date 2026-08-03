import fs from 'fs';

const start = Number(process.argv[2] ?? 3);
const end = Number(process.argv[3] ?? 29);
const port = process.argv[4] ?? 45678;
const viewId = process.argv[5] ?? '6eb035';

const checks = `
  if (n === 4 && (!v?.ok || v?.len !== 34708)) return { ok: false, failedAt: 4, out, value: v };
  if (n === 5 && (!v?.hasGrid || v?.b64 !== 34708)) return { ok: false, failedAt: 5, out, value: v };
  if (n === 6 && !v?.ok) return { ok: false, failedAt: 6, out, value: v };
  if (n === 7 && !v?.ok) return { ok: false, failedAt: 7, out, value: v };
  if (n === 29 && (!v?.ok || !v?.hasHeroV2)) return { ok: false, failedAt: 29, out, value: v };
`;

const loop = `
  const out = {};
  for (let n = ${start}; n <= ${end}; n++) {
    const { expr } = await (await fetch('http://127.0.0.1:${port}/' + n)).json();
    let v = eval(expr);
    if (v && typeof v.then === 'function') v = await v;
    out[n] = v;
    ${checks.replace(/\bn\b/g, 'n')}
  }
  return { ok: true, out };
`;

const expression = `(async()=>{${loop}})()`;
const payload = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression, awaitPromise: true, returnByValue: true },
};
fs.writeFileSync('.cdp-mcp-fetch-batch.json', JSON.stringify(payload));
console.log(JSON.stringify({ start, end, port, exprLen: expression.length }));
