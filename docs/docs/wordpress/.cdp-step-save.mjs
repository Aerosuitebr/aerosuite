/** Save MCP response: node .cdp-step-save.mjs N [respFile] */
import fs from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = process.argv[2];
const respFile = process.argv[3] || path.join(dir, '.cdp-last-mcp-resp.json');
const dest = path.join(dir, `.cdp-step-${step}-resp.json`);
fs.copyFileSync(respFile, dest);
execFileSync('node', ['.cdp-record-step.mjs', step, dest], { cwd: dir, stdio: 'inherit' });
