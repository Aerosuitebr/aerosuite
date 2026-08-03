/**
 * B64-chunk bridge for mcp-runner-loop: one runner step = many small CDP calls.
 * Agent: while pending, read invoke -> browser_cdp -> write .mcp-chunk-result.json -> save
 *
 * node agent-b64-runner-loop.mjs pending
 * node agent-b64-runner-loop.mjs save
 * node agent-b64-runner-loop.mjs start-step <idx> <viewId>
 * node agent-b64-runner-loop.mjs finish-step
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const bridgePath = path.join(dir, '.mcp-b64-bridge.json');
const invokePath = path.join(dir, '.mcp-chunk-invoke.json');
const resultPath = path.join(dir, '.mcp-chunk-result.json');
const runnerResultPath = path.join(dir, '.mcp-runner-result.json');

const cmd = process.argv[2];

function extractValue(r) {
  const v = r?.result?.result?.value ?? r?.result?.value ?? r?.value ?? null;
  if (v && typeof v === 'object' && 'value' in v && Object.keys(v).length === 1) return v.value;
  return v;
}

if (cmd === 'start-step') {
  const idx = Number(process.argv[3]);
  const viewId = process.argv[4] || 'bba9a4';
  execSync(`node mcp-b64-step-runner.mjs init ${idx} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  execSync(`node mcp-b64-step-runner.mjs next`, { cwd: dir, stdio: 'pipe' });
  fs.writeFileSync(bridgePath, JSON.stringify({ idx, viewId, started: true }));
  const invoke = JSON.parse(fs.readFileSync(invokePath, 'utf8'));
  console.log(
    JSON.stringify({
      action: 'mcp',
      idx,
      part: 0,
      exprLen: invoke.params.expression.length,
    })
  );
  process.exit(0);
}

if (cmd === 'pending') {
  if (!fs.existsSync(bridgePath)) {
    console.log(JSON.stringify({ pending: false }));
    process.exit(0);
  }
  const bridge = JSON.parse(fs.readFileSync(bridgePath, 'utf8'));
  if (!fs.existsSync(invokePath)) {
    console.log(JSON.stringify({ pending: false, bridge }));
    process.exit(0);
  }
  const invoke = JSON.parse(fs.readFileSync(invokePath, 'utf8'));
  const state = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-b64-step-state.json'), 'utf8'));
  console.log(
    JSON.stringify({
      pending: true,
      idx: bridge.idx,
      part: state.idx,
      total: state.total,
      exprLen: invoke.params.expression.length,
    })
  );
  process.exit(0);
}

if (cmd === 'save') {
  if (!fs.existsSync(resultPath)) {
    console.error('missing .mcp-chunk-result.json');
    process.exit(1);
  }
  execSync(`node mcp-b64-step-runner.mjs save`, { cwd: dir, stdio: 'pipe' });
  const state = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-b64-step-state.json'), 'utf8'));
  if (state.idx >= state.total) {
    execSync(`node mcp-b64-step-runner.mjs write-runner-result`, { cwd: dir, stdio: 'pipe' });
    const bridge = JSON.parse(fs.readFileSync(bridgePath, 'utf8'));
    const raw = JSON.parse(fs.readFileSync(runnerResultPath, 'utf8'));
    fs.unlinkSync(bridgePath);
    console.log(
      JSON.stringify({
        action: 'runner-done',
        idx: bridge.idx,
        value: extractValue(raw),
      })
    );
    process.exit(0);
  }
  execSync(`node mcp-b64-step-runner.mjs next`, { cwd: dir, stdio: 'pipe' });
  const invoke = JSON.parse(fs.readFileSync(invokePath, 'utf8'));
  console.log(
    JSON.stringify({
      action: 'mcp',
      idx: state.step,
      part: state.idx,
      total: state.total,
      exprLen: invoke.params.expression.length,
    })
  );
  process.exit(0);
}

if (cmd === 'finish-step') {
  console.log(JSON.stringify({ ok: true }));
  process.exit(0);
}

console.error('pending | save | start-step <idx> <viewId>');
process.exit(2);
