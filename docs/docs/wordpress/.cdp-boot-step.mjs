import { spawnSync } from 'child_process';
import fs from 'fs';

const n = process.argv[2];
const viewId = process.argv[3] || '265634';
spawnSync('node', ['.cdp-prep-ready.mjs', String(n), viewId], { stdio: 'inherit', cwd: process.cwd() });
const set = spawnSync('node', ['.cdp-expr-server.mjs', 'set', '.cdp-current-mcp-args.json', viewId], {
  encoding: 'utf8',
  cwd: process.cwd(),
});
if (set.status) process.exit(set.status);
const boot = spawnSync('node', ['.cdp-expr-server.mjs', 'bootstrap'], { encoding: 'utf8', cwd: process.cwd() });
process.stdout.write(boot.stdout);
