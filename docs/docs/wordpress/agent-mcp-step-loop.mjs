/**
 * Agent helper: prepare step N args; after agent writes .cdp-mcp-result.json, record and continue.
 * Usage: node agent-mcp-step-loop.mjs prep <n> [viewId]
 *        node agent-mcp-step-loop.mjs record <n>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const argsPath = path.join(dir, '.cdp-mcp-args-current.json');
const resultPath = path.join(dir, '.cdp-mcp-result.json');

const cmd = process.argv[2];
const n = Number(process.argv[3]);
const viewId = process.argv[4] || '048877';

if (cmd === 'prep') {
  const src = path.join(dir, `.invoke-step-${n}.json`);
  const args = JSON.parse(fs.readFileSync(src, 'utf8'));
  args.viewId = viewId;
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  fs.writeFileSync(argsPath, JSON.stringify(args));
  console.log(JSON.stringify({ step: n, exprLen: args.params?.expression?.length ?? 0, viewId }));
  process.exit(0);
}

if (cmd === 'record') {
  if (!fs.existsSync(resultPath)) {
    console.error(JSON.stringify({ error: 'missing .cdp-mcp-result.json' }));
    process.exit(1);
  }
  const raw = fs.readFileSync(resultPath, 'utf8').trim();
  try {
    JSON.parse(raw);
  } catch (e) {
    console.error(JSON.stringify({ error: 'invalid JSON in result', detail: String(e), head: raw.slice(0, 80) }));
    process.exit(1);
  }
  const out = execSync(`node record-step-result.mjs ${n}`, { cwd: dir, encoding: 'utf8' });
  console.log(out.trim());
  process.exit(0);
}

console.error('usage: prep|record <n> [viewId]');
process.exit(2);
