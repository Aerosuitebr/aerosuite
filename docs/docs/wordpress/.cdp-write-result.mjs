import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const raw = process.argv[2] === '--file'
  ? fs.readFileSync(process.argv[3], 'utf8')
  : process.argv.slice(2).join(' ');
const data = typeof raw === 'string' && raw.trim().startsWith('{') ? JSON.parse(raw) : raw;
fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), JSON.stringify(data));
