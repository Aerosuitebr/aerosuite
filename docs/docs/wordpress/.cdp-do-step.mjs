/**
 * Single-step CDP batch helper.
 * get N [viewId]  -> write .cdp-mcp-args-now.json, print exprLen
 * save N          -> read .cdp-mcp-resp-N.json, record step N
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = Number(process.argv[3]);
const viewId = process.argv[4] || 'dc48c3';

if (cmd === 'get') {
  const callPath = path.join(dir, `.cdp-call-${n}.json`);
  if (!fs.existsSync(callPath)) {
    spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'prep', String(n), viewId], { cwd: dir, stdio: 'inherit' });
  }
  const c = JSON.parse(fs.readFileSync(callPath, 'utf8'));
  const args = { method: c.method, params: c.params, viewId };
  fs.writeFileSync(path.join(dir, '.cdp-mcp-args-now.json'), JSON.stringify(args));
  console.log(JSON.stringify({ step: n, exprLen: c.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'save') {
  const respPath = path.join(dir, `.cdp-mcp-resp-${n}.json`);
  const raw = fs.readFileSync(respPath, 'utf8');
  const proc = spawnSync('node', ['.cdp-run-mcp-batch.mjs', 'record', String(n)], {
    cwd: dir,
    input: raw,
    encoding: 'utf8',
  });
  process.stdout.write(proc.stdout || '');
  process.stderr.write(proc.stderr || '');
  process.exit(proc.status ?? 0);
}

console.error('usage: get N [viewId] | save N');
process.exit(2);
