/**
 * Emit next MCP browser_cdp payload from queue; agent writes response to .cdp-subagent-resp.json
 * Usage: node .cdp-subagent-run.mjs init 8c6826
 *        node .cdp-subagent-run.mjs next
 *        node .cdp-subagent-run.mjs save
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const queuePath = path.join(dir, '.cdp-subagent-queue.json');
const respPath = path.join(dir, '.cdp-subagent-resp.json');
const outPath = path.join(dir, '.cdp-subagent-results.json');

const cmd = process.argv[2];
const viewId = process.argv[3] || '8c6826';

const batches = [
  { type: 'step', n: 2, file: '.cdp-step-2-args.json' },
  { type: 'step', n: 3, file: '.cdp-step-3-args.json' },
  { type: 'batch', file: '.cdp-emit-4.txt' },
  { type: 'batch', file: '.cdp-emit-5-7.txt' },
  { type: 'batch', file: '.cdp-emit-8-12.txt' },
  { type: 'batch', file: '.cdp-emit-13-18.txt' },
  { type: 'batch', file: '.cdp-emit-19-24.txt' },
  { type: 'batch', file: '.cdp-emit-25-28.txt' },
  { type: 'batch', file: '.cdp-emit-29.txt' },
];

function loadArgs(item, vid) {
  if (item.type === 'step') {
    const j = JSON.parse(fs.readFileSync(path.join(dir, item.file), 'utf8'));
    j.viewId = vid;
    return j;
  }
  const j = JSON.parse(fs.readFileSync(path.join(dir, item.file), 'utf8'));
  return { viewId: vid, method: j.method, params: j.params };
}

function extractSteps(value, results) {
  if (!value || typeof value !== 'object') return;
  for (const [k, v] of Object.entries(value)) {
    if (/^\d+$/.test(k)) results[Number(k)] = v;
  }
}

function checkpoint(results) {
  const errors = [];
  if (results[4] && (results[4].len !== 34708 || !results[4].ok))
    errors.push({ step: 4, value: results[4] });
  if (results[5] && (results[5].b64 !== 34708 || !results[5].hasGrid))
    errors.push({ step: 5, value: results[5] });
  if (results[6] && !results[6].ok) errors.push({ step: 6, value: results[6] });
  if (results[7] && !results[7].ok) errors.push({ step: 7, value: results[7] });
  if (results[29] && (!results[29].ok || !results[29].hasHeroV2))
    errors.push({ step: 29, value: results[29] });
  return errors;
}

if (cmd === 'init') {
  const q = { viewId, idx: 0, results: { 1: { batch: 1, from: 5, to: 9 } }, errors: [] };
  fs.writeFileSync(queuePath, JSON.stringify(q));
  console.log(JSON.stringify({ ok: true, total: batches.length }));
  process.exit(0);
}

if (cmd === 'next') {
  const q = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  if (q.idx >= batches.length) {
    const errors = checkpoint(q.results);
    q.errors = errors;
    fs.writeFileSync(outPath, JSON.stringify(q));
    console.log(JSON.stringify({ done: true, results: q.results, errors }));
    process.exit(errors.length ? 1 : 0);
  }
  const item = batches[q.idx];
  const args = loadArgs(item, q.viewId);
  fs.writeFileSync(path.join(dir, '.cdp-subagent-payload.json'), JSON.stringify(args));
  console.log(JSON.stringify({ idx: q.idx, item, exprLen: args.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'save') {
  const q = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  const resp = JSON.parse(fs.readFileSync(respPath, 'utf8'));
  const value = resp?.result?.value;
  extractSteps(value, q.results);
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (!/^\d+$/.test(k) && (value.batch !== undefined || value.ok !== undefined)) {
        /* single-step return */
      }
    }
  }
  if (value && value.batch !== undefined) q.results[`css${q.idx}`] = value;
  const fail = checkpoint(q.results);
  if (fail.length) {
    q.errors = fail;
    fs.writeFileSync(queuePath, JSON.stringify(q));
    console.log(JSON.stringify({ ok: false, fail, value }));
    process.exit(1);
  }
  q.idx += 1;
  fs.writeFileSync(queuePath, JSON.stringify(q));
  console.log(JSON.stringify({ ok: true, idx: q.idx, value }));
  process.exit(0);
}

if (cmd === 'final') {
  const q = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  const r = q.results;
  console.log(
    JSON.stringify({
      viewId: 'a9930e',
      activeViewId: '8e6349',
      cssFullRun: r[4] ?? null,
      cssVerify: r[5] ?? null,
      cssFinalize: r[6] ?? null,
      encInit: r[7] ?? null,
      enc0: r[13] ?? null,
      enc1: r[19] ?? null,
      enc2: r[25] ?? null,
      enc3: r[28] ?? null,
      encRun: r[29] ?? null,
      errors: q.errors ?? [],
    }),
  );
  process.exit(0);
}

console.error('usage: init|next|save|final');
process.exit(2);
