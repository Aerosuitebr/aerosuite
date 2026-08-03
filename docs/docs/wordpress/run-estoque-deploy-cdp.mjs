/**
 * Emite sequência de invocações CDP para deploy estoque (init já feito → chunks 1..n, upload, apply).
 * O agente executa cada linha via browser_cdp Runtime.evaluate.
 * Uso: node run-estoque-deploy-cdp.mjs [fromStep]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const from = Number(process.argv[2] ?? 1);
const j = JSON.parse(fs.readFileSync(path.join(dir, '.cdp-estoque-deploy-chunks.json'), 'utf8'));

const steps = [];
for (let i = from; i < j.chunks.length; i++) steps.push({ name: `chunk-${i}`, expr: j.chunks[i] });
steps.push({ name: 'upload', expr: j.upload });
steps.push({ name: 'apply', expr: j.apply });

const outDir = path.join(dir, 'steps-estoque-deploy');
fs.mkdirSync(outDir, { recursive: true });
steps.forEach((s, idx) => {
  const payload = {
    method: 'Runtime.evaluate',
    params: { awaitPromise: true, expression: s.expr, returnByValue: true },
    viewId: '3dbbe2',
  };
  fs.writeFileSync(path.join(outDir, `${idx}-${s.name}.json`), JSON.stringify(payload));
});
console.log(JSON.stringify({ from, total: steps.length, dir: outDir, steps: steps.map((s) => s.name) }));
