/**
 * Agent helper: print next step to run from state file.
 * Agent calls browser_cdp with .cdp-step-N-live-args.json then:
 *   node .agent-run-mcp-steps.mjs record <N> <path-to-mcp-response.json>
 */
import fs from 'fs';

const cmd = process.argv[2];
const statePath = '.cdp-agent-deploy-state.json';
const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function load() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { next: 0, results: {}, summary: {}, errors: [] };
}

function save(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function check(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 ${JSON.stringify(value)}`;
  if (i === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return `step5 ${JSON.stringify(value)}`;
  if (i === 6 && !value?.ok) return 'step6';
  if (i === 7 && !value?.ok) return 'step7';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return `step29 ${JSON.stringify(value)}`;
  return null;
}

if (cmd === 'init') {
  save({ next: 0, results: { 0: { batch: 0, from: 0, to: 4 } }, summary: {}, errors: [] });
  console.log(JSON.stringify({ next: 1 }));
  process.exit(0);
}

if (cmd === 'record') {
  const n = Number(process.argv[3]);
  const raw = fs.readFileSync(process.argv[4], 'utf8');
  const j = JSON.parse(raw);
  const value = j?.result?.value ?? j?.result?.result?.value;
  const state = load();
  state.results[n] = value;
  const key = summaryKeys[n];
  if (key) state.summary[key] = value;
  const err = check(n, value);
  if (err) {
    state.errors.push({ step: n, reason: err, value });
    save(state);
    console.log(JSON.stringify({ ok: false, step: n, err, retryFrom: n === 4 ? 0 : null }));
    process.exit(1);
  }
  state.next = n + 1;
  save(state);
  console.log(JSON.stringify({ ok: true, step: n, value, next: state.next }));
  process.exit(0);
}

if (cmd === 'next') {
  const state = load();
  const n = state.next ?? 0;
  if (n > 29) {
    console.log(JSON.stringify({ done: true, summary: state.summary }));
    process.exit(0);
  }
  const argsPath = `.cdp-step-${n}-live-args.json`;
  console.log(JSON.stringify({ step: n, argsPath, args: JSON.parse(fs.readFileSync(argsPath, 'utf8')) }));
  process.exit(0);
}

if (cmd === 'final') {
  const state = load();
  console.log(JSON.stringify({
    viewId: 'd15c6f',
    activeViewId: '3fdf38',
    cssFullRun: state.summary.cssFullRun ?? state.results[4],
    cssVerify: state.summary.cssVerify ?? state.results[5],
    cssFinalize: state.summary.cssFinalize ?? state.results[6],
    encInit: state.summary.encInit ?? state.results[7],
    enc0: state.summary.enc0 ?? state.results[13],
    enc1: state.summary.enc1 ?? state.results[19],
    enc2: state.summary.enc2 ?? state.results[25],
    enc3: state.summary.enc3 ?? state.results[28],
    encRun: state.summary.encRun ?? state.results[29],
    errors: state.errors,
  }));
}
