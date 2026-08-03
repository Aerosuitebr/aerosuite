import fs from 'fs';
const batch = process.argv[2];
const viewId = process.argv[3] ?? '041fe0';
const a = JSON.parse(fs.readFileSync(`.cdp-combined-${batch}-invoke.json`, 'utf8'));
a.viewId = viewId;
fs.writeFileSync('.cdp-next-call.json', JSON.stringify({ viewId: a.viewId, method: a.method, params: a.params }));
console.log('batch', batch, 'exprLen', a.params.expression.length);
