/** Print .cdp-call-N.json for agent MCP (stdout). Usage: node .cdp-mcp-invoke-step.mjs <n> */
import fs from 'fs';
const n = process.argv[2];
const raw = fs.readFileSync(`.cdp-call-${n}.json`, 'utf8');
process.stdout.write(raw);
