/**
 * Prepare CDP args for deploy-encoding steps; agent calls browser_cdp then records result.
 * Usage: node run-cdp-deploy-steps.mjs prepare <step>
 *        node run-cdp-deploy-steps.mjs record <step> <mcp-response.json>
 *        node run-cdp-deploy-steps.mjs summary
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const STEPS = [0, 1, 2, 3, 4, 'run'];
const viewId = process.argv[3] || '44c6d7';
const argsPath = path.join(dir, '.deploy-handshake-args.json');
const statePath = path.join(dir, '.deploy-handshake-state.json');

function loadState() {
  return fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { results: {}, errors: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

const cmd = process.argv[2];

if (cmd === 'init') {
  saveState({ results: {}, errors: [] });
  console.log(JSON.stringify({ ok: true, steps: STEPS, viewId }));
  process.exit(0);
}

if (cmd === 'prepare') {
  const step = process.argv[4] ?? process.argv[3];
  if (step === undefined) {
    console.error('missing step');
    process.exit(1);
  }
  const payload = JSON.parse(
    fs.readFileSync(path.join(dir, `cdp-payload-${step}.json`), 'utf8')
  );
  payload.viewId = viewId;
  fs.writeFileSync(argsPath, JSON.stringify(payload));
  console.log(
    JSON.stringify({
      step,
      viewId,
      exprLen: payload.params.expression.length,
      argsPath,
    })
  );
  process.exit(0);
}

if (cmd === 'record') {
  const step = process.argv[3];
  const respPath = process.argv[4];
  const raw = JSON.parse(fs.readFileSync(respPath, 'utf8'));
  const value = raw?.result?.value ?? raw?.value ?? raw;
  const state = loadState();
  state.results[step] = value;
  if (step === 'run') {
    if (!value?.ok) state.errors.push({ step, reason: 'run not ok', value });
    else if (!value?.hasHeroV2) state.errors.push({ step, reason: 'missing hero', value });
  } else if (value?.len === undefined) {
    state.errors.push({ step, reason: 'no len', value });
  }
  saveState(state);
  console.log(JSON.stringify({ step, value, errors: state.errors }));
  process.exit(state.errors.length ? 1 : 0);
}

if (cmd === 'summary') {
  console.log(JSON.stringify(loadState(), null, 2));
  process.exit(0);
}

console.error('commands: init | prepare <step> | record <step> <file> | summary');
process.exit(1);
