/**
 * Prepare one runner step for agent browser_cdp.
 * Large steps: all b64 parts in one combo CDP call -> .mcp-step-args.json
 * Small steps: full payload -> .mcp-step-args.json
 * Usage: node mcp-auto-step.mjs <n> [viewId]
 */
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '4d6eae';
const j = JSON.parse(fs.readFileSync(path.join(dir, `.mcp-payload-${n}.json`), 'utf8'));
const expr = (j.arguments?.params ?? j.params).expression;
const len = expr.length;
const out = path.join(dir, '.mcp-step-args.json');

if (len > 3000) {
  execSync(`node mcp-b64-parts.mjs emit ${n} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const calls = JSON.parse(fs.readFileSync(path.join(dir, `.mcp-b64-calls-${n}.json`), 'utf8'));
  const parts = calls.slice(0, -1).map((c) => c.params.expression);
  const final = calls[calls.length - 1].params.expression;
  const combo =
    '(async()=>{' +
    parts.map((p) => `eval(${JSON.stringify(p)});`).join('') +
    `return await eval(${JSON.stringify(final)});})()`;
  fs.writeFileSync(
    out,
    JSON.stringify({
      viewId,
      method: 'Runtime.evaluate',
      params: { expression: combo, awaitPromise: true, returnByValue: true },
    })
  );
  console.log(JSON.stringify({ step: n, mode: 'b64-combo', parts: calls.length, comboLen: combo.length }));
} else {
  execSync(`node mcp-emit-args.mjs ${n} ${viewId} ${out}`, { cwd: dir, stdio: 'pipe' });
  console.log(JSON.stringify({ step: n, mode: 'direct', exprLen: len }));
}
