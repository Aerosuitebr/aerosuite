import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(dir, process.argv[2]);
const j = JSON.parse(fs.readFileSync(file, 'utf8'));
process.stdout.write(JSON.stringify({ viewId: j.viewId, method: j.method, params: j.params }));
