/**
 * Agent CDP step helper.
 * emit <mcpJsonRel> [viewId]  -> stdout: arguments JSON only
 * record <mcpJsonRel> <resultFile> -> updates mcp-deploy-state.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, 'mcp-deploy-state.json');

function loadState() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { summary: {}, errors: [], done: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function buildPayload(rel, viewId) {
  const src = path.join(dir, rel);
  const j = JSON.parse(fs.readFileSync(src, 'utf8'));
  let args;
  if (j.arguments) args = { ...j.arguments };
  else if (j.method && j.params) args = { ...j };
  else args = { method: 'Runtime.evaluate', params: j };
  args.viewId = viewId;
  if (!args.method) args.method = 'Runtime.evaluate';
  return args;
}

function summaryKeyFor(file) {
  if (file.endsWith('cssfull-run.json')) return 'cssFullRun';
  if (file.endsWith('css-verify.json')) return 'cssVerify';
  if (file.endsWith('css-finalize.json')) return 'cssFinalize';
  if (file.endsWith('enc-init.json')) return 'encInit';
  if (file.endsWith('enc-run.json')) return 'encRun';
  const m = file.replace(/\\/g, '/').match(/\.mcp-(enc-\d)\/run\.json$/);
  if (m) return m[1].replace('-', '');
  return null;
}

function extractValue(resp) {
  const r = typeof resp === 'string' ? JSON.parse(resp) : resp;
  if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r?.result?.value ?? r?.value ?? r;
}

function checkpoint(file, value) {
  if (file.endsWith('cssfull-run.json') && (!value?.ok || value?.len !== 34708)) {
    return { fail: true, reason: 'cssFullRun', value };
  }
  if (file.endsWith('css-verify.json') && (!value?.hasGrid || value?.b64 !== 34708)) {
    return { fail: true, reason: 'cssVerify', value };
  }
  if (file.endsWith('css-finalize.json') && !value?.ok) {
    return { fail: true, reason: 'cssFinalize', value };
  }
  if (file.endsWith('enc-init.json') && !value?.ok) {
    return { fail: true, reason: 'encInit', value };
  }
  if (file.endsWith('enc-run.json') && (!value?.ok || !value?.hasHeroV2)) {
    return { fail: true, reason: 'encRun', value };
  }
  return { fail: false };
}

const cmd = process.argv[2];
if (cmd === 'emit') {
  const rel = process.argv[3];
  const viewId = process.argv[4] || 'a9930e';
  process.stdout.write(JSON.stringify(buildPayload(rel, viewId)));
  process.exit(0);
}

if (cmd === 'record') {
  const rel = process.argv[3];
  const resultFile = process.argv[4];
  const state = loadState();
  try {
    const raw = fs.readFileSync(resultFile, 'utf8');
    const value = extractValue(raw);
    const key = summaryKeyFor(rel);
    if (key) state.summary[key] = value;
    state.done.push(rel);
    const chk = checkpoint(rel, value);
    if (chk.fail) {
      state.errors.push({ file: rel, reason: chk.reason, value: chk.value });
      saveState(state);
      console.log(JSON.stringify({ ok: false, file: rel, value, stopped: true }));
      process.exit(1);
    }
    saveState(state);
    console.log(JSON.stringify({ ok: true, file: rel, value }));
    process.exit(0);
  } catch (e) {
    state.errors.push({ file: rel, error: String(e) });
    saveState(state);
    console.log(JSON.stringify({ ok: false, file: rel, error: String(e) }));
    process.exit(1);
  }
}

if (cmd === 'summary') {
  const viewId = process.argv[3] || 'a9930e';
  const state = loadState();
  const s = state.summary;
  console.log(
    JSON.stringify({
      viewId,
      cssFullRun: s.cssFullRun ?? null,
      cssVerify: s.cssVerify ?? null,
      cssFinalize: s.cssFinalize ?? null,
      encInit: s.encInit ?? null,
      enc0: s.enc0 ?? null,
      enc1: s.enc1 ?? null,
      enc2: s.enc2 ?? null,
      enc3: s.enc3 ?? null,
      encRun: s.encRun ?? null,
      errors: state.errors,
    })
  );
  process.exit(state.errors.length ? 1 : 0);
}

console.error('usage: emit|record|summary');
process.exit(2);
