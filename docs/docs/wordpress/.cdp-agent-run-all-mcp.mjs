/**
 * Drive all steps 0-29: writes .cdp-mcp-queue.jsonl and records from .cdp-mcp-results/
 * Agent: for each line, CallMcpTool browser_cdp with parsed args, save result to .cdp-mcp-results/N.json
 * Then: node .cdp-agent-run-all-mcp.mjs finalize
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const live = process.argv[3] || 'b45110';
const cmd = process.argv[2] || 'prepare';
const resultsDir = path.join(dir, '.cdp-mcp-results');
const statePath = path.join(dir, '.cdp-agent-deploy-state.json');

const summaryKeys = {
  4: 'cssFullRun',
  5: 'cssVerify',
  6: 'cssFinalize',
  7: 'encInit',
  13: 'enc0',
  19: 'enc1',
  25: 'enc2',
  28: 'enc3',
  29: 'encRun',
};

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) {
    return { fail: true, reason: `cssFullRun len=${value?.len} ok=${value?.ok}` };
  }
  if (i === 5 && (!value?.hasGrid || value?.b64 !== 34708)) {
    return { fail: true, reason: 'cssVerify' };
  }
  if (i === 6 && !value?.ok) return { fail: true, reason: 'cssFinalize' };
  if (i === 7 && !value?.ok) return { fail: true, reason: 'encInit' };
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) {
    return { fail: true, reason: 'encRun' };
  }
  return { fail: false };
}

function extractValue(r) {
  const j = typeof r === 'string' ? JSON.parse(r) : r;
  if (j?.exceptionDetails) throw new Error(JSON.stringify(j.exceptionDetails));
  return j?.result?.value ?? j?.value;
}

if (cmd === 'prepare') {
  fs.mkdirSync(resultsDir, { recursive: true });
  const lines = [];
  for (let n = 0; n <= 29; n++) {
    execSync(`node .cdp-agent-mcp-step.mjs ${n} ${live}`, { cwd: dir, stdio: 'pipe' });
    const args = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-step-${n}-live-args.json`), 'utf8'));
    lines.push(JSON.stringify({ step: n, args }));
  }
  fs.writeFileSync(path.join(dir, '.cdp-mcp-queue.jsonl'), lines.join('\n'), 'utf8');
  console.log(JSON.stringify({ ok: true, steps: 30, queue: '.cdp-mcp-queue.jsonl' }));
  process.exit(0);
}

if (cmd === 'finalize') {
  const state = { results: {}, summary: {}, errors: [] };
  for (let n = 0; n <= 29; n++) {
    const p = path.join(resultsDir, `${n}.json`);
    if (!fs.existsSync(p)) {
      state.errors.push({ step: n, error: 'missing result' });
      continue;
    }
    try {
      const value = extractValue(fs.readFileSync(p, 'utf8'));
      state.results[n] = value;
      const key = summaryKeys[n];
      if (key) state.summary[key] = value;
      const chk = checkStep(n, value);
      if (chk.fail) state.errors.push({ step: n, value, reason: chk.reason });
    } catch (e) {
      state.errors.push({ step: n, error: String(e) });
    }
  }
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  const out = {
    viewId: 'a9930e',
    activeViewId: '4a20d1',
    cssFullRun: state.summary.cssFullRun ?? null,
    cssVerify: state.summary.cssVerify ?? null,
    cssFinalize: state.summary.cssFinalize ?? null,
    encInit: state.summary.encInit ?? null,
    enc0: state.summary.enc0 ?? null,
    enc1: state.summary.enc1 ?? null,
    enc2: state.summary.enc2 ?? null,
    enc3: state.summary.enc3 ?? null,
    encRun: state.summary.encRun ?? null,
    errors: state.errors,
  };
  console.log(JSON.stringify(out));
  process.exit(state.errors.length ? 1 : 0);
}

console.error('prepare|finalize');
process.exit(2);
