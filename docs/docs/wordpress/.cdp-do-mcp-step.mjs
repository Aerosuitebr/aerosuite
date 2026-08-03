/**
 * Agent: after CallMcpTool, run: node .cdp-do-mcp-step.mjs <n> <rawJsonPath>
 * Writes .cdp-mcp-done-now.json for bridge and records step.
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const rawPath = path.resolve(process.argv[3]);
const raw = fs.readFileSync(rawPath, 'utf8');
fs.writeFileSync(path.join(dir, '.cdp-mcp-done-now.json'), raw);
fs.writeFileSync(path.join(dir, '.cdp-last-mcp-raw.json'), raw);
spawnSync('node', ['.cdp-save-mcp-result.mjs'], { cwd: dir, stdio: 'inherit' });
const r = spawnSync('node', ['.cdp-finish-step.mjs', n, rawPath], { cwd: dir, encoding: 'utf8' });
process.stdout.write(r.stdout || '');
process.exit(r.status ?? 0);
