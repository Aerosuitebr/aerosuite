import fs from 'fs';
const n = process.argv[2];
const viewId = process.argv[3] || '265634';
const src = JSON.parse(fs.readFileSync(`.cdp-invoke-${n}.json`, 'utf8'));
const out = { viewId, method: src.method, params: src.params };
fs.writeFileSync('.cdp-invoke-now.json', JSON.stringify(out));
console.log(JSON.stringify({ step: Number(n), exprLen: out.params.expression.length }));
