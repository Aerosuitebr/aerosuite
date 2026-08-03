import fs from 'fs';
const a = JSON.parse(fs.readFileSync('.cdp-current-mcp-args.json', 'utf8'));
fs.writeFileSync('.cdp-mcp-invoke-payload.json', JSON.stringify({ viewId: a.viewId, method: a.method, params: a.params }));
