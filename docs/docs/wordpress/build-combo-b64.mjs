import fs from 'fs';
const step = Number(process.argv[2] ?? 0);
const from = Number(process.argv[3] ?? 2);
const to = Number(process.argv[4] ?? 11);
const viewId = process.argv[5] || '4d6eae';
const calls = JSON.parse(fs.readFileSync(`.mcp-b64-calls-${step}.json`, 'utf8'));
const parts = calls.slice(from, to).map((c) => c.params.expression);
const final = calls[to].params.expression;
const combo =
  '(async()=>{' +
  parts.map((p) => `eval(${JSON.stringify(p)});`).join('') +
  `return await eval(${JSON.stringify(final)});})()`;
const args = {
  viewId,
  method: 'Runtime.evaluate',
  params: { expression: combo, awaitPromise: true, returnByValue: true },
};
const out = `.mcp-combo-${step}-${from}-${to}.json`;
fs.writeFileSync(out, JSON.stringify(args));
console.log(JSON.stringify({ out, comboLen: combo.length }));
