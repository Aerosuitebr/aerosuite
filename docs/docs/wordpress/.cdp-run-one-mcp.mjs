/** Print MCP args for step N to stdout */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const a = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-call-${n}.json`), 'utf8'));
process.stdout.write(JSON.stringify({ method: a.method, params: a.params, viewId: a.viewId }));
