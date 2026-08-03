/**
 * Prepare/record MCP browser_cdp steps from .mcp-*.json files.
 * prepare <relativeJson> <viewId>  -> .cdp-current-mcp-args.json
 * record <summaryKey> '<mcpResponse>'
 * list-steps <viewId>  -> ordered file list
 * summary <viewId>  -> final JSON
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(dir, 'mcp-deploy-state.json');
const cmd = process.argv[2];

function loadState() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { summary: {}, errors: [], done: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

function orderedSteps(viewId) {
  const list = [
    '.mcp-cssfull-batch-0.json',
    '.mcp-cssfull-batch-1.json',
    '.mcp-cssfull-batch-2.json',
    '.mcp-cssfull-batch-3.json',
    '.mcp-cssfull-run.json',
    '.mcp-css-verify.json',
    '.mcp-css-finalize.json',
    '.mcp-enc-init.json',
  ];
  for (const enc of ['enc-0', 'enc-1', 'enc-2', 'enc-3']) {
    const encDir = path.join(dir, `.mcp-${enc}`);
    if (!fs.existsSync(encDir)) {
      execSync(`node emit-mcp-chunks.mjs ${enc} ${viewId}`, { cwd: dir, stdio: 'inherit' });
    }
    const uploads = fs
      .readdirSync(encDir)
      .filter((f) => /^upload-\d+\.json$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    for (const u of uploads) list.push(path.join(`.mcp-${enc}`, u));
    list.push(path.join(`.mcp-${enc}`, 'run.json'));
  }
  list.push('.mcp-enc-run.json');
  return list;
}

function extractValue(resp) {
  const r = typeof resp === 'string' ? JSON.parse(resp) : resp;
  if (r?.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r?.result?.value ?? r?.value ?? r;
}

function summaryKeyFor(file) {
  if (file.endsWith('cssfull-run.json')) return 'cssFullRun';
  if (file.endsWith('css-verify.json')) return 'cssVerify';
  if (file.endsWith('css-finalize.json')) return 'cssFinalize';
  if (file.endsWith('enc-init.json')) return 'encInit';
  if (file.endsWith('enc-run.json')) return 'encRun';
  const m = file.match(/\.mcp-(enc-\d)\/run\.json$/);
  if (m) return m[1].replace('-', '');
  return null;
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

if (cmd === 'reset') {
  saveState({ summary: {}, errors: [], done: [] });
  console.log('reset');
  process.exit(0);
}

if (cmd === 'list-steps') {
  const viewId = process.argv[3] || 'b5108e';
  const steps = orderedSteps(viewId);
  console.log(JSON.stringify({ viewId, steps, count: steps.length }));
  process.exit(0);
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
  return { viewId: args.viewId, method: args.method, params: args.params };
}

if (cmd === 'emit-args') {
  const rel = process.argv[3];
  const viewId = process.argv[4] || 'b5108e';
  process.stdout.write(JSON.stringify(buildPayload(rel, viewId)));
  process.exit(0);
}

if (cmd === 'prepare') {
  const rel = process.argv[3];
  const viewId = process.argv[4] || 'b5108e';
  const payload = buildPayload(rel, viewId);
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(payload));
  console.log(JSON.stringify({ file: rel, exprLen: payload.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'record') {
  const rel = process.argv[3];
  const raw = process.argv[4] || '{}';
  const state = loadState();
  try {
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
  const out = {
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
  };
  console.log(JSON.stringify(out));
  process.exit(state.errors.length ? 1 : 0);
}

console.error('usage: reset|list-steps|prepare|record|summary');
process.exit(2);
