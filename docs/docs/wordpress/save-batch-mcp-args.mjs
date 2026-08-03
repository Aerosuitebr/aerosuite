import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const live = path.join(dir, 'cdp-batch-invoke-live.json');
const src = path.join(dir, 'cdp-batch-invoke.json');
const j = JSON.parse(fs.readFileSync(fs.existsSync(live) ? live : src, 'utf8'));
const out = { method: j.method, params: j.params, viewId: j.viewId || '7b8d4e' };
fs.writeFileSync(path.join(dir, 'cdp-batch-mcp-args-only.json'), JSON.stringify(out));
