import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const src = process.argv[3] || path.join(dir, '.cdp-temp-resp.json');
const raw = fs.readFileSync(src, 'utf8');
execFileSync('node', ['.cdp-mcp-exec-loop.mjs', 'record', n, raw], { cwd: dir, stdio: 'inherit' });
