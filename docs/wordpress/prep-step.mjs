import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const viewId = process.argv[3] || '807f76';
execSync(`node agent-mcp-step-loop.mjs prep ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
execSync(`node .cdp-expr-server.mjs set .cdp-mcp-args-current.json ${viewId}`, { cwd: dir, stdio: 'pipe' });
console.log(JSON.stringify({ step: Number(n), ready: true }));
