/**
 * Emit step N MCP args to stdout; apply result from file.
 * Usage: node _agent-run-cdp-steps.mjs args <viewId> <n>
 *        node _agent-run-cdp-steps.mjs apply <n> <resultFile>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const resultPath = path.join(dir, '.cdp-mcp-result.json');

function loadCall(n, viewId) {
  const mcp = path.join(dir, `.mcp-step-${n}-payload.json`);
  const inv = path.join(dir, `.invoke-step-${n}.json`);
  let payload = fs.existsSync(mcp)
    ? JSON.parse(fs.readFileSync(mcp, 'utf8'))
    : JSON.parse(fs.readFileSync(inv, 'utf8'));
  payload.viewId = viewId;
  return payload;
}

const cmd = process.argv[2];
if (cmd === 'args') {
  const viewId = process.argv[3];
  const n = Number(process.argv[4]);
  process.stdout.write(JSON.stringify(loadCall(n, viewId)));
  process.exit(0);
}

if (cmd === 'apply') {
  const n = Number(process.argv[3]);
  const src = process.argv[4] || resultPath;
  const raw = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(resultPath, raw);
  const out = execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, encoding: 'utf8' });
  console.log(out.trim());
  process.exit(0);
}

process.exit(2);
