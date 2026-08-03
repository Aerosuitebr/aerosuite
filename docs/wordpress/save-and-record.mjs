/**
 * Save MCP response from file and record step.
 * Usage: node save-and-record.mjs <stepIndex> <responseJsonFile>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const src = process.argv[3];
const raw = fs.readFileSync(src, 'utf8');
JSON.parse(raw);
fs.writeFileSync(path.join(dir, '.cdp-mcp-result.json'), raw);
const out = execSync(`node record-step-result.mjs ${n}`, { cwd: dir, encoding: 'utf8' });
console.log(out.trim());
