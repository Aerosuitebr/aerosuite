import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const src = process.argv[3] || path.join(dir, '.cdp-mcp-result-raw.json');
const viewId = process.argv[4] || 'b83599';
fs.copyFileSync(src, path.join(dir, '.cdp-mcp-result.json'));
execSync(`node save-record-prep.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'inherit' });
