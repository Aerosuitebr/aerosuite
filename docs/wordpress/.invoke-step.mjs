import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '46863b';
const file = n === 0 ? '.cdp-invoke-0.json' : `.step-out-${n}.json`;
const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
raw.viewId = viewId;
process.stdout.write(JSON.stringify(raw));
