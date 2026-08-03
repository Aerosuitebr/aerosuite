/**
 * Run one invoke step: read .invoke-step-N.json, evaluate via args file for external MCP.
 * Usage: node run-mcp-step-via-node.mjs prep <n> [viewId]
 *        node run-mcp-step-via-node.mjs apply-result <n>  (reads .cdp-mcp-result.json, records)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[3]);
const viewId = process.argv[4] || '048877';
const cmd = process.argv[2];
const resultPath = path.join(dir, '.cdp-mcp-result.json');
const argsPath = path.join(dir, '.cdp-mcp-args-current.json');

if (cmd === 'prep') {
  const args = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-step-${n}.json`), 'utf8'));
  args.viewId = viewId;
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  fs.writeFileSync(argsPath, JSON.stringify(args));
  console.log(JSON.stringify({ step: n, viewId, exprLen: args.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'apply-result') {
  execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, stdio: 'inherit' });
  process.exit(0);
}

process.exit(2);
