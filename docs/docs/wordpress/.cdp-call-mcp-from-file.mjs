import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const argsFile = process.argv[2];
const outFile = process.argv[3] || path.join(dir, '.cdp-last-mcp.json');
const args = JSON.parse(fs.readFileSync(path.resolve(dir, argsFile), 'utf8'));
// Emit compact instruction for agent; actual MCP must be called externally.
console.log(JSON.stringify({ viewId: args.viewId, method: args.method, exprLen: args.params?.expression?.length ?? 0, outFile }));
