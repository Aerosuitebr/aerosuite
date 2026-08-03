/** Print CallMcpTool args JSON from .cdp-mcp-call-min.json */
import fs from 'fs';
const c = JSON.parse(fs.readFileSync('.cdp-mcp-call-min.json', 'utf8'));
process.stdout.write(JSON.stringify({ method: c.method, params: c.params, viewId: c.viewId }));
