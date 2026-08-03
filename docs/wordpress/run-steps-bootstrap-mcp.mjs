/**
 * Run steps via expr-server + single bootstrap MCP call per step.
 * Usage: node run-steps-bootstrap-mcp.mjs <start> <end> <viewId>
 * Prints AWAIT_STEP N with bootstrap JSON on stderr; agent CallMcpTool then: node run-steps-bootstrap-mcp.mjs save <n> <resultFile>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] || '807f76';
const cmd = process.argv[5];
const resultPath = path.join(dir, '.cdp-mcp-result.json');

function bootstrapArgs() {
  return JSON.parse(execSync('node .cdp-expr-server.mjs bootstrap', { cwd: dir, encoding: 'utf8' }));
}

if (cmd === 'prep') {
  const n = Number(process.argv[6]);
  execSync(`node agent-mcp-step-loop.mjs prep ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  execSync(`node .cdp-expr-server.mjs set .cdp-mcp-args-current.json ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const boot = bootstrapArgs();
  boot.viewId = viewId;
  console.log(JSON.stringify({ step: n, bootstrap: boot, exprLen: fs.readFileSync(path.join(dir, '.cdp-expr-current.txt'), 'utf8').length }));
  process.exit(0);
}

if (cmd === 'save') {
  const n = Number(process.argv[6]);
  const src = process.argv[7] || resultPath;
  fs.copyFileSync(src, resultPath);
  execSync(`node agent-mcp-step-loop.mjs record ${n}`, { cwd: dir, stdio: 'inherit' });
  process.exit(0);
}

if (cmd === 'start-server') {
  const child = spawn('node', ['.cdp-expr-server.mjs', 'start'], { cwd: dir, detached: true, stdio: 'ignore' });
  child.unref();
  console.log(JSON.stringify({ serverPid: child.pid }));
  process.exit(0);
}

// batch mode: print all prep lines
for (let n = start; n <= end; n++) {
  execSync(`node agent-mcp-step-loop.mjs prep ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  execSync(`node .cdp-expr-server.mjs set .cdp-mcp-args-current.json ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const boot = bootstrapArgs();
  boot.viewId = viewId;
  fs.writeFileSync(path.join(dir, `.cdp-bootstrap-${n}.json`), JSON.stringify(boot));
  console.error(`AWAIT_STEP ${n}`);
}
