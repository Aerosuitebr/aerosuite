/**
 * Execute prepared MCP JSON files using CallMcpTool-equivalent page.evaluate loop.
 * When CDP unavailable, emits one-line JSON per step for agent MCP relay.
 * Usage: node run-prepared-all-via-eval.mjs [startIndex] [endIndex] [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const seq = path.join(dir, 'run-prepared-mcp-sequence.mjs');
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'f29abe';
const files = JSON.parse(execSync(`node "${seq}" list`, { encoding: 'utf8' })).files;

function loadArgs(rel) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8'));
  if (j.arguments) return { ...j.arguments, viewId };
  return { viewId, method: 'Runtime.evaluate', params: j };
}

function checkIndex(i, value) {
  const f = files[i];
  if (f.includes('cssfull-run') && (value?.len !== 34708 || !value?.ok)) return { step: 'cssFullRun', value };
  if (f.includes('css-verify') && (value?.b64 !== 34708 || !value?.hasGrid)) return { step: 'cssVerify', value };
  if (f.includes('css-finalize') && !value?.ok) return { step: 'cssFinalize', value };
  if (f.includes('enc-init') && !value?.ok) return { step: 'encInit', value };
  if (f.includes('enc-run') && (!value?.ok || !value?.hasHeroV2)) return { step: 'encRun', value };
  return null;
}

const results = {};
const errors = [];

for (let i = start; i <= end; i++) {
  const args = loadArgs(files[i]);
  const outPath = path.join(dir, '.mcp-call-args.json');
  fs.writeFileSync(outPath, JSON.stringify(args));
  const resultPath = path.join(dir, `.mcp-step-result-${i}.json`);
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  console.log(JSON.stringify({ action: 'MCP_CALL', index: i, file: files[i], exprLen: args.params?.expression?.length ?? 0, resultPath }));
  process.exit(0);
}
