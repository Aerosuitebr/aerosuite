import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '6eb035';
const end = Number(process.argv[4] ?? 29);
const port = process.argv[5] ?? 8766;

execSync(`node .cdp-record-mcp-result.mjs ${n}`, { cwd: dir, stdio: 'inherit' });
const next = n + 1;
if (next <= end) {
  execSync(`node .cdp-run-all-via-fetch.mjs ${next} ${end} ${viewId} ${port}`, { cwd: dir, stdio: 'inherit' });
} else {
  execSync(`node .cdp-mcp-step-from-file.mjs summary 0 ${viewId}`, { cwd: dir, stdio: 'inherit' });
}
