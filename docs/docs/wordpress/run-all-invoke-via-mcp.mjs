/**
 * Prepare sequential invoke steps; agent calls browser_cdp and save-mcp-result.mjs per step.
 * Usage: node run-all-invoke-via-mcp.mjs prep <step>
 *        node run-all-invoke-via-mcp.mjs finalize
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const STEPS = [
  'css-q1', 'css-q2', 'css-q3', 'css-q4',
  'css-verify', 'css-finalize',
  'enc-init', 'enc-0', 'enc-1', 'enc-2', 'enc-3', 'enc-run',
];
const viewId = process.env.VIEW_ID || '258c93';
const statePath = path.join(dir, '.invoke-mcp-run-state.json');

const cmd = process.argv[2];
const stepArg = process.argv[3];

if (cmd === 'prep') {
  const step = stepArg || STEPS[0];
  const params = JSON.parse(fs.readFileSync(path.join(dir, `.invoke-${step}.json`), 'utf8'));
  const args = { method: 'Runtime.evaluate', params, viewId };
  const rp = path.join(dir, '.cdp-current-mcp-result.json');
  if (fs.existsSync(rp)) fs.unlinkSync(rp);
  fs.writeFileSync(path.join(dir, '.cdp-current-mcp-args.json'), JSON.stringify(args));
  console.log(JSON.stringify({ step, viewId, exprLen: params.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'record') {
  const step = stepArg;
  const result = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-current-mcp-result.json'), 'utf8'));
  const value = result?.result?.value ?? result?.value ?? result;
  const state = fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { viewId, steps: {}, errors: [] };
  state.steps[step] = value;
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  console.log(JSON.stringify({ step, value }));
  process.exit(0);
}

if (cmd === 'finalize') {
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const summary = {
    viewId: state.viewId,
    cssVerify: state.steps['css-verify'] ?? null,
    cssFinalize: state.steps['css-finalize'] ?? null,
    encRun: state.steps['enc-run'] ?? null,
    errors: state.errors ?? [],
    steps: state.steps,
  };
  fs.writeFileSync(path.join(dir, 'deploy-invoke-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
  process.exit(0);
}

console.error('usage: prep|record|finalize');
process.exit(2);
