import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const step = Number(process.argv[2]);
const resultFile = process.argv[3] || path.join(dir, '.cdp-mcp-result.json');
fs.copyFileSync(resultFile, path.join(dir, '.cdp-mcp-result.json'));
const out = execSync(`node record-step-result.mjs ${step}`, { cwd: dir, encoding: 'utf8' });
console.log(out.trim());
