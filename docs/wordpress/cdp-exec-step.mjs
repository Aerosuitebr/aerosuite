/**
 * Prepare one manifest step for MCP + record response.
 * node cdp-exec-step.mjs prepare <n> [viewId]
 * node cdp-exec-step.mjs record <n> <responseJsonFile>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = Number(process.argv[3]);
const viewId = process.argv[4] || 'c11c39';
const argsPath = path.join(dir, `.cdp-step-${n}.args.json`);
const pendingPath = path.join(dir, '.cdp-pending-mcp-args.json');
const resultPath = path.join(dir, `.cdp-mcp-result-${n}.json`);

if (cmd === 'prepare') {
  const a = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
  a.viewId = viewId;
  const payload = { viewId: a.viewId, method: a.method, params: a.params };
  fs.writeFileSync(pendingPath, JSON.stringify(payload));
  console.log(JSON.stringify({ step: n, pendingPath, exprLen: payload.params?.expression?.length ?? 0 }));
} else if (cmd === 'record') {
  const respFile = process.argv[4];
  const resp = JSON.parse(fs.readFileSync(respFile, 'utf8'));
  const value = resp?.result?.value ?? resp?.value ?? resp?.result ?? resp;
  fs.writeFileSync(resultPath, JSON.stringify(value, null, 2));
  console.log(JSON.stringify({ step: n, value }));
} else {
  console.error('usage: prepare|record');
  process.exit(2);
}
