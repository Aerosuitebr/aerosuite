/** Read .cdp-call-N.json and emit MCP browser_cdp args. Usage: node .cdp-run-one-step.mjs <n> [viewId] */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'dc48c3';
const c = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-call-${n}.json`), 'utf8'));
process.stdout.write(JSON.stringify({ method: c.method, params: c.params, viewId }));
