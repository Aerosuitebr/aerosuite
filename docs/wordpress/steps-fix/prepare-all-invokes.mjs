import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const inv = JSON.parse(fs.readFileSync(path.join(dir, 'all-invocations.json'), 'utf8'));
for (let i = 0; i < inv.length; i++) {
  spawnSync(process.execPath, ['emit-step.mjs', String(i)], { cwd: dir, stdio: 'pipe' });
}
console.log('prepared', inv.length, 'invoke files');
