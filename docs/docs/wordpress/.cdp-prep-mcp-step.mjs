/** Prep step N MCP args: node .cdp-prep-mcp-step.mjs N [specViewId] [activeViewId] */
import fs from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const specView = process.argv[3] || 'b45110';
const activeView = process.argv[4] || '4da845';
const raw = execFileSync('node', ['.cdp-mcp-run-step.mjs', n, specView], { cwd: dir, encoding: 'utf8' });
const args = JSON.parse(raw.trim());
args.viewId = activeView;
const out = path.join(dir, '.cdp-mcp-pending.json');
fs.writeFileSync(out, JSON.stringify(args));
console.log(JSON.stringify({ step: Number(n), exprLen: args.params?.expression?.length ?? 0, file: out }));
