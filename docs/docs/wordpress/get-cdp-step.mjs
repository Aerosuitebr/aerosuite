import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const i = Number(process.argv[2]);
const list = JSON.parse(fs.readFileSync(path.join(dir, 'cdp-step-list.json'), 'utf8'));
const step = list[i];
if (!step) {
  console.error('no step', i);
  process.exit(1);
}
process.stdout.write(JSON.stringify(step));
