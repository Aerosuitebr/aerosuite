/**
 * Run steps start..end via MCP file handshake with sync orchestrator.
 * Agent must call: node .cdp-agent-mcp-step-runner.mjs invoke
 * which prints step N, then agent CallMcpTool + node .cdp-agent-mcp-step-runner.mjs save '<json>'
 *
 * Or run automated loop (agent polls invoke file):
 *   node .cdp-agent-mcp-step-runner.mjs loop 3 29 84ede5
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[5] || '84ede5';

function prepare(n) {
  execSync(`node .cdp-prepare-call.mjs ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const call = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-call-now.json'), 'utf8'));
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(call));
  fs.writeFileSync(path.join(dir, '.cdp-invoke-pending.json'), JSON.stringify({ step: n, ...call }));
  return call;
}

if (cmd === 'invoke') {
  const pending = path.join(dir, '.cdp-invoke-pending.json');
  if (!fs.existsSync(pending)) {
    console.error('no pending invoke');
    process.exit(1);
  }
  const j = JSON.parse(fs.readFileSync(pending, 'utf8'));
  process.stdout.write(JSON.stringify(j));
  process.exit(0);
}

if (cmd === 'prepare') {
  const n = Number(process.argv[3]);
  prepare(n);
  console.log(JSON.stringify({ step: n, ready: true }));
  process.exit(0);
}

if (cmd === 'save') {
  const raw = process.argv[3] || fs.readFileSync(0, 'utf8');
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-result.json'), raw);
  const j = JSON.parse(raw);
  const v = j?.result?.value ?? j?.result?.result?.value;
  console.log(JSON.stringify({ saved: true, value: v }));
  process.exit(0);
}

if (cmd === 'loop') {
  const start = Number(process.argv[3] ?? 3);
  const end = Number(process.argv[4] ?? 29);
  const resultPath = path.join(dir, '.cdp-current-mcp-result.json');
  for (let n = start; n <= end; n++) {
    prepare(n);
    if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
    process.stderr.write(`NEED_MCP ${n}\n`);
    let result = null;
    for (let t = 0; t < 1200; t++) {
      if (fs.existsSync(resultPath)) {
        result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        fs.unlinkSync(resultPath);
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!result) {
      console.error(JSON.stringify({ error: 'timeout', step: n }));
      process.exit(1);
    }
    const v = result?.result?.value ?? result?.value;
    process.stderr.write(`DONE ${n} ${JSON.stringify(v).slice(0, 100)}\n`);
  }
  console.log(JSON.stringify({ ok: true, end }));
  process.exit(0);
}

console.error('usage: prepare N | invoke | save JSON | loop start end [viewId]');
process.exit(2);
