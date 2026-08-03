/** Write single-step MCP args for agent: node .cdp-agent-exec-one.mjs <n> <viewId> */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'ab2ed3';
const src = path.join(dir, `.cdp-run-${n}-args.json`);
const a = JSON.parse(fs.readFileSync(src, 'utf8'));
a.viewId = viewId;
const out = path.join(dir, '.cdp-mcp-now.json');
fs.writeFileSync(out, JSON.stringify(a));
console.log(JSON.stringify({ step: n, exprLen: a.params.expression.length }));
