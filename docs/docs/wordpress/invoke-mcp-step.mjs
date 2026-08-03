/**
 * Prints one step's browser_cdp args to stdout (for agent CallMcpTool).
 * Usage: node invoke-mcp-step.mjs <n> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const viewId = process.argv[3] || 'b5108e';
const args = JSON.parse(fs.readFileSync(path.join(dir, `.step-${n}-args.json`), 'utf8'));
args.viewId = viewId;
process.stdout.write(JSON.stringify(args));
