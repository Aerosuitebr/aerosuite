/** Prepare MCP call: node .cdp-step-runner.mjs N [activeViewId] [specViewId] */
import fs from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const activeView = process.argv[3] || '4da845';
const specView = process.argv[4] || 'b45110';
const args = JSON.parse(
  execFileSync('node', ['.cdp-mcp-run-step.mjs', step, specView], { cwd: dir, encoding: 'utf8' })
);
args.viewId = activeView;
fs.writeFileSync(path.join(dir, '.cdp-pending-mcp.json'), JSON.stringify(args));
console.log(JSON.stringify({ step: Number(step), viewId: activeView, exprLen: args.params?.expression?.length ?? 0 }));
