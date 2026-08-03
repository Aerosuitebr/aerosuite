import fs from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '4da845';
const mcpViewId = process.argv[4] || viewId;
const out = execFileSync('node', ['.cdp-mcp-run-step.mjs', String(n), viewId], { cwd: dir, encoding: 'utf8' });
const args = JSON.parse(out);
args.viewId = mcpViewId;
const pending = path.join(dir, '.cdp-pending-mcp.json');
fs.writeFileSync(pending, JSON.stringify(args));
fs.writeFileSync(path.join(dir, '.cdp-pending-step.txt'), String(n));
console.log(JSON.stringify({ step: n, viewId: args.viewId, exprLen: args.params?.expression?.length ?? 0 }));
