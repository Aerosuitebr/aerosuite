/**
 * Run one invoke step: set expr on port 18780, output bootstrap MCP payload.
 * Usage: node prep-invoke-12.mjs <step> [viewId]
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { bootstrapCall, setExprFromStep } from './invoke-12-expr-server.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const viewId = process.argv[3] || 'bb8370';
const info = setExprFromStep(step, viewId);
const boot = bootstrapCall(viewId);
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(boot));
console.log(JSON.stringify({ step, ...info, boot }));
