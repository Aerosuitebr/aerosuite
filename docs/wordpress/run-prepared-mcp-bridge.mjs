/**
 * Bridge for prepared MCP file sequence.
 * Writes .mcp-pending-invoke.json, waits for .mcp-pending-result.json
 * Usage: node run-prepared-mcp-bridge.mjs <startIndex> <endIndex> [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'f29abe';
const invokeFile = path.join(dir, '.mcp-pending-invoke.json');
const resultFile = path.join(dir, '.mcp-pending-result.json');
const seqScript = path.join(dir, 'run-prepared-mcp-sequence.mjs');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractValue(r) {
  return r?.result?.value ?? r?.result?.result?.value ?? r?.value ?? null;
}

const errors = [];

for (let i = start; i <= end; i++) {
  execSync(`node "${seqScript}" args ${i} ${viewId}`, { stdio: 'pipe' });
  const args = JSON.parse(fs.readFileSync(path.join(dir, '.mcp-call-args.json'), 'utf8'));
  if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
  fs.writeFileSync(invokeFile, JSON.stringify({ index: i, args }));
  process.stderr.write(`AWAIT ${i}\n`);

  let result = null;
  for (let t = 0; t < 600; t++) {
    if (fs.existsSync(resultFile)) {
      result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
      fs.unlinkSync(resultFile);
      break;
    }
    await sleep(200);
  }
  if (!result) {
    errors.push({ index: i, error: 'timeout' });
    break;
  }
  const tmp = path.join(dir, `.mcp-result-${i}.json`);
  fs.writeFileSync(tmp, JSON.stringify(result));
  execSync(`node "${seqScript}" record ${i} "${tmp}"`, { stdio: 'pipe' });
  const value = extractValue(result);
  process.stderr.write(`OK ${i} ${JSON.stringify(value).slice(0, 160)}\n`);

  if (i === 4 && (value?.len !== 34708 || !value?.ok)) {
    errors.push({ index: i, reason: 'cssFullRun', value });
    break;
  }
  if (i === 5 && (value?.b64 !== 34708 || !value?.hasGrid)) {
    errors.push({ index: i, reason: 'cssVerify', value });
    break;
  }
  if (i === 6 && !value?.ok) {
    errors.push({ index: i, reason: 'cssFinalize', value });
    break;
  }
  if (i === 7 && !value?.ok) {
    errors.push({ index: i, reason: 'encInit', value });
    break;
  }
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) {
    errors.push({ index: i, reason: 'encRun', value });
    break;
  }
}

const summary = JSON.parse(execSync(`node "${seqScript}" summary a9930e ${viewId}`, { encoding: 'utf8' }));
summary.errors = [...(summary.errors || []), ...errors];
fs.writeFileSync(path.join(dir, '.mcp-final-summary.json'), JSON.stringify(summary, null, 2));
process.stdout.write(`FINAL ${JSON.stringify(summary)}\n`);
process.exit(errors.length ? 1 : 0);
