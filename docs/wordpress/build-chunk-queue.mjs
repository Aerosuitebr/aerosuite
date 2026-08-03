import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'bba9a4';
const start = Number(process.argv[3] ?? 0);
const end = Number(process.argv[4] ?? 29);
const queue = [];

for (let step = start; step <= end; step++) {
  execSync(`node mcp-b64-parts.mjs emit ${step} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const calls = JSON.parse(fs.readFileSync(path.join(dir, `.mcp-b64-calls-${step}.json`), 'utf8'));
  calls.forEach((call, part) => queue.push({ step, part, call }));
}

const qPath = path.join(dir, '.mcp-chunk-queue.json');
const pPath = path.join(dir, '.mcp-chunk-progress.json');
fs.writeFileSync(qPath, JSON.stringify(queue));
fs.writeFileSync(pPath, JSON.stringify({ i: 0, total: queue.length }));
console.log(JSON.stringify({ viewId, start, end, total: queue.length }));
