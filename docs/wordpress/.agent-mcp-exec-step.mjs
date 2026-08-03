/**
 * Read .cdp-step-N-live-args.json and write MCP-shaped result from stdin.
 * Usage: node .agent-mcp-exec-step.mjs record <N> <mcp-response.json>
 */
import fs from 'fs';

const n = Number(process.argv[3]);
const statePath = '.cdp-agent-deploy-state.json';
const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function check(i, v) {
  if (i === 4 && (!v?.ok || v?.len !== 34708)) return `step4 ${JSON.stringify(v)}`;
  if (i === 5 && (!v?.hasGrid || v?.b64 !== 34708)) return `step5 ${JSON.stringify(v)}`;
  if (i === 6 && !v?.ok) return 'step6';
  if (i === 7 && !v?.ok) return 'step7';
  if (i === 29 && (!v?.ok || !v?.hasHeroV2)) return `step29 ${JSON.stringify(v)}`;
  return null;
}

const raw = fs.readFileSync(process.argv[4], 'utf8');
const j = JSON.parse(raw);
const value = j?.result?.value ?? j?.result?.result?.value;
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
state.results[n] = value;
if (summaryKeys[n]) state.summary[summaryKeys[n]] = value;
const err = check(n, value);
if (err) {
  state.errors.push({ step: n, reason: err, value });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  console.log(JSON.stringify({ ok: false, step: n, err }));
  process.exit(1);
}
state.next = n + 1;
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
console.log(JSON.stringify({ ok: true, step: n, value }));
