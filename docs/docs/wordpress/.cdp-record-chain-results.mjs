import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const respPath = process.argv[2] || path.join(dir, '.cdp-chain-resp.json');
const raw = fs.readFileSync(respPath, 'utf8');
const parsed = JSON.parse(raw);
const results = parsed?.result?.value ?? parsed?.value ?? parsed;
let failed = false;
for (const [k, v] of Object.entries(results).sort((a, b) => Number(a) - Number(b))) {
  const n = Number(k);
  const mcpOut = { result: { type: 'object', value: v } };
  const rec = spawnSync('node', ['.cdp-mcp-exec-loop.mjs', 'record', String(n), JSON.stringify(mcpOut)], {
    cwd: dir,
    encoding: 'utf8',
  });
  process.stdout.write(rec.stdout || '');
  if (rec.status !== 0) {
    process.stderr.write(rec.stderr || '');
    failed = true;
    break;
  }
}
process.exit(failed ? 1 : 0);
