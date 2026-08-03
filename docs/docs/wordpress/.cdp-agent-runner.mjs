/**
 * Agent helper: reads .cdp-invoke-min.json, agent calls MCP, writes .cdp-agent-mcp-result.json
 * Usage: node .cdp-agent-runner.mjs wait | save '<json>' | status
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const invoke = path.join(dir, '.cdp-invoke-min.json');
const result = path.join(dir, '.cdp-agent-mcp-result.json');
const done = path.join(dir, '.cdp-mcp-done-now.json');

const cmd = process.argv[2];

if (cmd === 'wait') {
  const call = JSON.parse(fs.readFileSync(invoke, 'utf8'));
  console.log(JSON.stringify({ ready: true, viewId: call.viewId, method: call.method, exprLen: call.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'save') {
  const raw = process.argv[3] || fs.readFileSync(0, 'utf8');
  fs.writeFileSync(result, raw);
  fs.writeFileSync(done, raw);
  const v = JSON.parse(raw)?.result?.value;
  console.log(JSON.stringify({ saved: true, value: v }));
  process.exit(0);
}

if (cmd === 'prepare') {
  const src = process.argv[3] || path.join(dir, '.cdp-mcp-do-now.json');
  const call = JSON.parse(fs.readFileSync(src, 'utf8'));
  const out = { method: call.method, params: call.params, viewId: call.viewId };
  fs.writeFileSync(invoke, JSON.stringify(out));
  console.log(JSON.stringify({ step: call.step, viewId: out.viewId }));
  process.exit(0);
}

console.error('wait | save JSON | prepare [file]');
process.exit(2);
