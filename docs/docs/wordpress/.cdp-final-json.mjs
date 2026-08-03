/**
 * Build final deploy summary from .cdp-step-N-result.json files.
 * Usage: node .cdp-final-json.mjs [activeViewId]
 */
import fs from 'fs';

const activeViewId = process.argv[2] || '9e0614';
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

function readValue(n) {
  const p = `.cdp-step-${n}-result.json`;
  if (!fs.existsSync(p)) return null;
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  return raw?.result?.value ?? null;
}

const out = {
  viewId: 'a9930e',
  activeViewId,
  cssFullRun: readValue(4),
  cssVerify: readValue(5),
  cssFinalize: readValue(6),
  encInit: readValue(7),
  enc0: readValue(13),
  enc1: readValue(19),
  enc2: readValue(25),
  enc3: readValue(28),
  encRun: readValue(29),
  errors: [],
};

if (!out.cssFullRun?.ok || out.cssFullRun?.len !== 34708) {
  out.errors.push({ step: 4, reason: `len=${out.cssFullRun?.len} ok=${out.cssFullRun?.ok}` });
}
if (!out.cssVerify?.hasGrid) out.errors.push({ step: 5, reason: 'hasGrid' });
if (!out.cssFinalize?.ok) out.errors.push({ step: 6, reason: 'ok' });
if (!out.encInit?.ok) out.errors.push({ step: 7, reason: 'ok' });
if (!out.encRun?.ok || !out.encRun?.hasHeroV2) out.errors.push({ step: 29, reason: 'encRun' });

console.log(JSON.stringify(out));
