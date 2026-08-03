/** Print full browser_cdp arguments JSON for step N to stdout */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'a3746c';
const callPath = path.join(dir, `.cdp-call-${n}.json`);
if (!fs.existsSync(callPath)) {
  execSync(`node .cdp-run-mcp-batch.mjs prep ${n} ${viewId}`, { cwd: dir, stdio: 'inherit' });
}
const call = JSON.parse(fs.readFileSync(callPath, 'utf8'));
call.viewId = viewId;
process.stdout.write(JSON.stringify(call));
