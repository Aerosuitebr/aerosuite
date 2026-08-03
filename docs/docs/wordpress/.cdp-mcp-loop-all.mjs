/**
 * Poll orchestrator log, execute browser steps via reading .cdp-current-mcp-args.json
 * and writing .cdp-current-mcp-result.json from stdin (agent pipes MCP response).
 * For agent automation: node .cdp-mcp-loop-all.mjs wait-step
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.join(dir, '.cdp-orchestrate-run.log');
const argsPath = path.join(dir, '.cdp-current-mcp-args.json');
const resultPath = path.join(dir, '.cdp-current-mcp-result.json');

const cmd = process.argv[2];

if (cmd === 'wait-step') {
  const start = Date.now();
  let last = '';
  while (Date.now() - start < 120000) {
    const log = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';
    const m = log.match(/AWAIT_STEP (\d+)/g);
    const lastAwait = m ? m[m.length - 1] : null;
    if (lastAwait && lastAwait !== last) {
      const step = Number(lastAwait.replace('AWAIT_STEP ', ''));
      const ok = log.includes(`OK ${step}`);
      if (!ok && fs.existsSync(argsPath)) {
        console.log(JSON.stringify({ step, argsFile: argsPath }));
        process.exit(0);
      }
    }
    last = lastAwait || last;
    if (log.includes('FINAL ')) {
      console.log(JSON.stringify({ done: true, log: log.split('\n').slice(-3) }));
      process.exit(0);
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
  console.log(JSON.stringify({ error: 'timeout' }));
  process.exit(1);
}

if (cmd === 'write-result') {
  const raw = fs.readFileSync(0, 'utf8');
  fs.writeFileSync(resultPath, raw.trim());
  console.log('written');
}
