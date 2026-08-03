/**
 * Print exact MCP args for one step (stdout = browser_cdp arguments JSON).
 * Usage: node .cdp-agent-one-mcp.mjs <n> [liveViewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const live = process.argv[3] || 'b45110';
const livePath = path.join(dir, `.cdp-step-${n}-live-args.json`);
if (!fs.existsSync(livePath)) {
  execSync(`node .cdp-agent-mcp-step.mjs ${n} ${live}`, { cwd: dir, stdio: 'pipe' });
}
const args = JSON.parse(fs.readFileSync(livePath, 'utf8'));
args.viewId = live;
process.stdout.write(JSON.stringify(args));
