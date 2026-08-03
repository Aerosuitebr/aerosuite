/** Load .cdp-await-N-args.json and write .cdp-mcp-last-result.json from MCP result path arg. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const viewId = process.argv[3] || '868beb';
const ready = path.join(dir, `.cdp-step-${n}.mcp-ready.json`);
const argsOut = path.join(dir, `.cdp-await-${n}-args.json`);
const r = JSON.parse(fs.readFileSync(ready, 'utf8'));
const payload = { viewId, method: r.method, params: r.params };
fs.writeFileSync(argsOut, JSON.stringify(payload));
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(payload));
console.log(JSON.stringify({ step: Number(n), viewId, exprLen: payload.params.expression.length, argsFile: `.cdp-await-${n}-args.json` }));
