import fs from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = process.argv[2];
const respArg = process.argv[3] || '.cdp-last-mcp-response.json';
const respPath = path.isAbsolute(respArg) ? respArg : path.join(dir, respArg);
const raw = fs.existsSync(respPath) && !respArg.trim().startsWith('{')
  ? fs.readFileSync(respPath, 'utf8')
  : (respArg || fs.readFileSync(path.join(dir, '.cdp-mcp-last-result.json'), 'utf8'));
fs.writeFileSync(path.join(dir, '.cdp-mcp-last-result.json'), raw);
const r = spawnSync('node', ['.cdp-run-all-mcp-steps.mjs', 'record', n, raw], {
  cwd: dir,
  encoding: 'utf8',
});
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');
process.exit(r.status ?? 0);
