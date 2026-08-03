/**
 * Handshake: writes .cdp-pending-mcp.json per step; agent CallMcpTool + writes .cdp-mcp-result.json
 * Usage: node .cdp-agent-mcp-handshake.mjs <start> <end> <viewId>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = Number(process.argv[2] ?? 2);
const end = Number(process.argv[3] ?? 29);
const viewId = process.argv[4] ?? 'af93cf';
const pending = path.join(dir, '.cdp-pending-mcp.json');
const result = path.join(dir, '.cdp-mcp-result.json');
const statePath = path.join(dir, '.cdp-run-all-state.json');

function loadState() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { results: {}, errors: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function checkStep(i, value) {
  if (i === 4 && (!value?.ok || value?.len !== 34708)) return `step4 len=${value?.len} ok=${value?.ok}`;
  if (i === 5 && !value?.hasGrid) return 'step5 hasGrid';
  if (i === 6 && !value?.ok) return 'step6 ok';
  if (i === 7 && !value?.ok) return 'step7 ok';
  if (i === 29 && (!value?.ok || !value?.hasHeroV2)) return 'step29 encRun';
  return null;
}

function record(n, raw) {
  const resp = JSON.parse(raw);
  const value = resp?.result?.value;
  const state = loadState();
  state.results[n] = value;
  fs.writeFileSync(path.join(dir, `.cdp-step-${n}.mcp-out.json`), raw);
  const fail = checkStep(n, value);
  if (fail) {
    state.errors.push({ step: n, value, reason: fail });
    saveState(state);
    console.log(JSON.stringify({ ok: false, step: n, value, reason: fail }));
    process.exit(1);
  }
  saveState(state);
  process.stderr.write(`OK ${n}\n`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (let n = start; n <= end; n++) {
  const callPath = path.join(dir, `.cdp-call-${n}.json`);
  const args = JSON.parse(fs.readFileSync(callPath, 'utf8'));
  args.viewId = viewId;
  if (fs.existsSync(result)) fs.unlinkSync(result);
  fs.writeFileSync(pending, JSON.stringify({ step: n, args }, null, 2));
  process.stderr.write(`AWAIT ${n}\n`);

  let got = false;
  for (let t = 0; t < 900; t++) {
    if (fs.existsSync(result)) {
      got = true;
      break;
    }
    await sleep(200);
  }
  if (!got) {
    console.log(JSON.stringify({ error: 'timeout', step: n }));
    process.exit(1);
  }
  const raw = fs.readFileSync(result, 'utf8');
  fs.unlinkSync(result);
  try {
    record(n, raw);
    if (n === 4) {
      const v = JSON.parse(raw)?.result?.value;
      if (!v?.ok || v?.len !== 34708) {
        process.stderr.write('RETRY_0_3\n');
        for (let r = 0; r <= 3; r++) {
          const a2 = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-call-${r}.json`), 'utf8'));
          a2.viewId = viewId;
          if (fs.existsSync(result)) fs.unlinkSync(result);
          fs.writeFileSync(pending, JSON.stringify({ step: r, args: a2 }));
          process.stderr.write(`AWAIT ${r}\n`);
          got = false;
          for (let t = 0; t < 900; t++) {
            if (fs.existsSync(result)) {
              got = true;
              break;
            }
            await sleep(200);
          }
          if (!got) {
            console.log(JSON.stringify({ error: 'timeout', step: r }));
            process.exit(1);
          }
          record(r, fs.readFileSync(result, 'utf8'));
          fs.unlinkSync(result);
        }
        n = 3;
      }
    }
  } catch (e) {
    console.log(JSON.stringify({ error: String(e), step: n }));
    process.exit(1);
  }
}

const state = loadState();
const out = {
  viewId: 'a9930e',
  activeViewId: '4a20d1',
  cssFullRun: state.results[4] ?? null,
  cssVerify: state.results[5] ?? null,
  cssFinalize: state.results[6] ?? null,
  encInit: state.results[7] ?? null,
  enc0: state.results[13] ?? null,
  enc1: state.results[19] ?? null,
  enc2: state.results[25] ?? null,
  enc3: state.results[28] ?? null,
  encRun: state.results[29] ?? null,
  errors: state.errors,
};
console.log(JSON.stringify(out));
