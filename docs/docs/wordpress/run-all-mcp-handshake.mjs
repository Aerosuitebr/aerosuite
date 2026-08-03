/**
 * Run all prepared MCP steps via file handshake.
 * Background: node run-all-mcp-handshake.mjs 3 29 f29abe
 * Agent: read .mcp-handshake-call.json -> CallMcpTool -> write .mcp-handshake-result.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const seq = path.join(dir, 'run-prepared-mcp-sequence.mjs');
const start = Number(process.argv[2] ?? 3);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'f29abe';
const callFile = path.join(dir, '.mcp-handshake-call.json');
const resultFile = path.join(dir, '.mcp-handshake-result.json');
const logFile = path.join(dir, '.mcp-handshake.log');

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function log(msg) { fs.appendFileSync(logFile, msg + '\n'); process.stderr.write(msg + '\n'); }

function loadArgs(idx) {
  execSync(`node "${seq}" args ${idx} ${viewId}`, { stdio: 'pipe' });
  return JSON.parse(fs.readFileSync(path.join(dir, '.mcp-call-args.json'), 'utf8'));
}

function extractValue(r) {
  return r?.result?.value ?? r?.result?.result?.value ?? r?.value ?? null;
}

fs.writeFileSync(logFile, '');
for (let i = start; i <= end; i++) {
  const args = loadArgs(i);
  if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
  fs.writeFileSync(callFile, JSON.stringify({ index: i, args }));
  log(`AWAIT ${i}`);

  let result = null;
  for (let t = 0; t < 900; t++) {
    if (fs.existsSync(resultFile)) {
      result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
      fs.unlinkSync(resultFile);
      break;
    }
    await sleep(200);
  }
  if (!result) {
    log(`TIMEOUT ${i}`);
    process.exit(1);
  }
  const tmp = path.join(dir, `.mcp-result-${i}.json`);
  fs.writeFileSync(tmp, JSON.stringify(result));
  execSync(`node "${seq}" record ${i} "${tmp}"`, { stdio: 'pipe' });
  const value = extractValue(result);
  log(`OK ${i} ${JSON.stringify(value).slice(0, 200)}`);

  if (i === 4 && (value?.len !== 34708 || !value?.ok)) { log(`FAIL cssFullRun ${JSON.stringify(value)}`); process.exit(1); }
  if (i === 5 && (value?.b64 !== 34708 || !value?.hasGrid)) { log(`FAIL cssVerify ${JSON.stringify(value)}`); process.exit(1); }
  if (i === 6 && !value?.ok) { log(`FAIL cssFinalize`); process.exit(1); }
  if (i === 7 && !value?.ok) { log(`FAIL encInit`); process.exit(1); }
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) { log(`FAIL encRun ${JSON.stringify(value)}`); process.exit(1); }
}

const summary = JSON.parse(execSync(`node "${seq}" summary a9930e ${viewId}`, { encoding: 'utf8' }));
fs.writeFileSync(path.join(dir, '.mcp-final-summary.json'), JSON.stringify(summary, null, 2));
log(`FINAL ${JSON.stringify(summary)}`);
process.exit(0);
