import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2] || path.join(dir, '.mcp-last-result.json');
const result = JSON.parse(fs.readFileSync(src, 'utf8'));
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), JSON.stringify(result));
