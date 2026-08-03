/**
 * Direct runner: no timeout loop — records step results to .mcp-direct-results.json
 * Agent runs chunks via browser_cdp then: node run-all-steps-direct.mjs record <step> <mcpJsonFile>
 * Usage: node run-all-steps-direct.mjs prepare <step> [viewId]
 *        node run-all-steps-direct.mjs record <step> <resultFile>
 *        node run-all-steps-direct.mjs summary
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const resultsPath = path.join(dir, '.mcp-direct-results.json');

function extractValue(r) {
  const v = r?.result?.result?.value ?? r?.result?.value ?? r?.value ?? null;
  if (v && typeof v === 'object' && 'value' in v && Object.keys(v).length === 1) return v.value;
  return v;
}

function loadResults() {
  return fs.existsSync(resultsPath)
    ? JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
    : { steps: {}, errors: [] };
}

function saveResults(r) {
  fs.writeFileSync(resultsPath, JSON.stringify(r, null, 2));
}

const cmd = process.argv[2];

if (cmd === 'prepare') {
  const step = Number(process.argv[3]);
  const viewId = process.argv[4] || 'bba9a4';
  execSync(`node run-step-chunks.mjs ${step} ${viewId}`, { cwd: dir, stdio: 'pipe' });
  const chunks = JSON.parse(
    fs.readFileSync(path.join(dir, `.mcp-step-${step}-chunks.json`), 'utf8')
  );
  fs.writeFileSync(path.join(dir, '.mcp-direct-chunks.json'), JSON.stringify({ step, chunks }));
  console.log(JSON.stringify({ step, parts: chunks.length, viewId }));
  process.exit(0);
}

if (cmd === 'record') {
  const step = Number(process.argv[3]);
  const raw = JSON.parse(fs.readFileSync(path.resolve(process.argv[4]), 'utf8'));
  const value = extractValue(raw);
  const r = loadResults();
  r.steps[step] = { value, raw };
  if (step === 4 && (value?.len !== 34708 || !value?.ok)) {
    r.errors.push({ step: 4, value });
  }
  if (step === 5 && (value?.b64 !== 34708 || !value?.hasGrid)) {
    r.errors.push({ step: 5, value });
  }
  if (step === 6 && !value?.ok) r.errors.push({ step: 6, value });
  if (step === 7 && !value?.ok) r.errors.push({ step: 7, value });
  if (step === 29 && (!value?.ok || !value?.hasHeroV2)) {
    r.errors.push({ step: 29, value });
  }
  saveResults(r);
  console.log(JSON.stringify({ step, value }));
  process.exit(0);
}

if (cmd === 'summary') {
  console.log(JSON.stringify(loadResults(), null, 2));
  process.exit(0);
}

console.error('prepare <step> [viewId] | record <step> <file> | summary');
process.exit(2);
