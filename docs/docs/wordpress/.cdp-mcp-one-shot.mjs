/**
 * Run one MCP step from .cdp-live-step-N.json: prints args path, expects .cdp-temp-resp.json after MCP.
 * Usage: node .cdp-mcp-one-shot.mjs <n> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const viewId = process.argv[3] || 'ae099b';
const args = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-live-step-${n}.json`), 'utf8'));
args.viewId = viewId;
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(args));
console.log(JSON.stringify({ step: Number(n), ready: true }));
