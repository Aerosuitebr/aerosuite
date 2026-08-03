/**
 * Execute steps start..end via MCP browser_cdp by writing per-step invoke files.
 * Parent agent reads _step-result-{i}.json after each browser_cdp call.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b46d46';
const start = Number(process.argv[3] ?? 3);
const end = Number(process.argv[4] ?? 14);

const log = [];
for (let i = start; i <= end; i++) {
  spawnSync(process.execPath, [path.join(dir, '_cdp-payload.mjs'), viewId, String(i)], { stdio: 'pipe' });
  const payload = JSON.parse(fs.readFileSync(path.join(dir, '_cdp-payload.json'), 'utf8'));
  const invokePath = path.join(dir, `_invoke-step-${i}.json`);
  fs.writeFileSync(invokePath, JSON.stringify({ method: payload.method, params: payload.params, viewId: payload.viewId }));
  log.push({ index: i, invokePath, awaitPromise: payload.params.awaitPromise, exprLen: payload.params.expression.length });
}
fs.writeFileSync(path.join(dir, '_invoke-manifest.json'), JSON.stringify(log, null, 2));
console.log(JSON.stringify(log));
