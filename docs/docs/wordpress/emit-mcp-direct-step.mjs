import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'a9930e';
const step = process.argv[3];

const mk = (expression) => ({
  server: 'cursor-ide-browser',
  toolName: 'browser_cdp',
  arguments: {
    viewId,
    method: 'Runtime.evaluate',
    params: { expression, awaitPromise: true, returnByValue: true },
  },
});

if (step?.startsWith('cssfull-batch-')) {
  const i = step.replace('cssfull-batch-', '');
  const expr = fs.readFileSync(path.join(dir, `.cssfull-batch-${i}.txt`), 'utf8').trim();
  const out = path.join(dir, `.mcp-${step}.json`);
  fs.writeFileSync(out, JSON.stringify(mk(expr)));
  console.log(out, expr.length);
} else if (step === 'cssfull-run') {
  const expr = fs.readFileSync(path.join(dir, '.cssfull-run.txt'), 'utf8').trim();
  const out = path.join(dir, '.mcp-cssfull-run.json');
  fs.writeFileSync(out, JSON.stringify(mk(expr)));
  console.log(out);
} else if (step === 'all-cssfull') {
  for (let i = 0; i < 4; i++) {
    const expr = fs.readFileSync(path.join(dir, `.cssfull-batch-${i}.txt`), 'utf8').trim();
    fs.writeFileSync(path.join(dir, `.mcp-cssfull-batch-${i}.json`), JSON.stringify(mk(expr)));
  }
  const run = fs.readFileSync(path.join(dir, '.cssfull-run.txt'), 'utf8').trim();
  fs.writeFileSync(path.join(dir, '.mcp-cssfull-run.json'), JSON.stringify(mk(run)));
  console.log('emitted cssfull 0-3 + run');
} else {
  console.error('usage: emit-mcp-direct-step.mjs [viewId] cssfull-batch-N|cssfull-run|all-cssfull');
  process.exit(1);
}
