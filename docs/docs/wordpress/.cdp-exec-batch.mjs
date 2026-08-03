import fs from 'fs';
const n = Number(process.argv[2]);
const j = JSON.parse(fs.readFileSync(`.cdp-mcp-invoke-${n}.json`, 'utf8'));
process.stdout.write(JSON.stringify({ method: j.method, params: j.params, viewId: j.viewId }));
