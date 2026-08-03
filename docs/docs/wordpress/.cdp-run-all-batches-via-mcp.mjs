/**
 * Run all 9 CDP batches; agent must call browser_cdp per batch using .cdp-mcp-invoke-N.json
 * and save response to .cdp-batch-N-result.json, then: node .cdp-run-all-batches-via-mcp.mjs collect
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[3] || 'd0bf03';

if (cmd === 'list') {
  for (let i = 0; i < 9; i++) {
    const a = JSON.parse(fs.readFileSync(path.join(dir, `.cdp-mcp-invoke-${i}.json`), 'utf8'));
    console.log(JSON.stringify({ batch: i, viewId: a.viewId, exprLen: a.params?.expression?.length ?? 0 }));
  }
  process.exit(0);
}

if (cmd === 'collect') {
  const results = {};
  const errors = [];
  for (let i = 0; i < 9; i++) {
    const p = path.join(dir, `.cdp-batch-${i}-result.json`);
    if (!fs.existsSync(p)) {
      errors.push({ batch: i, error: 'missing result' });
      continue;
    }
    const resp = JSON.parse(fs.readFileSync(p, 'utf8'));
    const val = resp?.result?.value;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      for (const [k, v] of Object.entries(val)) {
        if (/^\d+$/.test(k)) results[Number(k)] = v;
      }
    }
  }
  const s4 = results[4];
  if (!s4?.ok || s4?.len !== 34708) errors.push({ step: 4, value: s4, reason: 'cssFullRun' });
  if (!results[5]?.hasGrid) errors.push({ step: 5, value: results[5], reason: 'cssVerify' });
  if (!results[6]?.ok) errors.push({ step: 6, value: results[6], reason: 'cssFinalize' });
  if (!results[7]?.ok) errors.push({ step: 7, value: results[7], reason: 'encInit' });
  if (!results[29]?.ok || !results[29]?.hasHeroV2) errors.push({ step: 29, value: results[29], reason: 'encRun' });
  const out = {
    viewId: 'a9930e',
    activeViewId: viewId,
    cssFullRun: results[4] ?? null,
    cssVerify: results[5] ?? null,
    cssFinalize: results[6] ?? null,
    encInit: results[7] ?? null,
    enc0: results[13] ?? null,
    enc1: results[19] ?? null,
    enc2: results[25] ?? null,
    enc3: results[28] ?? null,
    encRun: results[29] ?? null,
    errors,
  };
  console.log(JSON.stringify(out));
  process.exit(errors.length ? 1 : 0);
}

console.error('usage: list|collect');
process.exit(2);
