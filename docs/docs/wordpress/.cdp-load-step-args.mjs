import fs from 'fs';
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '3d225d';
const ready = `.cdp-step-${n}.mcp-ready.json`;
const a = JSON.parse(fs.readFileSync(ready, 'utf8'));
a.viewId = viewId;
process.stdout.write(JSON.stringify({ viewId: a.viewId, method: a.method, params: a.params }));
