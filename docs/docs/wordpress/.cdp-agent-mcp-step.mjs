/**
 * Prepare one step for agent MCP: invoke d15c6f, MCP viewId = live tab.
 * Usage: node .cdp-agent-mcp-step.mjs <n> [liveViewId]
 * Writes .cdp-current-mcp-args.json and .cdp-agent-step-meta.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const live = process.argv[3] || 'b45110';
const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} d15c6f`, { cwd: dir, encoding: 'utf8' }).trim();
const args = JSON.parse(out);
args.viewId = live;
const argsPath = path.join(dir, `.cdp-step-${n}-live-args.json`);
fs.writeFileSync(argsPath, JSON.stringify(args), 'utf8');
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(args), 'utf8');
fs.writeFileSync(
  path.join(dir, '.cdp-agent-step-meta.json'),
  JSON.stringify({ step: n, liveViewId: live, exprLen: args.params?.expression?.length ?? 0 }),
  'utf8'
);
console.log(JSON.stringify({ step: n, liveViewId: live, exprLen: args.params?.expression?.length ?? 0 }));
