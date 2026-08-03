import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const recorded = process.argv[2];
const next = process.argv[3];
const viewId = process.argv[4] || 'bfb4f3';

if (recorded !== 'skip') {
  const raw = fs.readFileSync(path.join(dir, '.cdp-mcp-last-result.json'), 'utf8');
  const rec = spawnSync('node', ['.cdp-run-all-mcp-steps.mjs', 'record', recorded, raw], {
    cwd: dir,
    encoding: 'utf8',
  });
  process.stdout.write(rec.stdout || '');
  if (rec.status !== 0) {
    process.stderr.write(rec.stderr || '');
    process.exit(rec.status ?? 1);
  }
}

if (next && next !== 'done') {
  spawnSync('node', ['.cdp-run-step-via-expr-server.mjs', next, viewId], { cwd: dir, stdio: 'inherit' });
}
