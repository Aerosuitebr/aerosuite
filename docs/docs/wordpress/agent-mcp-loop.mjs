import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];

if (cmd === 'prepare') {
  const n = Number(process.argv[3]);
  const viewId = process.argv[4] || '7c1495';
  execSync(`node step-payload.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const payload = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-step-payload.json'), 'utf8'));
  fs.writeFileSync(
    path.join(dir, '.cdp-mcp-call-min.json'),
    JSON.stringify({ method: payload.method, params: payload.params, viewId: payload.viewId })
  );
  console.log(JSON.stringify({ step: n, viewId, exprLen: payload.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'save') {
  const n = Number(process.argv[3]);
  const raw = process.argv[4]
    ? fs.readFileSync(process.argv[4], 'utf8')
    : fs.readFileSync(0, 'utf8');
  fs.writeFileSync(path.join(dir, '.cdp-mcp-result.json'), raw);
  const out = execSync(`node record-step-result.mjs ${n}`, { cwd: dir, encoding: 'utf8' });
  console.log(out.trim());
  process.exit(0);
}

console.error('usage: prepare <n> [viewId] | save <n> [resultFile]');
process.exit(2);
