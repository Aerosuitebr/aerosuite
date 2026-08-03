/**
 * Emit-batch orchestrator: writes .cdp-mcp-pending.json, waits for .cdp-mcp-done.json
 * Agent: read pending -> CallMcpTool browser_cdp -> write done with full MCP response JSON
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const batches = [
  '.cdp-emit-0.txt',
  '.cdp-emit-1-3.txt',
  '.cdp-emit-4.txt',
  '.cdp-emit-5-7.txt',
  '.cdp-emit-8-12.txt',
  '.cdp-emit-13-18.txt',
  '.cdp-emit-19-24.txt',
  '.cdp-emit-25-28.txt',
  '.cdp-emit-29.txt',
];
const pending = path.join(dir, '.cdp-mcp-pending.json');
const done = path.join(dir, '.cdp-mcp-done.json');
const statePath = path.join(dir, '.cdp-emit-orchestrate-state.json');

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function extractValue(mcpRes) {
  return mcpRes?.result?.result?.value ?? mcpRes?.result?.value ?? null;
}

function mergeSteps(value, steps) {
  if (!value || typeof value !== 'object') return;
  for (const [k, v] of Object.entries(value)) {
    if (/^\d+$/.test(k)) steps[Number(k)] = v;
  }
}

function checkpointFail(step, v) {
  if (step === 4) return !(v?.len === 34708 && v?.ok === true);
  if (step === 5) return !(v?.b64 === 34708 && v?.hasGrid === true);
  if (step === 6) return v?.ok !== true;
  if (step === 7) return v?.ok !== true;
  if (step === 29) return !(v?.ok === true && v?.hasHeroV2 === true);
  return false;
}

const steps = {};
const errors = [];

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  const args = JSON.parse(fs.readFileSync(path.join(dir, batch), 'utf8'));
  if (fs.existsSync(done)) fs.unlinkSync(done);
  fs.writeFileSync(pending, JSON.stringify({ batch, index: i, args }, null, 0));
  process.stderr.write(`NEED_MCP ${batch}\n`);

  let got = false;
  for (let t = 0; t < 12000; t++) {
    if (fs.existsSync(done)) {
      const raw = fs.readFileSync(done, 'utf8');
      fs.unlinkSync(done);
      let mcpRes;
      try {
        mcpRes = JSON.parse(raw);
      } catch (e) {
        errors.push({ batch, error: 'invalid_done_json' });
        process.exit(1);
      }
      const value = extractValue(mcpRes);
      mergeSteps(value, steps);
      for (const [k, v] of Object.entries(steps)) {
        const n = Number(k);
        if ([4, 5, 6, 7, 29].includes(n) && checkpointFail(n, v)) {
          errors.push({ batch, step: n, value: v, checkpoint: 'fail' });
          fs.writeFileSync(statePath, JSON.stringify({ steps, errors, stopped: batch }, null, 2));
          console.log(JSON.stringify({ steps, errors, stopped: true }));
          process.exit(1);
        }
      }
      fs.writeFileSync(statePath, JSON.stringify({ steps, errors, lastBatch: batch }, null, 2));
      process.stderr.write(`OK ${batch}\n`);
      got = true;
      break;
    }
    sleep(50);
  }
  if (!got) {
    errors.push({ batch, error: 'timeout' });
    console.log(JSON.stringify({ steps, errors, stopped: true }));
    process.exit(2);
  }
}

console.log(JSON.stringify({ steps, errors, stopped: false }));
