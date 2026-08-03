/**
 * Output single step MCP args JSON to stdout for agent CallMcpTool.
 * node exec-mcp-step.mjs N [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] ?? 'd79a58';
const file =
  n === 0
    ? path.join(dir, '.step-0-args.json')
    : path.join(dir, `.step-out-${n}.json`);
const args = JSON.parse(fs.readFileSync(file, 'utf8'));
args.viewId = viewId;
process.stdout.write(JSON.stringify(args));
