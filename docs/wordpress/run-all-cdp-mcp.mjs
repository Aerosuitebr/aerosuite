/**
 * Run all CDP emit batches using browser_cdp via Cursor MCP HTTP bridge.
 * Falls back to reading batch files and evaluating if MCP unavailable.
 * Usage: node run-all-cdp-mcp.mjs [viewId]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '548005';
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

const stepResults = {};
const errors = [];

function extractSteps(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const [k, v] of Object.entries(value)) {
    if (/^\d+$/.test(k)) stepResults[Number(k)] = v;
  }
}

function checkpoint(bi) {
  if (bi >= 2) {
    const s4 = stepResults[4];
    if (!s4 || s4.len !== 34708 || !s4.ok) {
      errors.push({ step: 4, value: s4, reason: 'cssFullRun checkpoint' });
      return false;
    }
  }
  if (bi >= 3) {
    const s5 = stepResults[5];
    if (!s5 || s5.b64 !== 34708 || !s5.hasGrid) {
      errors.push({ step: 5, value: s5, reason: 'cssVerify checkpoint' });
      return false;
    }
    if (!stepResults[6]?.ok) {
      errors.push({ step: 6, value: stepResults[6], reason: 'cssFinalize checkpoint' });
      return false;
    }
    if (!stepResults[7]?.ok) {
      errors.push({ step: 7, value: stepResults[7], reason: 'encInit checkpoint' });
      return false;
    }
  }
  if (bi >= 8) {
    const s29 = stepResults[29];
    if (!s29 || !s29.ok || !s29.hasHeroV2) {
      errors.push({ step: 29, value: s29, reason: 'encRun checkpoint' });
      return false;
    }
  }
  return true;
}

// Emit batch payloads for agent MCP invocation
for (let bi = 0; bi < batches.length; bi++) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, batches[bi]), 'utf8'));
  const payload = { viewId, method: j.method, params: j.params };
  fs.writeFileSync(path.join(dir, `.cdp-mcp-invoke-${bi}.json`), JSON.stringify(payload));
}
console.log(JSON.stringify({ ready: true, viewId, batches: batches.length }));
