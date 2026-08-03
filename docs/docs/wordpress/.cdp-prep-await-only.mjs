import fs from 'fs';
const n = process.argv[2];
const viewId = process.argv[3] || '868beb';
const r = JSON.parse(fs.readFileSync(`.cdp-step-${n}.mcp-ready.json`, 'utf8'));
const payload = { viewId, method: r.method, params: r.params };
fs.writeFileSync(`.cdp-await-${n}-args.json`, JSON.stringify(payload));
console.log(JSON.stringify({ step: Number(n), exprLen: payload.params.expression.length }));
