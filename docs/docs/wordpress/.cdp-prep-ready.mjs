import fs from 'fs';
const n = process.argv[2];
const viewId = process.argv[3] || '379d4b';
const a = JSON.parse(fs.readFileSync(`.cdp-step-${n}.mcp-ready.json`, 'utf8'));
a.viewId = viewId;
const payload = { viewId: a.viewId, method: a.method, params: a.params };
fs.writeFileSync('.cdp-current-mcp-args.json', JSON.stringify(payload));
console.log(JSON.stringify({ step: Number(n), exprLen: payload.params?.expression?.length ?? 0 }));
