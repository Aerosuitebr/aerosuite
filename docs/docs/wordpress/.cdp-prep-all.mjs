import fs from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'ae099b';
const start = Number(process.argv[3] ?? 1);
const end = Number(process.argv[4] ?? 29);
for (let n = start; n <= end; n++) {
  execFileSync('node', ['.cdp-mcp-exec-loop.mjs', 'prep', String(n), viewId], { cwd: dir, stdio: 'pipe' });
}
