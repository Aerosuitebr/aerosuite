import fs from 'fs';
const n = Number(process.argv[2]);
const inv = JSON.parse(fs.readFileSync(`.cdp-invoke-${n}.json`, 'utf8'));
const payload = { viewId: inv.viewId, method: inv.method, params: inv.params };
fs.writeFileSync('.cdp-mcp-call.json', JSON.stringify(payload));
console.log(JSON.stringify({ step: n, exprLen: payload.params?.expression?.length }));
