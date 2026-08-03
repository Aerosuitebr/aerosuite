import { execSync } from 'child_process';
import fs from 'fs';
const n = process.argv[2];
const viewId = process.argv[3] || '86ffcf';
execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { stdio: 'inherit' });
execSync(`node .cdp-expr-server.mjs set .cdp-current-mcp-args.json ${viewId}`, { stdio: 'inherit' });
const boot = execSync('node .cdp-expr-server.mjs bootstrap', { encoding: 'utf8' }).trim();
fs.writeFileSync('.cdp-boot-now.json', boot);
console.log(boot);
