/**
 * Prepare .mcp-current.json for step N; merge result into .deploy-results.json
 * Usage: node mcp-step-bridge.mjs prepare N [viewId]
 *        node mcp-step-bridge.mjs record N '<json result>'
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const resultsPath = path.join(dir, '.deploy-results.json');

function loadResults() {
  if (!fs.existsSync(resultsPath)) return { steps: {}, errors: [] };
  return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
}

if (cmd === 'prepare') {
  const n = Number(process.argv[3]);
  const viewId = process.argv[4] ?? 'd79a58';
  const json = execSync(`node exec-mcp-step.mjs ${n} ${viewId}`, {
    cwd: dir,
    encoding: 'utf8',
  });
  fs.writeFileSync(path.join(dir, '.mcp-current.json'), json);
  const args = JSON.parse(json);
  console.log(JSON.stringify({ step: n, exprLen: args.params.expression.length }));
} else if (cmd === 'record') {
  const n = Number(process.argv[3]);
  const value = JSON.parse(process.argv[4]);
  const r = loadResults();
  r.steps[n] = value;
  fs.writeFileSync(resultsPath, JSON.stringify(r, null, 2));
  console.log('recorded', n, JSON.stringify(value).slice(0, 120));
} else if (cmd === 'error') {
  const n = Number(process.argv[3]);
  const msg = process.argv[4];
  const r = loadResults();
  r.errors.push({ step: n, message: msg });
  fs.writeFileSync(resultsPath, JSON.stringify(r, null, 2));
} else if (cmd === 'summary') {
  const r = loadResults();
  console.log(JSON.stringify(r, null, 2));
}
