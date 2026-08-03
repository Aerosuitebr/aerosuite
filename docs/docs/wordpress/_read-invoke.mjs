import fs from 'fs';
const j = JSON.parse(fs.readFileSync('.cdp-mcp-invoke.json', 'utf8'));
process.stdout.write(JSON.stringify({ method: j.method, params: j.params, viewId: j.viewId }));
