/**
 * Reads mcp-commands.jsonl from startIndex; for each step writes .cdp-await.json
 * Agent: CallMcpTool browser_cdp with args, write response to .cdp-mcp-result.json
 * Then: node run-jsonl-mcp-loop.mjs continue <viewId> <index>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '5c671d';
const cmd = process.argv[3];
const idx = Number(process.argv[4] ?? 2);
const lines = fs.readFileSync(path.join(dir, 'mcp-commands.jsonl'), 'utf8').trim().split('\n');

if (cmd === 'continue') {
  const prev = JSON.parse(lines[idx - 1]);
  const rel = prev.file.replace(/\\/g, '/');
  execSync(`node record-step-result.mjs ${idx - 1}`, { cwd: dir, stdio: 'inherit' });
  const next = idx;
  if (next >= lines.length) {
    console.log(execSync(`node agent-cdp-step.mjs summary ${viewId}`, { cwd: dir, encoding: 'utf8' }));
    process.exit(0);
  }
}

const line = JSON.parse(lines[idx]);
fs.writeFileSync(path.join(dir, '.cdp-await.json'), JSON.stringify({ index: idx, file: line.file, args: line.args }));
console.log(JSON.stringify({ action: 'INVOKE', index: idx, file: line.file }));
