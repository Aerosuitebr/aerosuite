import fs from 'fs';
import { execSync } from 'child_process';
const viewId = process.argv[2] || '4610b7';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);
for (let n = start; n <= end; n++) {
  execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { stdio: 'pipe' });
  fs.copyFileSync('.cdp-current-mcp-args.json', `.cdp-step-${n}-call.json`);
  console.log('prepared', n);
}
