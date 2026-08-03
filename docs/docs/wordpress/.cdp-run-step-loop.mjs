/**
 * Prep step N with viewId; stdout = path to args file.
 * Agent writes MCP response to .cdp-step-N.mcp-in.json then runs: node .cdp-run-step-loop.mjs save N
 */
import fs from 'fs';
import { execSync } from 'child_process';

const cmd = process.argv[2];
const n = Number(process.argv[3]);
const viewId = process.argv[4] || '4610b7';

function checkStep(step, value, raw) {
  if (raw?.exceptionDetails) return { fail: true, reason: 'exception', value: raw.exceptionDetails };
  if (step === 4 && (!value?.ok || value?.len !== 34708)) return { fail: true, reason: 'step4', value };
  if (step === 5 && (!value?.hasGrid || value?.b64 !== 34708)) return { fail: true, reason: 'step5', value };
  if (step === 6 && !value?.ok) return { fail: true, reason: 'step6', value };
  if (step === 7 && !value?.ok) return { fail: true, reason: 'step7', value };
  if (step === 29 && (!value?.ok || !value?.hasHeroV2)) return { fail: true, reason: 'step29', value };
  return { fail: false };
}

function extract(r) {
  return r?.result?.value ?? r?.result?.result?.value ?? r?.value ?? null;
}

if (cmd === 'prep') {
  execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { stdio: 'pipe' });
  console.log(JSON.stringify({ step: n, argsPath: '.cdp-current-mcp-args.json' }));
} else if (cmd === 'save') {
  const inPath = `.cdp-step-${n}.mcp-in.json`;
  const outPath = `.cdp-step-${n}.mcp-out.json`;
  const raw = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  fs.writeFileSync(outPath, JSON.stringify(raw));
  const value = extract(raw);
  const chk = checkStep(n, value, raw);
  if (chk.fail) {
    console.log(JSON.stringify({ ok: false, step: n, ...chk }));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, step: n, value }));
} else {
  console.error('usage: prep|save');
  process.exit(2);
}
