import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'af93cf';
const args = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-call-${n}.json`), 'utf8'));
args.viewId = viewId;
fs.writeFileSync(path.join(dir, '.cdp-last-args.json'), JSON.stringify(args));
process.stdout.write(String(n));
