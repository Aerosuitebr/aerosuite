/**
 * Run invoke steps start..end via chunked MCP (Playwright-free; for agent loop).
 * Prints progress; agent must call browser_cdp per line in .cdp-chunk-queue.jsonl
 * OR use with --self if CURSOR_MCP=1 env (not available).
 *
 * Usage: node run-chunked-invoke.mjs queue <start> <end> [viewId]
 *        node run-chunked-invoke.mjs apply <n> <mcpResultJson>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[5] || '37aca3';

if (cmd === 'queue') {
  const start = Number(process.argv[3]);
  const end = Number(process.argv[4]);
  const lines = [];
  for (let n = start; n <= end; n++) {
    execSync(`node mcp-chunk-exec.mjs emit-chunks ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
    const plan = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-chunk-plan-${n}.json`), 'utf8'));
    for (const c of plan.calls) lines.push(JSON.stringify({ type: 'chunk', n, call: c }));
    const fin = JSON.parse(execSync(`node mcp-chunk-exec.mjs emit-final ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' }));
    lines.push(JSON.stringify({ type: 'final', n, call: fin }));
    lines.push(JSON.stringify({ type: 'record', n }));
  }
  fs.writeFileSync(path.join(dir, '.cdp-chunk-queue.jsonl'), lines.join('\n'), 'utf8');
  console.log(JSON.stringify({ ok: true, lines: lines.length, start, end }));
  process.exit(0);
}

console.error('usage: queue');
process.exit(2);
