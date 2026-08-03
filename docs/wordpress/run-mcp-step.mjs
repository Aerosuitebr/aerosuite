import fs from 'fs';
import { execSync } from 'child_process';

const n = process.argv[2];
const valueJson = process.argv[3];
const value = JSON.parse(valueJson);
fs.writeFileSync('.cdp-mcp-result.json', JSON.stringify({ result: { type: 'object', value } }));
console.log(execSync(`node agent-mcp-step-loop.mjs record ${n}`, { encoding: 'utf8' }).trim());
