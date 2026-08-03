/**
 * Agent driver: emit next step MCP args; record result from stdin.
 * Usage: node .cdp-agent-step.mjs next <viewId> [from] [to]
 *        echo '<mcp-json>' | node .cdp-agent-step.mjs record <viewId> <n>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[3] || 'c8305f';
const from = Number(process.argv[4] ?? 0);
const to = Number(process.argv[5] ?? 29);
const cursorPath = path.join(dir, '.cdp-agent-cursor.json');

function loadCursor() {
  return fs.existsSync(cursorPath)
    ? JSON.parse(fs.readFileSync(cursorPath, 'utf8'))
    : { next: from };
}

function saveCursor(c) {
  fs.writeFileSync(cursorPath, JSON.stringify(c));
}

if (cmd === 'reset') {
  saveCursor({ next: from });
  console.log(JSON.stringify({ ok: true, next: from }));
  process.exit(0);
}

if (cmd === 'next') {
  const c = loadCursor();
  if (c.next > to) {
    console.log('DONE');
    process.exit(0);
  }
  const n = c.next;
  const out = execSync(`node .cdp-exec-invoke-step.mjs ${n} ${viewId}`, {
    cwd: dir,
    encoding: 'utf8',
  }).trim();
  const args = JSON.parse(out);
  args.viewId = viewId;
  fs.writeFileSync(path.join(dir, `.cdp-call-${n}.json`), JSON.stringify(args));
  console.log(JSON.stringify({ step: n, args }));
  process.exit(0);
}

if (cmd === 'record') {
  const n = Number(process.argv[4]);
  const raw = fs.readFileSync(0, 'utf8');
  const proc = execSync(`node .cdp-mcp-loop-exec.mjs record ${viewId} ${n}`, {
    cwd: dir,
    input: raw,
    encoding: 'utf8',
  });
  const c = loadCursor();
  c.next = n + 1;
  saveCursor(c);
  process.stdout.write(proc);
  process.exit(0);
}

if (cmd === 'summary') {
  execSync('node .cdp-mcp-loop-exec.mjs summary', { cwd: dir, stdio: 'inherit' });
  process.exit(0);
}

console.error('next|record|reset|summary');
process.exit(2);
