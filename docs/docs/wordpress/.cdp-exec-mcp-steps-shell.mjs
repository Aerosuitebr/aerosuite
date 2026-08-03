/**
 * Emit one step's MCP args path for agent CallMcpTool.
 * Usage: node .cdp-exec-mcp-steps-shell.mjs <n> [liveViewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const invokeViewId = 'd15c6f';
const live = process.argv[3] || 'b45110';
const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${invokeViewId}`, { cwd: dir, encoding: 'utf8' }).trim();
const args = JSON.parse(out);
args.viewId = live;
const p = path.join(dir, `.cdp-step-${n}-mcp-call.json`);
fs.writeFileSync(p, JSON.stringify(args));
console.log(p);
