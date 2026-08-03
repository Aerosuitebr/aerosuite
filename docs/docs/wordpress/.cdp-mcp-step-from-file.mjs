/**
 * Print browser_cdp args for step N (stdout). Agent: CallMcpTool -> save full response to .cdp-mcp-last-result.json -> node .cdp-record-mcp-result.mjs N
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const n = Number(process.argv[3]);
const viewId = process.argv[4] || '6eb035';

if (cmd === 'args') {
  const out = execSync(`node .cdp-save-step-args.mjs ${n} ${viewId}`, { cwd: dir, encoding: 'utf8' });
  process.stdout.write(fs.readFileSync(path.join(dir, '.cdp-mcp-last-args.json'), 'utf8'));
  process.exit(0);
}

if (cmd === 'record') {
  const proc = execSync(`node .cdp-record-mcp-result.mjs ${n}`, { cwd: dir, encoding: 'utf8' });
  process.stdout.write(proc);
  process.exit(0);
}

if (cmd === 'summary') {
  const statePath = path.join(dir, '.cdp-steps-run-state.json');
  const state = fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : { results: {}, errors: [] };
  const r = state.results;
  const out = {
    viewId: 'a9930e',
    activeViewId: viewId,
    cssFullRun: r[4] ?? null,
    cssVerify: r[5] ?? null,
    cssFinalize: r[6] ?? null,
    encInit: r[7] ?? null,
    enc0: r[13] ?? null,
    enc1: r[19] ?? null,
    enc2: r[25] ?? null,
    enc3: r[28] ?? null,
    encRun: r[29] ?? null,
    errors: state.errors,
  };
  console.log(JSON.stringify(out));
  process.exit(state.errors?.length ? 1 : 0);
}

console.error('usage: args|record|summary <n> [viewId]');
process.exit(2);
