import { execSync } from 'child_process';
import fs from 'fs';
const n = process.argv[2];
const viewId = process.argv[3] || '86ffcf';
execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { stdio: 'pipe' });
execSync(`node .cdp-expr-server.mjs set .cdp-current-mcp-args.json ${viewId}`, { stdio: 'pipe' });
const boot = JSON.parse(execSync('node .cdp-expr-server.mjs bootstrap', { encoding: 'utf8' }).trim());
fs.writeFileSync('.cdp-one-step-pending.json', JSON.stringify({ step: Number(n), args: boot }));
console.log(JSON.stringify({ step: Number(n), ready: true }));
