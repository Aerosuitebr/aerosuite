/**
 * Prep steps start..end; write each .cdp-step-N.mcp-ready.json call to stable file.
 * Agent runs: node .cdp-run-steps-loop.mjs prep <n> <viewId>
 * Then CallMcpTool browser_cdp with .cdp-mcp-call-now.json
 * Then: node .cdp-run-steps-loop.mjs save <n> '<json>'
 */
import fs from 'fs';
import { execSync } from 'child_process';

const cmd = process.argv[2];
const n = process.argv[3];
const viewId = process.argv[4] || '86ffcf';

if (cmd === 'prep') {
  execSync(`node .cdp-prep-ready.mjs ${n} ${viewId}`, { stdio: 'inherit' });
  fs.copyFileSync('.cdp-current-mcp-args.json', '.cdp-mcp-call-now.json');
  const a = JSON.parse(fs.readFileSync('.cdp-mcp-call-now.json', 'utf8'));
  console.log(JSON.stringify({ step: Number(n), viewId: a.viewId, exprLen: a.params?.expression?.length }));
} else if (cmd === 'save') {
  const raw = process.argv[5] || fs.readFileSync(0, 'utf8');
  const j = typeof raw === 'string' && raw.startsWith('{') ? JSON.parse(raw) : JSON.parse(raw);
  const value = j?.result?.value ?? j?.value ?? j;
  fs.writeFileSync(`.cdp-step-${n}.mcp-out.json`, JSON.stringify({ result: { type: 'object', value } }));
  console.log(JSON.stringify({ saved: Number(n), value }));
} else if (cmd === 'check') {
  const v = JSON.parse(fs.readFileSync(`.cdp-step-${n}.mcp-out.json`, 'utf8')).result?.value;
  const checks = {
    4: () => v?.len === 34708 && v?.ok === true,
    5: () => v?.b64 === 34708 && v?.hasGrid === true,
    6: () => v?.ok === true,
    7: () => v?.ok === true,
    29: () => v?.ok === true && v?.hasHeroV2 === true,
  };
  const ok = checks[n] ? checks[n]() : true;
  console.log(JSON.stringify({ step: Number(n), ok, value: v }));
  process.exit(ok ? 0 : 1);
}
