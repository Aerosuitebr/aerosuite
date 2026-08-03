import fs from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const respFile = process.argv[3] || path.join(dir, '.cdp-temp-resp.json');
const raw = fs.readFileSync(respFile, 'utf8');
execFileSync('node', ['.cdp-mcp-exec-loop.mjs', 'record', n, raw], { cwd: dir, stdio: 'inherit' });
