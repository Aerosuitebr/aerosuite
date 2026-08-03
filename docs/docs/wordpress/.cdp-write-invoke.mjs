import fs from 'fs';
const src = process.argv[2] || '.cdp-call-now.json';
const call = JSON.parse(fs.readFileSync(src, 'utf8'));
const { method, params, viewId } = call.step !== undefined ? call : call;
const out = { method, params, viewId: viewId || call.viewId };
fs.writeFileSync('.cdp-invoke-min.json', JSON.stringify(out));
console.log(JSON.stringify({ step: call.step, viewId: out.viewId, exprLen: params?.expression?.length ?? 0 }));
