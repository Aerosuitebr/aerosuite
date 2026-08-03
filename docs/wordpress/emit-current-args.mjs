import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const rel = process.argv[2];
const viewId = process.argv[3] || 'b5108e';
const out = path.join(dir, '.emit-current.json');
const payload = execSync(`node mcp-deploy-runner.mjs emit-args ${rel} ${viewId}`, {
  cwd: dir,
  encoding: 'utf8',
});
fs.writeFileSync(out, payload.trim());
console.log(JSON.stringify({ file: rel, bytes: payload.length }));
