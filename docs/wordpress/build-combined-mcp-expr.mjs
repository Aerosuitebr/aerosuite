/**
 * Build single sequential Runtime.evaluate from prepared MCP JSON files.
 * Usage: node build-combined-mcp-expr.mjs [start] [end] [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const seq = path.join(dir, 'run-prepared-mcp-sequence.mjs');
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'f29abe';
const files = JSON.parse(execSync(`node "${seq}" list`, { encoding: 'utf8' })).files;

function loadArgs(rel) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8'));
  if (j.arguments) return { ...j.arguments, viewId };
  return { viewId, method: 'Runtime.evaluate', params: j };
}

const steps = [];
for (let i = start; i <= end; i++) {
  const args = loadArgs(files[i]);
  const expr = args.params.expression;
  const inner = expr.replace(/^\(async\(\)=>\{/,'').replace(/\}\)\(\)$/,'');
  steps.push({ index: i, file: files[i], inner });
}

const combined = `(async()=>{const out=[];${steps.map((s) => `out[${s.index}]=await (async()=>{${s.inner}})();`).join('')}return out;})()`;
const out = { viewId, method: 'Runtime.evaluate', params: { expression: combined, awaitPromise: true, returnByValue: true } };
fs.writeFileSync(path.join(dir, '.mcp-combined-args.json'), JSON.stringify(out));
console.log(JSON.stringify({ start, end, steps: steps.length, exprLen: combined.length }));
