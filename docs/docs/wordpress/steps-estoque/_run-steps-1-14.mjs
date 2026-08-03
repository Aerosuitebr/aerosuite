/**
 * Prepare sequential CDP step payloads for MCP browser_cdp (viewId 263924).
 * Writes _step-log.jsonl with one line per step after MCP returns result via stdin.
 * Usage: node _run-steps-1-14.mjs prepare
 *        echo '{"step":1,"result":18000}' | node _run-steps-1-14.mjs record
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.env.CDP_VIEW_ID || '263924';
const logPath = path.join(dir, '_step-log.jsonl');
const statePath = path.join(dir, '_step-state.json');

function prepareStep(i) {
  const gen = spawnSync(process.execPath, [path.join(dir, '_cdp-payload.mjs'), viewId, String(i)], {
    encoding: 'utf8',
  });
  if (gen.status !== 0) throw new Error(`payload gen failed step ${i}: ${gen.stderr || gen.stdout}`);
  const meta = JSON.parse(gen.stdout.trim());
  const payload = JSON.parse(fs.readFileSync(path.join(dir, '_cdp-payload.json'), 'utf8'));
  return { index: i, meta, mcpArgs: { method: payload.method, params: payload.params, viewId: payload.viewId } };
}

const cmd = process.argv[2] || 'next';

if (cmd === 'prepare') {
  fs.writeFileSync(statePath, JSON.stringify({ viewId, next: 1, done: [] }, null, 2));
  if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
  console.log(JSON.stringify({ ok: true, viewId, next: 1 }));
} else if (cmd === 'next') {
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const i = state.next;
  if (i > 14) {
    console.log(JSON.stringify({ done: true, results: state.done }));
    process.exit(0);
  }
  const step = prepareStep(i);
  fs.writeFileSync(path.join(dir, '_mcp-call-step.json'), JSON.stringify(step.mcpArgs));
  console.log(JSON.stringify({ step: i, meta: step.meta, mcpFile: '_mcp-call-step.json' }));
} else if (cmd === 'record') {
  const input = fs.readFileSync(0, 'utf8').trim();
  const rec = JSON.parse(input);
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.done.push(rec);
  state.next = rec.step + 1;
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  fs.appendFileSync(logPath, JSON.stringify(rec) + '\n');
  console.log(JSON.stringify({ recorded: rec.step, next: state.next }));
} else {
  console.error('Usage: prepare | next | record (stdin JSON)');
  process.exit(1);
}
