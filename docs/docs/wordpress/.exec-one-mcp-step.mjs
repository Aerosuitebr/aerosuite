/**
 * Execute one step via node reading prepared JSON and printing result path.
 * Agent uses: node .exec-one-mcp-step.mjs <n> then reads result from stdout JSON.
 * Actually executes by writing args for external MCP - use with run-all-mcp-via-cdp-fetch.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '8e6349';

const src = path.join(dir, `.step-out-${n}.json`);
const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
raw.viewId = viewId;
const outPath = path.join(dir, '.cdp-current-step-args.json');
fs.writeFileSync(outPath, JSON.stringify(raw));
console.log(JSON.stringify({ step: n, viewId, argsFile: outPath, exprLen: raw.params.expression.length }));
